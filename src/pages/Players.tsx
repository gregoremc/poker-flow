import { useState } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { Player } from '@/types/poker';
import { formatCurrency } from '@/lib/format';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { PlayerFormModal } from '@/components/poker/PlayerFormModal';
import { PlayerProfileModal } from '@/components/poker/PlayerProfileModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, UserCircle, Pencil, AlertCircle } from 'lucide-react';

export default function Players() {
  const { players, isLoading, addPlayer, updatePlayer } = usePlayers();
  const { credits } = useCreditRecords();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf?.includes(search) ||
    p.phone?.includes(search)
  );

  const getPlayerDebt = (playerId: string) => {
    return credits.filter(c => c.player_id === playerId && !c.is_paid).reduce((sum, c) => sum + Number(c.amount), 0);
  };

  const handleSaveNew = async (data: { name: string; cpf: string; phone: string; metadata: Record<string, string> }) => {
    await addPlayer({ name: data.name, cpf: data.cpf, phone: data.phone, metadata: data.metadata });
    setShowForm(false);
  };

  const handleUpdate = (data: { name: string; cpf: string; phone: string; metadata: Record<string, string> }) => {
    if (!editingPlayer) return;
    updatePlayer({
      id: editingPlayer.id,
      name: data.name,
      cpf: data.cpf || null,
      phone: data.phone || null,
      metadata: data.metadata,
    } as any);
    setEditingPlayer(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Jogadores ({players.length})</h2>
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />
            Novo Jogador
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Nenhum jogador encontrado' : 'Nenhum jogador cadastrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((player) => {
              const debt = getPlayerDebt(player.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setViewingPlayer(player)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {player.cpf || player.phone || 'Sem dados'}
                    </p>
                  </div>
                  {debt > 0 && (
                    <div className="flex items-center gap-1 text-destructive shrink-0">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs font-medium money-value">{formatCurrency(debt)}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPlayer(player);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />

      {showForm && (
        <PlayerFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleSaveNew}
        />
      )}

      {editingPlayer && (
        <PlayerFormModal
          open={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          onSave={handleUpdate}
        />
      )}

      {viewingPlayer && (
        <PlayerProfileModal
          open={!!viewingPlayer}
          onClose={() => setViewingPlayer(null)}
          player={viewingPlayer}
        />
      )}
    </div>
  );
}
