import { useState, useRef } from 'react';
import { Player } from '@/types/poker';
import { usePlayerAttachments } from '@/hooks/usePlayerAttachments';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { formatCurrency } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2, FileText, Image, Loader2, User, AlertCircle } from 'lucide-react';

interface PlayerProfileModalProps {
  open: boolean;
  onClose: () => void;
  player: Player;
}

export function PlayerProfileModal({ open, onClose, player }: PlayerProfileModalProps) {
  const { attachments, isLoading, uploadAttachment, deleteAttachment, isUploading } = usePlayerAttachments(player.id);
  const { credits } = useCreditRecords();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playerCredits = credits.filter(c => c.player_id === player.id && !c.is_paid);
  const totalDebt = playerCredits.reduce((sum, c) => sum + Number(c.amount), 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    await uploadAttachment(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const metadata = player.metadata || {};
  const metadataEntries = Object.entries(metadata);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="modal-solid sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {player.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="info">Dados</TabsTrigger>
            <TabsTrigger value="credit">Crédito</TabsTrigger>
            <TabsTrigger value="docs">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-3 mt-4">
            <InfoRow label="CPF" value={player.cpf || '—'} />
            <InfoRow label="Telefone" value={player.phone || '—'} />
            {metadataEntries.map(([key, value]) => (
              <InfoRow key={key} label={key} value={String(value)} />
            ))}
            {metadataEntries.length === 0 && !player.cpf && !player.phone && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado cadastrado</p>
            )}
          </TabsContent>

          <TabsContent value="credit" className="space-y-3 mt-4">
            <div className="p-4 rounded-lg bg-muted border border-border">
              <p className="text-sm text-muted-foreground">Saldo Devedor Total</p>
              <p className={`text-2xl font-bold money-value ${totalDebt > 0 ? 'text-destructive' : 'money-positive'}`}>
                {formatCurrency(totalDebt)}
              </p>
            </div>
            {playerCredits.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem pendências</p>
            )}
            {playerCredits.map((credit) => (
              <div key={credit.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(Number(credit.amount))}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(credit.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">Pendente</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="docs" className="space-y-3 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
            />
            <Button
              variant="outline"
              className="w-full border-dashed border-border"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Enviar Documento
            </Button>

            {isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto" />}

            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                {att.file_type?.startsWith('image/') ? (
                  <Image className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                )}
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm truncate hover:text-primary transition-colors"
                >
                  {att.file_name}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={() => deleteAttachment(att)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {!isLoading && attachments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento anexado</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
