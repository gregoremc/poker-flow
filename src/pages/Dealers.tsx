import { useState } from 'react';
import { useDealers } from '@/hooks/useDealers';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Users, Trash2, DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function Dealers() {
  const { dealers, isLoading, addDealer, deleteDealer, addTip, isAdding } = useDealers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [tipAmount, setTipAmount] = useState<number | ''>('');

  const handleAddDealer = async () => {
    if (!newName.trim()) return;
    try {
      await addDealer(newName.trim());
      setNewName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding dealer:', error);
    }
  };

  const handleAddTip = () => {
    if (!showTipModal || !tipAmount || tipAmount <= 0) return;
    addTip({ dealer_id: showTipModal, amount: tipAmount });
    setTipAmount('');
    setShowTipModal(null);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteDealer(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const selectedDealer = dealers.find(d => d.id === showTipModal);

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dealers</h2>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Dealer
          </Button>
        </div>

        {/* Dealers List */}
        {dealers.length === 0 ? (
          <Card className="card-glow">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum dealer cadastrado
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro dealer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((dealer) => (
              <Card key={dealer.id} className="card-glow group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dealer.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(dealer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Caixinha Acumulada</span>
                    <span className="money-value text-xl text-gold">
                      {formatCurrency(dealer.total_tips)}
                    </span>
                  </div>
                  <Button
                    onClick={() => setShowTipModal(dealer.id)}
                    variant="outline"
                    className="w-full bg-input border-border hover:bg-accent"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adicionar Caixinha
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Add Dealer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="modal-solid sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Novo Dealer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Dealer</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: João Silva"
                className="bg-input border-border"
                autoFocus
              />
            </div>
          </div>
          <Button
            onClick={handleAddDealer}
            disabled={!newName.trim() || isAdding}
            className="w-full touch-target bg-primary hover:bg-primary/90"
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Adicionar Dealer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add Tip Modal */}
      <Dialog open={!!showTipModal} onOpenChange={() => setShowTipModal(null)}>
        <DialogContent className="modal-solid sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              Caixinha - {selectedDealer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor da Caixinha</Label>
              <Input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="text-2xl font-mono font-bold text-center bg-input border-border"
                autoFocus
              />
            </div>
            {selectedDealer && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Acumulado:</span>
                  <span className="money-value text-gold">
                    {formatCurrency(selectedDealer.total_tips)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={handleAddTip}
            disabled={!tipAmount || tipAmount <= 0}
            className="w-full touch-target bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Adicionar Caixinha
            {tipAmount && <span className="ml-2 opacity-80">{formatCurrency(Number(tipAmount))}</span>}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este dealer? O histórico de caixinhas será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-input border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
