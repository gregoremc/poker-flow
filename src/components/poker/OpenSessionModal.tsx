import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Loader2 } from 'lucide-react';

interface OpenSessionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, responsible: string) => Promise<void>;
  isLoading?: boolean;
}

export function OpenSessionModal({ open, onClose, onConfirm, isLoading }: OpenSessionModalProps) {
  const [name, setName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [errors, setErrors] = useState<{ name?: string; responsible?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; responsible?: string } = {};
    if (!name.trim()) newErrors.name = 'Nome do caixa é obrigatório';
    if (!responsible.trim()) newErrors.responsible = 'Nome do responsável é obrigatório';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    await onConfirm(name.trim(), responsible.trim());
    setName('');
    setResponsible('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setResponsible('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="modal-solid sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Play className="h-5 w-5 text-success" />
            Abrir Novo Caixa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Nome do Caixa *</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Torneio 50k, Cash Game Noite..."
              className="bg-input border-border"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-responsible">Nome do Responsável *</Label>
            <Input
              id="session-responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Ex: João, Maria..."
              className="bg-input border-border"
            />
            {errors.responsible && (
              <p className="text-sm text-destructive">{errors.responsible}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Dê um nome para identificar este caixa. Você pode ter múltiplos caixas no mesmo dia.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Abrir Caixa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
