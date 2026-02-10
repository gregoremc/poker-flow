import { useMemo, useState } from 'react';
import { useAuditLogs, AuditFilterCategory, FINANCIAL_EVENTS, SYSTEM_EVENTS, CANCELLED_EVENTS } from '@/hooks/useAuditLogs';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  ArrowDownLeft, ArrowUpRight, Clock, Filter, CalendarIcon,
  Undo2, Users, LayoutGrid, AlertTriangle, FileText,
  UserMinus, XCircle, Plus, Minus, DollarSign, CreditCard,
  Landmark
} from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuditLog } from '@/hooks/useAuditLogs';

// Color & icon config per event type
const EVENT_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
}> = {
  // Financial - green tones
  buy_in_created: {
    icon: <ArrowDownLeft className="h-4 w-4" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    label: 'Buy-in',
  },
  cash_out_created: {
    icon: <ArrowUpRight className="h-4 w-4" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    label: 'Cash-out',
  },
  dealer_tip_created: {
    icon: <Users className="h-4 w-4" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    label: 'Caixinha',
  },
  rake_created: {
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    label: 'Rake',
  },
  dealer_payout: {
    icon: <CreditCard className="h-4 w-4" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    label: 'Quitação Dealer',
  },
  credit_paid: {
    icon: <Landmark className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
    label: 'Fiado Quitado',
  },

  // Cancelled - red tones
  buy_in_cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Estorno Buy-in',
  },
  cash_out_cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Estorno Cash-out',
  },
  dealer_tip_cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Estorno Caixinha',
  },
  rake_cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Estorno Rake',
  },

  // System - blue tones
  session_opened: {
    icon: <Plus className="h-4 w-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Caixa Aberto',
  },
  session_closed: {
    icon: <Minus className="h-4 w-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    label: 'Caixa Fechado',
  },
  session_reopened: {
    icon: <Undo2 className="h-4 w-4" />,
    color: 'text-blue-300',
    bgColor: 'bg-blue-300/10',
    label: 'Caixa Reaberto',
  },
  session_deleted: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Caixa Excluído',
  },
  table_created: {
    icon: <LayoutGrid className="h-4 w-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Mesa Criada',
  },
  table_deleted: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Mesa Excluída',
  },
  player_deleted: {
    icon: <UserMinus className="h-4 w-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'Jogador Removido',
  },
};

const DEFAULT_CONFIG = {
  icon: <FileText className="h-4 w-4" />,
  color: 'text-muted-foreground',
  bgColor: 'bg-muted',
  label: 'Sistema',
};

