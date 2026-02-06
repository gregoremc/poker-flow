import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCashSession } from '@/hooks/useCashSession';
import { useDealers } from '@/hooks/useDealers';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { useClubSettings } from '@/hooks/useClubSettings';
import { useRake } from '@/hooks/useRake';
import { useDealerPayouts } from '@/hooks/useDealerPayouts';
import { useTables } from '@/hooks/useTables';
import { ChipInventory, CashSession } from '@/types/poker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download, Lock, Loader2, ArrowDownLeft, ArrowUpRight, Users, Gift, AlertCircle, Percent, Wallet, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface CloseCashModalProps {
  open: boolean;
  onClose: () => void;
  session: CashSession;
}

export function CloseCashModal({ open, onClose, session }: CloseCashModalProps) {
  const dateStr = session.session_date;
  const { dailySummary, dealerTips } = useTransactions(dateStr);
  const { chipTypes, closeSessionAsync, isClosing } = useCashSession(dateStr, session.id);
  const { dealers } = useDealers();
  const { totalUnpaid: totalCredits } = useCreditRecords();
  const { settings } = useClubSettings();
  const { totalRake, rakeByTable } = useRake(dateStr);
  const { totalPayouts } = useDealerPayouts(dateStr);
  const { deactivateAllTablesAsync } = useTables();
  
  const [chipInventory, setChipInventory] = useState<ChipInventory>({});
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChipChange = (chipId: string, value: number) => {
    setChipInventory(prev => ({
      ...prev,
      [chipId]: value
    }));
  };

  const totalChipValue = chipTypes.reduce((sum, chip) => {
    const count = chipInventory[chip.id] || 0;
    return sum + (count * chip.value);
  }, 0);

  // Calculate final balance including rake
  const finalBalance = dailySummary.realBalance + totalRake - totalPayouts;

  // Format dates for display
  const openedAt = format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const closedAtDate = new Date();
  const closedAt = format(closedAtDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const handleClose = async () => {
    setIsProcessing(true);
    try {
      // 1. Deactivate all tables first
      await deactivateAllTablesAsync();
      
      // 2. Close the session with final inventory
      await closeSessionAsync({
        sessionIdToClose: session.id,
        finalInventory: chipInventory,
        notes: notes || undefined,
        finalBalance,
      });
      
      toast.success('Caixa fechado e mesas desativadas!');
      onClose();
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Erro ao fechar caixa');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAndDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      // 1. Deactivate all tables first
      await deactivateAllTablesAsync();
      
      // 2. Close the session with final inventory
      await closeSessionAsync({
        sessionIdToClose: session.id,
        finalInventory: chipInventory,
        notes: notes || undefined,
        finalBalance,
      });
      
      // 3. Generate and download PDF after successful close
      generatePDF();
      
      toast.success('Caixa fechado e PDF gerado!');
      onClose();
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Erro ao fechar caixa');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.club_name || 'Poker Club', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Session Name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(session.name, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Opening and Closing dates/times
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Abertura: ${openedAt}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Fechamento: ${closedAt}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const addLine = (label: string, value: string) => {
      doc.text(label, 14, y);
      doc.text(value, pageWidth - 14, y, { align: 'right' });
      y += 7;
    };

    addLine('Entradas (Buy-ins):', formatCurrency(dailySummary.totalBuyIns));
    addLine('Saídas (Cash-outs):', formatCurrency(dailySummary.totalCashOuts));
    y += 3;
    
    doc.setFont('helvetica', 'bold');
    addLine('Saldo Operacional:', formatCurrency(dailySummary.balance));
    doc.setFont('helvetica', 'normal');
    y += 5;

    if (dailySummary.totalBonuses > 0) {
      addLine('Bônus Concedidos:', formatCurrency(dailySummary.totalBonuses));
    }
    if (dailySummary.totalCredits > 0) {
      addLine('Fiado (Não Recebido):', formatCurrency(dailySummary.totalCredits));
    }
    
    doc.setFont('helvetica', 'bold');
    addLine('Saldo Real (s/ Bônus/Fiado):', formatCurrency(dailySummary.realBalance));
    doc.setFont('helvetica', 'normal');
    y += 10;

    // Rake Section
    if (totalRake > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Rake (Comissão da Casa)', 14, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      rakeByTable.forEach((tableRake) => {
        addLine(tableRake.tableName + ':', formatCurrency(tableRake.total));
      });
      
      doc.setFont('helvetica', 'bold');
      addLine('Total Rake:', formatCurrency(totalRake));
      doc.setFont('helvetica', 'normal');
      y += 10;
    }

    // Dealer Tips
    if (dailySummary.totalDealerTips > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Caixinhas de Dealers', 14, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const dealerTipSummary = dealerTips.reduce((acc: Record<string, number>, tip: { dealer_id: string; amount: number }) => {
        acc[tip.dealer_id] = (acc[tip.dealer_id] || 0) + Number(tip.amount);
        return acc;
      }, {});

      Object.entries(dealerTipSummary).forEach(([dealerId, amount]) => {
        const dealer = dealers.find(d => d.id === dealerId);
        addLine(dealer?.name || 'Dealer', formatCurrency(amount as number));
      });
      
      doc.setFont('helvetica', 'bold');
      addLine('Total Caixinhas:', formatCurrency(dailySummary.totalDealerTips));
      doc.setFont('helvetica', 'normal');
      y += 5;

      if (totalPayouts > 0) {
        doc.setTextColor(220, 53, 69); // red
        addLine('Saída (Pagamento Dealers):', `-${formatCurrency(totalPayouts)}`);
        doc.setTextColor(0); // reset
      }
      y += 5;
    }

    // Chip Inventory
    if (Object.keys(chipInventory).length > 0 && totalChipValue > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventário de Fichas', 14, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      chipTypes.forEach(chip => {
        const count = chipInventory[chip.id] || 0;
        if (count > 0) {
          addLine(`${chip.color} (${formatCurrency(chip.value)}):`, `${count} un = ${formatCurrency(count * chip.value)}`);
        }
      });
      
      doc.setFont('helvetica', 'bold');
      addLine('Total em Fichas:', formatCurrency(totalChipValue));
      doc.setFont('helvetica', 'normal');
      y += 10;
    }

    // Final Balance (with Rake included)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo Final (Lucro do Dia)', 14, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Show calculation breakdown
    let calcText = 'Saldo Real';
    if (totalRake > 0) calcText += ' + Rake';
    if (totalPayouts > 0) calcText += ' - Saídas Dealer';
    calcText += ':';
    
    addLine(calcText, formatCurrency(finalBalance));
    y += 5;

    // Notes
    if (notes) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações', 14, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 28);
      doc.text(splitNotes, 14, y);
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    // Download with session name in filename
    const safeSessionName = session.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    doc.save(`fechamento-${safeSessionName}-${dateStr}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="modal-solid sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold" />
            Fechar Caixa - {session.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Session Times */}
            <Card className="border-border">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-success" />
                  <span className="text-muted-foreground">Abertura:</span>
                  <span className="font-medium">{openedAt}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gold" />
                  <span className="text-muted-foreground">Fechamento:</span>
                  <span className="font-medium">{closedAt}</span>
                </div>
              </CardContent>
            </Card>

            {/* Summary Preview */}
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                    <span className="text-sm">Entradas</span>
                  </div>
                  <span className="money-value text-success">
                    {formatCurrency(dailySummary.totalBuyIns)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Saídas</span>
                  </div>
                  <span className="money-value text-destructive">
                    {formatCurrency(dailySummary.totalCashOuts)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="font-semibold">Saldo Operacional</span>
                  <span className={cn(
                    'money-value text-xl',
                    dailySummary.balance >= 0 ? 'text-gold' : 'text-destructive'
                  )}>
                    {formatCurrency(dailySummary.balance)}
                  </span>
                </div>

                {/* Rake */}
                {totalRake > 0 && (
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-gold" />
                      <span className="text-sm font-medium">Rake Total</span>
                    </div>
                    <span className="money-value text-gold font-bold">
                      +{formatCurrency(totalRake)}
                    </span>
                  </div>
                )}

                {(dailySummary.totalBonuses > 0 || dailySummary.totalCredits > 0) && (
                  <div className="border-t border-border pt-3 space-y-2">
                    {dailySummary.totalBonuses > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Gift className="h-3 w-3 text-purple-500" />
                          <span className="text-muted-foreground">Bônus</span>
                        </div>
                        <span className="text-purple-500">-{formatCurrency(dailySummary.totalBonuses)}</span>
                      </div>
                    )}
                    {dailySummary.totalCredits > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                          <span className="text-muted-foreground">Fiado (não recebido)</span>
                        </div>
                        <span className="text-orange-500">-{formatCurrency(dailySummary.totalCredits)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Saldo Real</span>
                      <span className={cn(
                        'money-value',
                        dailySummary.realBalance >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {formatCurrency(dailySummary.realBalance)}
                      </span>
                    </div>
                  </div>
                )}
                {dailySummary.totalDealerTips > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-gold" />
                        <span className="text-muted-foreground">Caixinhas</span>
                      </div>
                      <span className="text-gold">{formatCurrency(dailySummary.totalDealerTips)}</span>
                    </div>
                    {totalPayouts > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3 w-3 text-destructive" />
                          <span className="text-muted-foreground">Saída (Dealers)</span>
                        </div>
                        <span className="text-destructive">-{formatCurrency(totalPayouts)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Balance */}
                <div className="border-t-2 border-gold/50 pt-3 flex items-center justify-between bg-gold/5 -mx-4 px-4 pb-2 rounded-b-lg">
                  <span className="font-bold text-lg">Lucro Final</span>
                  <span className={cn(
                    'money-value text-2xl font-bold',
                    finalBalance >= 0 ? 'text-gold' : 'text-destructive'
                  )}>
                    {formatCurrency(finalBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Chip Inventory */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Inventário Final de Fichas</Label>
              <div className="grid grid-cols-2 gap-3">
                {chipTypes.map(chip => (
                  <div key={chip.id} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: chip.color.toLowerCase() }}
                    />
                    <span className="text-sm flex-1">{chip.color} ({formatCurrency(chip.value)})</span>
                    <Input
                      type="number"
                      value={chipInventory[chip.id] || ''}
                      onChange={(e) => handleChipChange(chip.id, Number(e.target.value) || 0)}
                      className="w-20 h-8 text-center bg-input border-border"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              {totalChipValue > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-sm font-medium">Total em Fichas:</span>
                  <span className="money-value text-gold">{formatCurrency(totalChipValue)}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações (opcional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre o dia..."
                className="w-full h-20 p-3 rounded-lg bg-input border border-border resize-none text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCloseAndDownloadPDF}
            disabled={isProcessing || isClosing}
            className="flex-1 bg-input border-border"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Fechar + PDF
          </Button>
          <Button
            onClick={handleClose}
            disabled={isProcessing || isClosing}
            className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {isProcessing || isClosing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Fechar Caixa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
