import { useState } from 'react';
import { useTables } from '@/hooks/useTables';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddTableModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddTableModal({ open, onClose }: AddTableModalProps) {
  const { tables, addTable } = useTables();
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    addTable(name.trim());
    handleClose();
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  const suggestedName = `Mesa ${tables.length + 1}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="modal-solid sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Mesa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Mesa</Label>
            <Input
              placeholder={suggestedName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="touch-target bg-input border-border"
              autoFocus
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full touch-target text-lg font-semibold bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Criar Mesa
        </Button>
      </DialogContent>
    </Dialog>
  );
}