function getConfig(eventType: string) {
  return EVENT_CONFIG[eventType] || DEFAULT_CONFIG;
}

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { auditLogs, isLoading, undoAction, isUndoing, isUndoable } = useAuditLogs(dateStr);
  const [filter, setFilter] = useState<AuditFilterCategory>('all');
  const [undoConfirm, setUndoConfirm] = useState<AuditLog | null>(null);

  // Filter logs by category
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return auditLogs;
    if (filter === 'financial') return auditLogs.filter(l => FINANCIAL_EVENTS.includes(l.event_type));
    if (filter === 'system') return auditLogs.filter(l => SYSTEM_EVENTS.includes(l.event_type));
    if (filter === 'cancelled') return auditLogs.filter(l => CANCELLED_EVENTS.includes(l.event_type));
    return auditLogs;
  }, [auditLogs, filter]);

  // Group by hour
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, AuditLog[]>();

    for (const log of filteredLogs) {
      const date = new Date(log.created_at);
      const hour = date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }).split(':')[0] + ':00';

      if (!groups.has(hour)) groups.set(hour, []);
      groups.get(hour)!.push(log);
    }

    return Array.from(groups.entries()).map(([hour, logs]) => ({ hour, logs }));
  }, [filteredLogs]);

  const handleUndo = (log: AuditLog) => {
    setUndoConfirm(log);
  };

  const confirmUndo = () => {
    if (undoConfirm) {
      undoAction(undoConfirm);
      setUndoConfirm(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6">
        {/* Date Picker */}
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

          <Badge variant="secondary" className="text-xs">
            {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(filter === 'all' ? 'bg-primary' : 'bg-input border-border')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'financial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('financial')}
            className={cn(filter === 'financial' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-input border-border')}
          >
            💰 Financeiro
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('cancelled')}
            className={cn(filter === 'cancelled' ? 'bg-destructive text-destructive-foreground' : 'bg-input border-border')}
          >
            ❌ Estornos
          </Button>
          <Button
            variant={filter === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('system')}
            className={cn(filter === 'system' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-input border-border')}
          >
            ⚙️ Sistema
          </Button>
        </div>

        {/* Audit log list */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : groupedLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            ) : (
              groupedLogs.map(({ hour, logs }) => (
                <div key={hour}>
                  {/* Hour header */}
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background py-2 z-10">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{hour}</span>
                    <Badge variant="outline" className="text-2xs">{logs.length}</Badge>
                  </div>

                  {/* Log entries */}
                  <div className="space-y-2">
                    {logs.map((log) => {
                      const config = getConfig(log.event_type);
                      const amount = log.metadata?.amount || log.metadata?.chip_value;
                      const canUndo = isUndoable(log.event_type);

                      return (
                        <Card key={log.id} className={cn('border group', canUndo ? 'hover:border-primary/50' : '')}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className={cn('p-2 rounded-lg', config.bgColor, config.color)}>
                                {config.icon}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{log.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{formatTime(log.created_at)}</span>
                                  <span>•</span>
                                  <Badge variant="outline" className={cn('text-2xs', config.color)}>
                                    {config.label}
                                  </Badge>
                                  {log.metadata?.table_name && (
                                    <>
                                      <span>•</span>
                                      <span>{log.metadata.table_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Amount */}
                              {amount && Number(amount) > 0 && (
                                <span className={cn('money-value text-sm font-semibold whitespace-nowrap', config.color)}>
                                  {formatCurrency(Number(amount))}
                                </span>
                              )}

                              {/* Undo button */}
                              {canUndo && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  onClick={() => handleUndo(log)}
                                  disabled={isUndoing}
                                  title="Desfazer - Restaurar registro original"
                                >
                                  <Undo2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      <BottomNav />

      {/* Undo Confirmation */}
      <AlertDialog open={!!undoConfirm} onOpenChange={() => setUndoConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-primary" />
              {undoConfirm?.event_type.endsWith('_created') ? 'Reverter Ação' : 'Desfazer Estorno'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {undoConfirm?.event_type.endsWith('_created')
                  ? 'Deseja reverter esta operação? O registro será excluído e o jogador voltará ao estado anterior.'
                  : 'Deseja restaurar o registro original?'}
              </p>
              {undoConfirm && (
                <div className={cn(
                  'p-3 border rounded-lg text-sm',
                  undoConfirm.event_type.endsWith('_created')
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-primary/10 border-primary/30'
                )}>
                  <p className="font-medium">{undoConfirm.description}</p>
                  {(undoConfirm.metadata?.amount || undoConfirm.metadata?.chip_value) && (
                    <p className="text-muted-foreground mt-1">
                      Valor: {formatCurrency(Number(undoConfirm.metadata.amount || undoConfirm.metadata.chip_value))}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-destructive font-medium">
                ⚠️ {undoConfirm?.event_type.endsWith('_created')
                  ? 'O registro será removido e os saldos recalculados.'
                  : 'O registro será reinserido e os saldos recalculados.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-input border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUndo}
              className={cn(
                undoConfirm?.event_type.endsWith('_created')
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              disabled={isUndoing}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              {undoConfirm?.event_type.endsWith('_created') ? 'Reverter' : 'Desfazer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
