import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { useCashSession } from '@/hooks/useCashSession';
import { PaymentMethod } from '@/types/poker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Plus, ArrowDownLeft, ArrowUpRight, AlertCircle, Trash2, Check, Loader2 } from 'lucide-react';
import { formatCurrency, formatTime, getPaymentMethodLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlayerDetailModalProps {
  open: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  tableId: string;
  tableName: string;
  onNewBuyIn: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'fichas', label: 'Fichas' },
];

export function PlayerDetailModal({
  open,
  onClose,
  playerId,
  playerName,
  tableId,
  tableName,
  onNewBuyIn,
}: PlayerDetailModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const { session } = useCashSession(today);
  const { credits, receivePayment, isReceiving } = useCreditRecords();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const queryClient = useQueryClient();

  // Double confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'buy-in' | 'cash-out';
    id: string;
    amount: number;
    paymentMethod?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch player transactions for this table in current session
  const { data: buyIns = [] } = useQuery({
    queryKey: ['player-buyins', playerId, tableId, session?.id],
    queryFn: async () => {
      let query = supabase
        .from('buy_ins')
        .select('*')
        .eq('player_id', playerId)
        .eq('table_id', tableId)
        .order('created_at', { ascending: false });

      if (session?.id) {
        query = query.eq('session_id', session.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open && !!playerId,
  });

  const { data: cashOuts = [] } = useQuery({
    queryKey: ['player-cashouts', playerId, tableId, session?.id],
    queryFn: async () => {
      let query = supabase
        .from('cash_outs')
        .select('*')
        .eq('player_id', playerId)
        .eq('table_id', tableId)
        .order('created_at', { ascending: false });

      if (session?.id) {
        query = query.eq('session_id', session.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open && !!playerId,
  });

  const playerUnpaidCredits = credits.filter(
    c => c.player_id === playerId && !c.is_paid
  );

  const totalBuyIns = buyIns.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalCashOuts = cashOuts.reduce((sum, c) => sum + Number(c.chip_value), 0);
  const totalFiado = playerUnpaidCredits.reduce((sum, c) => sum + Number(c.amount), 0);

  const handlePayCredit = async (creditId: string) => {
    await receivePayment({
      creditId,
      paymentMethod,
      sessionId: session?.id,
    });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-outs'] });
    queryClient.invalidateQueries({ queryKey: ['player-buyins'] });
    queryClient.invalidateQueries({ queryKey: ['player-cashouts'] });
    queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['credit-records'] });
    queryClient.invalidateQueries({ queryKey: ['cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['table-total'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const handleDeleteBuyIn = async (id: string) => {
    setIsDeleting(true);
    try {
      // Get buy-in details
      const { data: buyIn, error: fetchError } = await supabase
        .from('buy_ins')
        .select('*, player:players(*), table:tables(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Track cancelled buy-in
      await supabase.from('cancelled_buy_ins').insert([{
        original_buy_in_id: buyIn.id,
        player_id: buyIn.player_id,
        player_name: playerName,
        table_id: buyIn.table_id,
        table_name: tableName,
        session_id: buyIn.session_id,
        amount: buyIn.amount,
        payment_method: buyIn.payment_method,
      }]);

      // If credit_fiado, revert credit balance
      if (buyIn.payment_method === 'credit_fiado') {
        const { data: creditRecord } = await supabase
          .from('credit_records')
          .select('*')
          .eq('buy_in_id', id)
          .maybeSingle();

        if (creditRecord && !creditRecord.is_paid) {
          await supabase
            .from('players')
            .update({
              credit_balance: Math.max(0, (buyIn.player?.credit_balance || 0) - creditRecord.amount)
            })
            .eq('id', buyIn.player_id);
        }
      }

      // Delete buy-in (cascades credit_records)
      const { error } = await supabase.from('buy_ins').delete().eq('id', id);
      if (error) throw error;

      invalidateAll();
      toast.success('Buy-in excluído e saldos revertidos!');
    } catch (error) {
      toast.error('Erro ao excluir buy-in');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCashOut = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('cash_outs').delete().eq('id', id);
      if (error) throw error;

      invalidateAll();
      toast.success('Cash-out excluído!');
    } catch (error) {
      toast.error('Erro ao excluir cash-out');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'buy-in') {
      handleDeleteBuyIn(deleteConfirm.id);
    } else {
      handleDeleteCashOut(deleteConfirm.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="modal-solid sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {playerName} - {tableName}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Buy-ins</p>
                    <p className="money-value text-lg text-success">{formatCurrency(totalBuyIns)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Cash-outs</p>
                    <p className="money-value text-lg text-destructive">{formatCurrency(totalCashOuts)}</p>
                  </CardContent>
                </Card>
                {totalFiado > 0 && (
                  <Card className="border-orange-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Fiado</p>
                      <p className="money-value text-lg text-orange-500">{formatCurrency(totalFiado)}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Transactions */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Transações desta sessão</h3>
                {buyIns.map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-success/10 border border-success/20 group">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                      <span className="text-sm">Buy-in</span>
                      <Badge variant="secondary" className="text-xs">{getPaymentMethodLabel(b.payment_method)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="money-value text-success">{formatCurrency(Number(b.amount))}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(b.created_at)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() => setDeleteConfirm({
                          type: 'buy-in',
                          id: b.id,
                          amount: Number(b.amount),
                          paymentMethod: b.payment_method,
                        })}
                        title="Excluir buy-in"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cashOuts.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20 group">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Cash-out</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="money-value text-destructive">{formatCurrency(Number(c.chip_value))}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() => setDeleteConfirm({
                          type: 'cash-out',
                          id: c.id,
                          amount: Number(c.chip_value),
                        })}
                        title="Excluir cash-out"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {buyIns.length === 0 && cashOuts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação nesta sessão</p>
                )}
              </div>

              {/* Unpaid Credits */}
              {playerUnpaidCredits.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-orange-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Fiados Pendentes
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-xs">Forma de pagamento para quitação:</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger className="bg-input border-border h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {playerUnpaidCredits.map(credit => (
                    <div key={credit.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="money-value text-orange-500">{formatCurrency(Number(credit.amount))}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePayCredit(credit.id)}
                        disabled={isReceiving}
                        className="bg-success text-success-foreground hover:bg-success/90 h-7"
                      >
                        {isReceiving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Quitar
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onClose();
                onNewBuyIn();
              }}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Buy-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Double Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir este <strong>{deleteConfirm?.type === 'buy-in' ? 'buy-in' : 'cash-out'}</strong>?
              </p>
              {deleteConfirm && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
                  <p className="font-medium">Jogador: {playerName}</p>
                  <p className="font-medium">Mesa: {tableName}</p>
                  <p className="text-muted-foreground mt-1">
                    Valor: {formatCurrency(deleteConfirm.amount)}
                  </p>
                  {deleteConfirm.paymentMethod && (
                    <p className="text-muted-foreground">
                      Pagamento: {getPaymentMethodLabel(deleteConfirm.paymentMethod as PaymentMethod)}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-destructive font-medium">
                ⚠️ Esta ação irá reverter os saldos. O registro ficará disponível no Histórico para desfazer se necessário.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-input border-border" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
