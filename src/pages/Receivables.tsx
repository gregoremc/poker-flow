import { useState } from 'react';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { usePlayers } from '@/hooks/usePlayers';
import { useCashSession } from '@/hooks/useCashSession';
import { PaymentMethod } from '@/types/poker';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/poker/CurrencyInput';
import { AlertCircle, Check, DollarSign, Loader2, User, Wallet, CreditCard } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'fichas', label: 'Fichas' },
];

interface CreditByPlayer {
  playerId: string;
  playerName: string;
  credits: Array<{
    id: string;
    amount: number;
    is_paid: boolean;
    paid_at: string | null;
    created_at: string;
  }>;
  totalUnpaid: number;
  totalPaid: number;
}

export default function Receivables() {
  const today = new Date().toISOString().split('T')[0];
  const { credits, paymentReceipts, isLoading, receivePayment, isReceiving } = useCreditRecords();
  const { players } = usePlayers();
  const { session } = useCashSession(today);

  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  // Group credits by player - only show players with unpaid credits
  const creditsByPlayer: CreditByPlayer[] = players
    .map((player) => {
      const playerCredits = credits.filter((c) => c.player_id === player.id);
      const unpaidCredits = playerCredits.filter((c) => !c.is_paid);
      
      return {
        playerId: player.id,
        playerName: player.name,
        credits: playerCredits,
        totalUnpaid: unpaidCredits.reduce((sum, c) => sum + Number(c.amount), 0),
        totalPaid: 0,
      };
    })
    .filter((p) => p.totalUnpaid > 0)
    .sort((a, b) => b.totalUnpaid - a.totalUnpaid);

  const totalReceivables = creditsByPlayer.reduce((sum, p) => sum + p.totalUnpaid, 0);

  const selectedPlayer = creditsByPlayer.find((p) => p.playerId === showPayModal);

  // Get partial payment log for a specific credit
  const getPaymentsForCredit = (creditId: string) => {
    return paymentReceipts.filter(r => r.credit_record_id === creditId);
  };

  const handleReceivePayment = async () => {
    if (!showPayModal || !paymentAmount || paymentAmount <= 0) return;

    // Find unpaid credits for this player and pay sequentially
    const unpaidCredits = credits.filter(
      (c) => c.player_id === showPayModal && !c.is_paid
    );

    let remainingAmount = Number(paymentAmount);
    for (const credit of unpaidCredits) {
      if (remainingAmount <= 0) break;
      
      const creditAmount = Number(credit.amount);
      const payThis = Math.min(remainingAmount, creditAmount);
      
      await receivePayment({
        creditId: credit.id,
        paymentMethod,
        sessionId: session?.id,
        amount: payThis,
      });
      remainingAmount -= payThis;
    }

    setPaymentAmount('');
    setPaymentMethod('pix');
    setShowPayModal(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">A Receber</h2>
            <p className="text-sm text-muted-foreground">Gestão de Fiados</p>
          </div>
        </div>

        {/* Total Card */}
        <Card className="card-glow border-orange-500/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total a Receber</p>
                  <p className="text-3xl font-bold text-orange-500 money-value">
                    {formatCurrency(totalReceivables)}
                  </p>
                </div>
              </div>
              <Wallet className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        {creditsByPlayer.length === 0 ? (
          <Card className="card-glow">
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum fiado pendente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {creditsByPlayer.map((playerData) => (
              <Card key={playerData.playerId} className="card-glow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {playerData.playerName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {playerData.totalUnpaid > 0 && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                          {formatCurrency(playerData.totalUnpaid)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Unpaid credits with partial payment log */}
                  {playerData.credits
                    .filter((c) => !c.is_paid)
                    .map((credit) => {
                      const partialPayments = getPaymentsForCredit(credit.id);
                      return (
                        <div key={credit.id} className="space-y-1">
                          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="money-value text-orange-500">
                                {formatCurrency(credit.amount)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(credit.created_at)}
                              </span>
                            </div>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                              Pendente
                            </Badge>
                          </div>
                          {/* Partial payment log - blue style */}
                          {partialPayments.length > 0 && (
                            <div className="ml-6 space-y-1">
                              {partialPayments.map((receipt) => (
                                <div
                                  key={receipt.id}
                                  className="flex items-center justify-between py-1.5 px-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-3 w-3 text-blue-500" />
                                    <span className="text-blue-500 font-medium">
                                      Abatimento: {formatCurrency(Number(receipt.amount))}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {formatDateTime(receipt.created_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Receive Payment Button */}
                  {playerData.totalUnpaid > 0 && (
                    <Button
                      onClick={() => {
                        setShowPayModal(playerData.playerId);
                        setPaymentAmount(playerData.totalUnpaid);
                      }}
                      className="w-full mt-2 bg-success text-success-foreground hover:bg-success/90"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Receber Pagamento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Receive Payment Modal */}
      <Dialog open={!!showPayModal} onOpenChange={() => setShowPayModal(null)}>
        <DialogContent className="modal-solid sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Receber Pagamento - {selectedPlayer?.playerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPlayer && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Pendente:</span>
                  <span className="money-value text-orange-500 font-bold">
                    {formatCurrency(selectedPlayer.totalUnpaid)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Valor do Pagamento</Label>
              <CurrencyInput
                value={paymentAmount}
                onChange={setPaymentAmount}
              />
              <p className="text-xs text-muted-foreground">
                Pode ser parcial. A dívida será abatida proporcionalmente.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleReceivePayment}
            disabled={!paymentAmount || paymentAmount <= 0 || isReceiving}
            className="w-full touch-target bg-success text-success-foreground hover:bg-success/90"
          >
            {isReceiving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            Confirmar Recebimento
            {paymentAmount ? <span className="ml-2 opacity-80">{formatCurrency(Number(paymentAmount))}</span> : null}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
