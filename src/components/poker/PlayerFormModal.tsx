import { useState } from 'react';
import { Player } from '@/types/poker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save } from 'lucide-react';

interface PlayerFormModalProps {
  open: boolean;
  onClose: () => void;
  player?: Player | null;
  onSave: (data: { name: string; cpf: string; phone: string; metadata: Record<string, string> }) => void;
  isSaving?: boolean;
}

export function PlayerFormModal({ open, onClose, player, onSave, isSaving }: PlayerFormModalProps) {
  const [name, setName] = useState(player?.name || '');
  const [cpf, setCpf] = useState(player?.cpf || '');
  const [phone, setPhone] = useState(player?.phone || '');
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>(
    player?.metadata ? Object.entries(player.metadata).map(([key, value]) => ({ key, value: String(value) })) : []
  );

  const handleAddField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const metadata: Record<string, string> = {};
    customFields.forEach((f) => {
      if (f.key.trim()) metadata[f.key.trim()] = f.value;
    });
    onSave({ name: name.trim(), cpf: cpf.trim(), phone: phone.trim(), metadata });
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="modal-solid sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {player ? 'Editar Jogador' : 'Novo Jogador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>

          <div className="space-y-2">
            <Label>CPF *</Label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </div>

          {/* Dynamic custom fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Campos Extras</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddField} className="text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Campo Extra
              </Button>
            </div>
            {customFields.map((field, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Nome do campo"
                  value={field.key}
                  onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valor"
                  value={field.value}
                  onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveField(index)} className="text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!name.trim() || isSaving} className="w-full touch-target bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          {player ? 'Salvar Alterações' : 'Cadastrar Jogador'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
