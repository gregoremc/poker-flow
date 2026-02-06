import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { CashSession } from '@/types/poker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeleteSessionModalProps {
  session: CashSession | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function DeleteSessionModal({ session, open, onClose, onConfirm, isLoading }: DeleteSessionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalConfirm = async () => {
    await onConfirm();
    setStep(1);
  };

  if (!session) return null;

  const sessionDate = format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <>
      {/* Step 1: First confirmation */}
      <AlertDialog open={open && step === 1} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <AlertDialogContent className="modal-solid">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Sessão de Caixa?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a excluir a sessão:</p>
              <p className="font-semibold text-foreground">
                "{session.name}" - {sessionDate}
              </p>
              <p>Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFirstConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Final warning about cascade */}
      <AlertDialog open={open && step === 2} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <AlertDialogContent className="modal-solid border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ ATENÇÃO: Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                Ao excluir esta sessão, os seguintes dados serão APAGADOS PERMANENTEMENTE:
              </p>
              <ul className="list-disc list-inside space-y-1 text-destructive">
                <li>Todos os <strong>Buy-ins</strong> vinculados a esta sessão</li>
                <li>Todos os <strong>Cash-outs</strong> vinculados a esta sessão</li>
                <li>Todas as entradas de <strong>Rake</strong> desta sessão</li>
                <li>Todas as <strong>Caixinhas de Dealers</strong> desta sessão</li>
                <li>Todos os <strong>Pagamentos de Dealers</strong> desta sessão</li>
              </ul>
              <p className="text-destructive font-bold">
                Esta ação é IRREVERSÍVEL!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
            <Button 
              onClick={handleFinalConfirm}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir Permanentemente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
