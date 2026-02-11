import { useState } from 'react';
import { useTables } from '@/hooks/useTables';
import { useCashSession } from '@/hooks/useCashSession';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { TableCard } from '@/components/poker/TableCard';
import { BuyInModal } from '@/components/poker/BuyInModal';
import { CashOutModal } from '@/components/poker/CashOutModal';
import { AddTableModal } from '@/components/poker/AddTableModal';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const today = new Date().toISOString().split('T')[0];
  const { session, isSessionOpen, isLoading: loadingSession } = useCashSession(today);
  const { tables, isLoading } = useTables(session?.id);
  const [buyInTableId, setBuyInTableId] = useState<string | null>(null);
  const [cashOutTableId, setCashOutTableId] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);

  const activeTables = tables.filter((t) => t.is_active);
  const inactiveTables = tables.filter((t) => !t.is_active);

  if (isLoading || loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6">
        {/* Warning if no open session */}
        {!isSessionOpen && (
          <div className="p-3 rounded-lg bg-muted border border-border flex items-center gap-2 mb-6">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Nenhum caixa aberto. Abra um caixa na aba "Caixa" antes de criar mesas.
            </span>
          </div>
        )}

        {/* Quick Add Table */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">
              Mesas Ativas ({activeTables.length})
            </h2>
            {session && (
              <p className="text-xs text-muted-foreground">{session.name}</p>
            )}
          </div>
          <Button
            onClick={() => {
              if (!isSessionOpen) {
                toast.error('Caixa Fechado. Abra o caixa para operar as mesas.');
                return;
              }
              setShowAddTable(true);
            }}
            size="sm"
            className="bg-primary hover:bg-primary/90"
            disabled={!isSessionOpen}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Mesa
          </Button>
        </div>

        {/* Active Tables */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {activeTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onBuyIn={setBuyInTableId}
              onCashOut={setCashOutTableId}
            />
          ))}
          {activeTables.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma mesa ativa no momento
              </p>
              {isSessionOpen && (
                <Button
                  onClick={() => setShowAddTable(true)}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira mesa
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Inactive Tables */}
        {inactiveTables.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Mesas Inativas ({inactiveTables.length})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inactiveTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onBuyIn={setBuyInTableId}
                  onCashOut={setCashOutTableId}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Modals */}
      <BuyInModal
        open={!!buyInTableId}
        onClose={() => setBuyInTableId(null)}
        tableId={buyInTableId || ''}
        sessionId={session?.id}
      />
      <CashOutModal
        open={!!cashOutTableId}
        onClose={() => setCashOutTableId(null)}
        tableId={cashOutTableId || ''}
        sessionId={session?.id}
      />
      {session && (
        <AddTableModal
          open={showAddTable}
          onClose={() => setShowAddTable(false)}
          sessionId={session.id}
        />
      )}
    </div>
  );
}
