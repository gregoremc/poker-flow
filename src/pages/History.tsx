import { useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useTables } from '@/hooks/useTables';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowDownLeft, ArrowUpRight, Clock, Filter, CalendarIcon, Trash2, Gift, Users, LayoutGrid, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatTime, getPaymentMethodLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types/poker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterType = 'all' | 'buy-in' | 'cash-out' | 'dealer-tip';

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { transactions, buyIns, deleteBuyIn, deleteCashOut } = useTransactions(dateStr);
  const { tables } = useTables();
  const [filter, setFilter] = useState<FilterType>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string; isFiado?: boolean } | null>(null);

  // Get unique tables from transactions
  const transactionTables = useMemo(() => {
    const tableIds = new Set<string>();
    transactions.forEach(t => {
      if (t.table_id) tableIds.add(t.table_id);
    });
    return tables.filter(t => tableIds.has(t.id));
  }, [transactions, tables]);

  // Check if a buy-in is fiado
  const isBuyInFiado = (id: string) => {
    const buyIn = buyIns.find(b => b.id === id);
    return buyIn?.payment_method === 'credit_fiado';
  };

  // Group transactions by hour
  const groupedTransactions = useMemo(() => {
    let filtered = filter === 'all' 
      ? transactions 
      : transactions.filter((t) => t.type === filter);

    // Apply table filter
    if (tableFilter !== 'all') {
      filtered = filtered.filter((t) => t.table_id === tableFilter);
    }

    const groups = new Map<string, Transaction[]>();
    
    for (const transaction of filtered) {
      const date = new Date(transaction.timestamp);
      const hour = date.toLocaleString('pt-BR', { 
        hour: '2-digit',
        minute: '2-digit'
      }).split(':')[0] + ':00';
      
      if (!groups.has(hour)) {
        groups.set(hour, []);
      }
      groups.get(hour)!.push(transaction);
    }

    return Array.from(groups.entries()).map(([hour, transactions]) => ({
      hour,
      transactions,
      total: transactions.reduce((sum, t) => {
        if (t.type === 'buy-in') return sum + t.amount;
        if (t.type === 'cash-out') return sum - t.amount;
        return sum;
      }, 0),
    }));
  }, [transactions, filter, tableFilter]);

  const handleDeleteClick = (id: string, type: string) => {
    const isFiado = type === 'buy-in' && isBuyInFiado(id);
    setDeleteConfirm({ id, type, isFiado });
  };

  const handleDelete = (id: string, type: string) => {
    if (type === 'buy-in') {
      deleteBuyIn(id);
    } else if (type === 'cash-out') {
      deleteCashOut(id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6">
        {/* Date Picker and Table Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-input border-border">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {/* Table Filter */}
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[160px] bg-input border-border">
              <LayoutGrid className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Todas as mesas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as mesas</SelectItem>
              {transactionTables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
                  {table.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(
              filter === 'all' ? 'bg-primary' : 'bg-input border-border'
            )}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'buy-in' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('buy-in')}
            className={cn(
              filter === 'buy-in' ? 'bg-success text-success-foreground' : 'bg-input border-border'
            )}
          >
            Buy-ins
          </Button>
          <Button
            variant={filter === 'cash-out' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('cash-out')}
            className={cn(
              filter === 'cash-out' ? 'bg-gold text-gold-foreground' : 'bg-input border-border'
            )}
          >
            Cash-outs
          </Button>
          <Button
            variant={filter === 'dealer-tip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('dealer-tip')}
            className={cn(
              filter === 'dealer-tip' ? 'bg-purple-600 text-white' : 'bg-input border-border'
            )}
          >
            Caixinhas
          </Button>
        </div>

        {/* Transaction list */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-6">
            {groupedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma transação registrada
                </p>
              </div>
            ) : (
              groupedTransactions.map(({ hour, transactions, total }) => (
                <div key={hour}>
                  {/* Hour header */}
                  <div className="flex items-center justify-between mb-3 sticky top-0 bg-background py-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {hour}
                      </span>
                    </div>
                    <span 
                      className={cn(
                        'money-value text-sm',
                        total >= 0 ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {total >= 0 ? '+' : ''}{formatCurrency(total)}
                    </span>
                  </div>

                  {/* Transactions in this hour */}
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="card-glow group">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className={cn(
                                  'p-2 rounded-lg',
                                  transaction.type === 'buy-in' 
                                    ? 'bg-success/10' 
                                    : transaction.type === 'dealer-tip'
                                    ? 'bg-purple-500/10'
                                    : 'bg-gold/10'
                                )}
                              >
                                {transaction.type === 'buy-in' ? (
                                  <ArrowDownLeft className="h-4 w-4 text-success" />
                                ) : transaction.type === 'dealer-tip' ? (
                                  <Users className="h-4 w-4 text-purple-500" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-gold" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {transaction.type === 'dealer-tip' 
                                      ? transaction.dealer_name 
                                      : transaction.player_name}
                                  </p>
                                  {transaction.is_bonus && (
                                    <Gift className="h-3 w-3 text-purple-500" />
                                  )}
                                  {transaction.payment_method === 'credit_fiado' && (
                                    <Badge variant="outline" className="text-2xs border-orange-500 text-orange-500">
                                      Fiado
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {transaction.table_name && <span>{transaction.table_name}</span>}
                                  {transaction.table_name && <span>•</span>}
                                  <span>{formatTime(transaction.timestamp)}</span>
                                  {transaction.payment_method && transaction.payment_method !== 'credit_fiado' && (
                                    <>
                                      <span>•</span>
                                      <span>{getPaymentMethodLabel(transaction.payment_method)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p 
                                  className={cn(
                                    'money-value text-lg',
                                    transaction.type === 'buy-in' ? 'text-success' : 
                                    transaction.type === 'dealer-tip' ? 'text-purple-500' : 'text-gold'
                                  )}
                                >
                                  {transaction.type === 'buy-in' ? '+' : transaction.type === 'cash-out' ? '-' : ''}
                                  {formatCurrency(transaction.amount)}
                                </p>
                                {transaction.type === 'cash-out' && transaction.profit !== undefined && (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      'text-2xs',
                                      transaction.profit >= 0 
                                        ? 'bg-success/10 text-success' 
                                        : 'bg-destructive/10 text-destructive'
                                    )}
                                  >
                                    {transaction.profit >= 0 ? '+' : ''}{formatCurrency(transaction.profit)}
                                  </Badge>
                                )}
                              </div>
                              {transaction.type !== 'dealer-tip' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(transaction.id, transaction.type)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      <BottomNav />

      {/* Delete Confirmation with Smart Rollback Warning */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Desfazer Transação
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Deseja desfazer este {deleteConfirm?.type === 'buy-in' ? 'buy-in' : 'cash-out'}?
              </p>
              {deleteConfirm?.isFiado && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-500 text-sm">
                  <strong>Atenção:</strong> Este buy-in foi feito com Fiado. Ao excluir, o saldo de crédito do jogador será automaticamente revertido.
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                O saldo do jogador e os totais da mesa serão atualizados automaticamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-input border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id, deleteConfirm.type)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desfazer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
