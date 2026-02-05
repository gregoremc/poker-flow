import { useState } from 'react';
import { useRake } from '@/hooks/useRake';
import { useTables } from '@/hooks/useTables';
import { useCashSession } from '@/hooks/useCashSession';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, Trash2, Loader2, Percent, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Rake() {
  const today = new Date().toISOString().split('T')[0];
  const { rakeEntries, rakeByTable, totalRake, isLoading, addRake, deleteRake, isAdding } = useRake(today);
  const { tables } = useTables();
  const { session } = useCashSession(today);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');

  const activeTables = tables.filter(t => t.is_active);

  const handleAddRake = () => {
    if (!selectedTable || !amount || amount <= 0) return;
    addRake({ 
      table_id: selectedTable, 
      amount: Number(amount),
      session_id: session?.id,
    });
    setAmount('');
    setSelectedTable('');
    setShowAddModal(false);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteRake(deleteConfirm);
      setDeleteConfirm(null);
    }
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
            <h2 className="text-2xl font-bold">Rake</h2>
            <p className="text-sm text-muted-foreground">Comissão da Casa</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Rake
          </Button>
        </div>

        {/* Total Card */}
        <Card className="card-glow border-gold/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gold/10">
                  <DollarSign className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rake do Dia</p>
                  <p className="text-3xl font-bold text-gold money-value">
                    {formatCurrency(totalRake)}
                  </p>
                </div>
              </div>
              <Percent className="h-8 w-8 text-gold/30" />
            </div>
          </CardContent>
        </Card>

        {/* Rake by Table */}
        {rakeByTable.length === 0 ? (
          <Card className="card-glow">
            <CardContent className="py-12 text-center">
              <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum rake registrado hoje
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar primeiro rake
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rakeByTable.map((tableRake) => (
              <Card key={tableRake.tableId} className="card-glow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      {tableRake.tableName}
                    </CardTitle>
                    <span className="money-value text-gold font-bold">
                      {formatCurrency(tableRake.total)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tableRake.entries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="money-value text-success">
                          +{formatCurrency(entry.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Add Rake Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="modal-solid sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              Registrar Rake
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mesa</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione a mesa" />
                </SelectTrigger>
                <SelectContent>
                  {activeTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Rake</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="text-2xl font-mono font-bold text-center bg-input border-border"
                autoFocus
              />
            </div>
          </div>
          <Button
            onClick={handleAddRake}
            disabled={!selectedTable || !amount || amount <= 0 || isAdding}
            className="w-full touch-target bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <DollarSign className="mr-2 h-5 w-5" />
            )}
            Registrar Rake
            {amount ? <span className="ml-2 opacity-80">{formatCurrency(Number(amount))}</span> : null}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de rake?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-input border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
