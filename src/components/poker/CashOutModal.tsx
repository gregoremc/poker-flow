import { useState, useEffect } from 'react';
import { useTables } from '@/hooks/useTables';
import { useTransactions, useActiveSessions } from '@/hooks/useTransactions';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { useCashSession } from '@/hooks/useCashSession';
import { ActiveSession, PaymentMethod } from '@/types/poker';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CurrencyInput } from '@/components/poker/CurrencyInput';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, ChevronLeft, Smartphone, Banknote, CreditCard, Coins, AlertCircle } from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface CashOutModalProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
  sessionId?: string;
}

const PAYOUT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'pix', label: 'PIX', icon: <Smartphone className="h-4 w-4" /> },
  { value: 'cash', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: 'debit', label: 'Débito', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'fichas', label: 'Fichas', icon: <Coins className="h-4 w-4" /> },
];

export function CashOutModal({ open, onClose, tableId, sessionId }: CashOutModalProps) {
  const { tables } = useTables();
  const { addCashOut } = useTransactions();
  const { sessions: activeSessions } = useActiveSessions(tableId);
  const { credits, receivePayment } = useCreditRecords();
  const today = new Date().toISOString().split('T')[0];
  const { session } = useCashSession(today);
  
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [chipValue, setChipValue] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showDebtPrompt, setShowDebtPrompt] = useState(false);
  const [pendingCashOut, setPendingCashOut] = useState<any>(null);

  const tableName = tables.find((t) => t.id === tableId)?.name || 'Mesa';

  const profit = selectedSession && chipValue !== '' 
    ? Number(chipValue) - selectedSession.totalBuyIn 
    : 0;

  // Get player's unpaid credits
  const playerDebt = selectedSession
    ? credits.filter(c => c.player_id === selectedSession.playerId && !c.is_paid)
    : [];
  const totalDebt = playerDebt.reduce((sum, c) => sum + Number(c.amount), 0);

  const handleSubmit = () => {
    if (!selectedSession || chipValue === '' || Number(chipValue) < 0) return;
    
    const cashOutData = {
      table_id: tableId,
      player_id: selectedSession.playerId,
      chip_value: Number(chipValue),
      total_buy_in: selectedSession.totalBuyIn,
      profit,
      payment_method: paymentMethod,
      session_id: sessionId,
    };

    // Check if player has pending debts and chip_value > 0
    if (totalDebt > 0 && Number(chipValue) > 0) {
      setPendingCashOut(cashOutData);
      setShowDebtPrompt(true);
      return;
    }

    addCashOut(cashOutData);
    handleClose();
  };

  const handleDebtAbate = async () => {
    if (!pendingCashOut || !selectedSession) return;

    // First do the cash-out
    addCashOut(pendingCashOut);

    // Then abate the debt from cash-out value
    const abateValue = Math.min(Number(chipValue), totalDebt);
    let remaining = abateValue;
    
    for (const credit of playerDebt) {
      if (remaining <= 0) break;
      const payThis = Math.min(remaining, Number(credit.amount));
      await receivePayment({
        creditId: credit.id,
        paymentMethod: 'fichas' as PaymentMethod,
        sessionId: session?.id,
        amount: payThis,
      });
      remaining -= payThis;
    }

    setShowDebtPrompt(false);
    setPendingCashOut(null);
    handleClose();
  };

  const handleSkipDebt = () => {
    if (pendingCashOut) {
      addCashOut(pendingCashOut);
    }
    setShowDebtPrompt(false);
    setPendingCashOut(null);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSession(null);
    setChipValue('');
    setPaymentMethod('cash');
    setPendingCashOut(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedSession(null);
    setChipValue('');
    setPaymentMethod('cash');
  };

  const isValid = selectedSession && chipValue !== '' && Number(chipValue) >= 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="modal-solid sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedSession && (
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <ArrowUpRight className="h-5 w-5 text-gold" />
              Cash-out - {tableName}
            </DialogTitle>
          </DialogHeader>

          {!selectedSession ? (
            /* Player List */
            <ScrollArea className="max-h-[400px] py-4">
              <div className="space-y-2">
                {activeSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum jogador ativo nesta mesa
                  </p>
                ) : (
                  activeSessions.map((session) => {
                    const playerHasDebt = credits.some(
                      c => c.player_id === session.playerId && !c.is_paid
                    );
                    return (
                      <Button
                        key={session.playerId}
                        variant="outline"
                        className="w-full touch-target justify-between bg-input border-border hover:bg-accent group"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{session.playerName}</span>
                            {playerHasDebt && (
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {session.buyInCount} buy-in{session.buyInCount > 1 ? 's' : ''} • 
                            Desde {formatTime(session.startTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="money-value text-gold">
                            {formatCurrency(session.totalBuyIn)}
                          </span>
                          <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          ) : (
            /* Cash-out Form */
            <div className="space-y-6 py-4">
              {/* Player info */}
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="font-semibold text-lg">{selectedSession.playerName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Total em jogo:</span>
                  <span className="money-value text-gold text-lg">
                    {formatCurrency(selectedSession.totalBuyIn)}
                  </span>
                </div>
                {totalDebt > 0 && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-orange-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Fiado pendente:
                    </span>
                    <span className="money-value text-orange-500">
                      {formatCurrency(totalDebt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Chip value input with currency mask */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor das Fichas</Label>
                <CurrencyInput
                  value={chipValue}
                  onChange={setChipValue}
                  autoFocus
                />
              </div>

              {/* Payment method for payout */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYOUT_METHODS.map((method) => (
                    <Button
                      key={method.value}
                      type="button"
                      variant={paymentMethod === method.value ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(method.value)}
                      className={cn(
                        'touch-target flex items-center gap-2',
                        paymentMethod === method.value 
                          ? 'bg-primary' 
                          : 'bg-input border-border hover:bg-accent'
                      )}
                    >
                      {method.icon}
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Profit/Loss calculation */}
              {chipValue !== '' && (
                <div 
                  className={cn(
                    'p-4 rounded-lg border flex items-center justify-between',
                    profit > 0 
                      ? 'bg-success/10 border-success/30' 
                      : profit < 0 
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-secondary/50 border-border'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {profit > 0 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : profit < 0 ? (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    ) : (
                      <Minus className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {profit > 0 ? 'Lucro' : profit < 0 ? 'Prejuízo' : 'Empate'}
                    </span>
                  </div>
                  <span 
                    className={cn(
                      'money-value text-xl',
                      profit > 0 ? 'text-success' : profit < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedSession && (
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full touch-target text-lg font-semibold bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <ArrowUpRight className="mr-2 h-5 w-5" />
              Confirmar Cash-out
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Debt Abate Prompt */}
      <AlertDialog open={showDebtPrompt} onOpenChange={setShowDebtPrompt}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-500">
              <AlertCircle className="h-5 w-5" />
              Fiado Pendente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{selectedSession?.playerName}</strong> possui <strong className="text-orange-500">{formatCurrency(totalDebt)}</strong> em fiados pendentes.
              </p>
              <p>
                Deseja abater {formatCurrency(Math.min(Number(chipValue), totalDebt))} do valor do cash-out na dívida?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipDebt} className="bg-input border-border">
              Não, apenas cash-out
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDebtAbate}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Sim, abater na dívida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
