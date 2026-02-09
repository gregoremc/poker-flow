import { useState, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCashSession } from '@/hooks/useCashSession';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { OpenSessionModal } from '@/components/poker/OpenSessionModal';
import { DeleteSessionModal } from '@/components/poker/DeleteSessionModal';
import { SessionSelector } from '@/components/poker/SessionSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, TrendingDown, CalendarIcon, Gift, AlertCircle, Users, Lock, LockOpen, Play, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CloseCashModal } from '@/components/poker/CloseCashModal';
import { CashSession } from '@/types/poker';

export default function CashControl() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<CashSession | null>(null);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { 
    sessions,
    session,
    hasAnySessions,
    hasMultipleSessions,
    isSessionOpen, 
    isSessionClosed,
    openSessionAsync,
    reopenSession, 
    deleteSessionAsync,
    isOpening,
    isClosing,
    isDeleting
  } = useCashSession(dateStr, selectedSessionId);
  const { dailySummary, buyIns, isLoading } = useTransactions(dateStr, session?.id);
  const { credits, totalUnpaid: totalCreditsGlobal } = useCreditRecords();
  
  // Filter credits by session date only
  const totalCredits = credits
    .filter(c => !c.is_paid && c.created_at.startsWith(dateStr))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Auto-select first session when date changes
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const openSession = sessions.find(s => s.is_open);
      setSelectedSessionId(openSession?.id || sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // Reset selection when date changes
  useEffect(() => {
    setSelectedSessionId(null);
  }, [dateStr]);

  // Calculate payment method breakdown
  const paymentBreakdown = buyIns.reduce(
    (acc, b) => {
      const method = b.payment_method;
      acc[method] = (acc[method] || 0) + Number(b.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    cash: 'Dinheiro',
    debit: 'Débito',
    credit: 'Crédito',
    credit_fiado: 'Fiado',
    bonus: 'Bônus',
  };

  const handleOpenSession = async (name: string, responsible: string) => {
    await openSessionAsync({ name, responsible });
  };

  const handleDeleteSession = (sessionToDelete: CashSession) => {
    setSessionToDelete(sessionToDelete);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSessionAsync(sessionToDelete.id);
      setSessionToDelete(null);
      setShowDeleteModal(false);
      // Reset selection if we deleted the selected session
      if (sessionToDelete.id === selectedSessionId) {
        setSelectedSessionId(null);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6 space-y-6">
        {/* Date Picker + Session Actions */}
        <div className="flex items-center justify-between">
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

          {/* Session controls */}
          <div className="flex items-center gap-2">
            {/* Always show "Add Session" if there are already sessions */}
            {hasAnySessions && (
              <Button 
                variant="outline"
                onClick={() => setShowOpenModal(true)}
                className="bg-input border-border"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Caixa
              </Button>
            )}

            {!hasAnySessions ? (
              <Button 
                onClick={() => setShowOpenModal(true)}
                disabled={isOpening}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                <Play className="mr-2 h-4 w-4" />
                {isOpening ? 'Abrindo...' : 'Abrir Caixa'}
              </Button>
            ) : isSessionClosed && session ? (
              <Button 
                variant="outline" 
                onClick={() => reopenSession(session.id)}
                className="bg-input border-border"
              >
                <LockOpen className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            ) : isSessionOpen && session ? (
              <Button 
                onClick={() => setShowCloseModal(true)}
                disabled={isClosing}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                <Lock className="mr-2 h-4 w-4" />
                {isClosing ? 'Fechando...' : 'Fechar Caixa'}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Session Selector (when multiple sessions exist) */}
        {hasAnySessions && (
          <SessionSelector
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {/* Session Status Messages */}
        {!hasAnySessions && (
          <div className="p-3 rounded-lg bg-muted border border-border flex items-center gap-2">
            <Play className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Nenhum caixa aberto para {format(selectedDate, "dd/MM/yyyy")}. Clique em "Abrir Caixa" para iniciar.
            </span>
          </div>
        )}

        {session && isSessionClosed && (
          <div className="p-3 rounded-lg bg-muted border border-border flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              "{session.name}" fechado em {session.closed_at ? format(new Date(session.closed_at), "dd/MM 'às' HH:mm") : 'data desconhecida'}
            </span>
          </div>
        )}

        {session && isSessionOpen && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
            <Play className="h-4 w-4 text-success" />
            <span className="text-sm text-success">
              "{session.name}" aberto desde {format(new Date(session.created_at), "HH:mm")}
            </span>
          </div>
        )}

        {/* Main Balance Card */}
        <Card className="card-glow border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Saldo do Dia
              </p>
              <div className="flex items-center justify-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <span 
                  className={cn(
                    'money-value text-5xl',
                    dailySummary.balance >= 0 ? 'text-gold' : 'text-destructive'
                  )}
                >
                  {formatCurrency(dailySummary.balance)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {dailySummary.balance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">
                  {dailySummary.balance >= 0 ? 'Lucro' : 'Prejuízo'} operacional
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real Balance (excluding bonuses and fiado) */}
        {(dailySummary.totalBonuses > 0 || dailySummary.totalCredits > 0) && (
          <Card className="card-glow border-orange-500/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium">Saldo Real (Caixa Físico)</span>
                </div>
                <span className={cn(
                  'money-value text-xl',
                  dailySummary.realBalance >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(dailySummary.realBalance)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Exclui bônus ({formatCurrency(dailySummary.totalBonuses)}) e fiado ({formatCurrency(dailySummary.totalCredits)})
              </p>
            </CardContent>
          </Card>
        )}

        {/* In/Out Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="card-glow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-5 w-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Entradas</span>
              </div>
              <p className="money-value text-2xl text-success">
                {formatCurrency(dailySummary.totalBuyIns)}
              </p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">Saídas</span>
              </div>
              <p className="money-value text-2xl text-destructive">
                {formatCurrency(dailySummary.totalCashOuts)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Special entries */}
        <div className="grid grid-cols-2 gap-4">
          {dailySummary.totalBonuses > 0 && (
            <Card className="card-glow border-purple-500/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Bônus</span>
                </div>
                <p className="money-value text-xl text-purple-500">
                  {formatCurrency(dailySummary.totalBonuses)}
                </p>
              </CardContent>
            </Card>
          )}

          {totalCredits > 0 && (
            <Card className="card-glow border-orange-500/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Contas a Receber</span>
                </div>
                <p className="money-value text-xl text-orange-500">
                  {formatCurrency(totalCredits)}
                </p>
              </CardContent>
            </Card>
          )}

          {dailySummary.totalDealerTips > 0 && (
            <Card className="card-glow border-gold/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gold" />
                  <span className="text-sm text-muted-foreground">Caixinhas Dealers</span>
                </div>
                <p className="money-value text-xl text-gold">
                  {formatCurrency(dailySummary.totalDealerTips)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg">Entradas por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma entrada registrada
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(paymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {paymentLabels[method] || method}
                    </span>
                    <span className="money-value text-lg">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />

      {/* Modals */}
      <OpenSessionModal
        open={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onConfirm={handleOpenSession}
        isLoading={isOpening}
      />

      <DeleteSessionModal
        session={sessionToDelete}
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      {showCloseModal && session && (
        <CloseCashModal 
          open={true}
          onClose={() => setShowCloseModal(false)}
          session={session}
        />
      )}
    </div>
  );
}
