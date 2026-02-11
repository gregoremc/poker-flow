import { useState } from 'react';
import { Table } from '@/types/poker';
import { useTables } from '@/hooks/useTables';
import { useTableTotal, useActiveSessions } from '@/hooks/useTransactions';
import { useCashSession } from '@/hooks/useCashSession';
import { PlayerDetailModal } from '@/components/poker/PlayerDetailModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Users, ArrowUpRight, Power, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface TableCardProps {
  table: Table;
  onBuyIn: (tableId: string) => void;
  onCashOut: (tableId: string) => void;
}

export function TableCard({ table, onBuyIn, onCashOut }: TableCardProps) {
  const { toggleTable, deleteTable } = useTables();
  const totalBuyIns = useTableTotal(table.id);
  const { sessions: activeSessions } = useActiveSessions(table.id);
  const today = new Date().toISOString().split('T')[0];
  const { isSessionOpen } = useCashSession(today);
  const playerCount = activeSessions.length;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = () => {
    deleteTable(table.id);
    setDeleteConfirm(false);
  };

  const handleToggle = () => {
    // Block reactivating table if cash is closed
    if (!table.is_active && !isSessionOpen) {
      toast.error('Caixa Fechado. Abra o caixa para operar as mesas.');
      return;
    }
    toggleTable({ id: table.id, is_active: !table.is_active });
  };

  return (
    <>
      <Card 
        className={`card-glow transition-all duration-300 ${
          table.is_active 
            ? 'border-primary/30 hover:border-primary/50' 
            : 'border-border opacity-60'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">{table.name}</CardTitle>
            <div className="flex items-center gap-1">
              {table.is_active && (
                <div className="pulse-live">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Ativa
                  </Badge>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="h-8 w-8"
              >
                <Power className={`h-4 w-4 ${table.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteConfirm(true)}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de Fichas na Mesa</p>
              <p className="money-value text-2xl text-gold">{formatCurrency(totalBuyIns)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogadores</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{playerCount}</span>
              </div>
            </div>
          </div>

          {/* Active players - clickable */}
          {playerCount > 0 && (
            <div className="flex flex-wrap gap-1">
              {activeSessions.map((session) => (
                <Badge 
                  key={session.playerId} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedPlayer({ id: session.playerId, name: session.playerName })}
                >
                  {session.playerName.split(' ')[0]}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {table.is_active && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => onBuyIn(table.id)}
                className="btn-quick-action bg-primary hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Buy-in
              </Button>
              <Button
                onClick={() => onCashOut(table.id)}
                variant="outline"
                className="btn-quick-action border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50"
                disabled={playerCount === 0}
              >
                <ArrowUpRight className="h-5 w-5" />
                Cash-out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          open={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          tableId={table.id}
          tableName={table.name}
          onNewBuyIn={() => onBuyIn(table.id)}
        />
      )}

      {/* Delete Confirmation with CASCADE warning */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Excluir Mesa Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-foreground">
                Atenção! Excluir a mesa "{table.name}" apagará permanentemente:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Todos os registros de buy-in vinculados</li>
                <li>Todos os registros de cash-out vinculados</li>
                <li>Todo o histórico de rake desta mesa</li>
              </ul>
              <p className="text-destructive font-medium mt-2">
                Esta ação não pode ser desfeita. Deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-input border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
