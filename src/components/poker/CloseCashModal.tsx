import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useCashSession } from '@/hooks/useCashSession';
import { useDealers } from '@/hooks/useDealers';
import { useCreditRecords } from '@/hooks/useCreditRecords';
import { useClubSettings } from '@/hooks/useClubSettings';
import { useRake } from '@/hooks/useRake';
import { useDealerPayouts } from '@/hooks/useDealerPayouts';
import { useTables } from '@/hooks/useTables';
import { useOrganization } from '@/hooks/useOrganization';
import { CashSession } from '@/types/poker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Lock, Loader2, ArrowDownLeft, ArrowUpRight, Users, Gift, AlertCircle, Percent, Wallet, Clock, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

function formatChips(amount: number): string {
  return `${amount.toLocaleString('pt-BR')} Fichas`;
}

interface CloseCashModalProps {
  open: boolean;
  onClose: () => void;
  session: CashSession;
}

export function CloseCashModal({ open, onClose, session }: CloseCashModalProps) {
  const dateStr = session.session_date;
  const { dailySummary, dealerTips, buyIns, cashOuts } = useTransactions(dateStr, session.id);
  const { closeSessionAsync, isClosing } = useCashSession(dateStr, session.id);
  const { dealers } = useDealers();
  const { organization } = useOrganization();

  // Fetch cancelled buy-ins for this session
  const { data: cancelledBuyIns = [] } = useQuery({
    queryKey: ['cancelled-buy-ins', session.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cancelled_buy_ins')
        .select('*')
        .eq('session_id', session.id)
        .order('cancelled_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { paymentReceipts } = useCreditRecords();
  const { settings } = useClubSettings();
  const { totalRake, rakeByTable } = useRake(dateStr, session.id);
  const { totalPayouts, payouts } = useDealerPayouts(dateStr, session.id);
  const { deactivateSessionTablesAsync } = useTables(session.id);

  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ============ SEÇÃO 1: FLUXO DE FICHAS ============
  const totalEntradas = dailySummary.totalBuyIns; // All buy-ins (cash, pix, fiado, bonus)
  const totalCaixinha = dailySummary.totalDealerTips;
  const totalSaidas = dailySummary.totalCashOuts; // All cash-outs
  const rakeCalculado = totalEntradas - (totalSaidas + totalCaixinha); // Mathematical rake
  const rakeRegistrado = totalRake; // Manually entered rake

  // ============ SEÇÃO 2: FLUXO DE CAIXA ============
  // Entradas Reais: only buy-ins paid immediately (cash, pix, debit, credit) - exclude fiado and bonus
  const entradasReais = buyIns
    .filter(b => !b.is_bonus && b.payment_method !== 'bonus' && b.payment_method !== 'credit_fiado')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  // Recebimento de Fiados Antigos: payment_receipts linked to this session
  const sessionReceipts = paymentReceipts.filter((r: any) => r.session_id === session.id);
  const recebimentoFiados = sessionReceipts.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

  // Saídas Reais (Cash-outs): total effectively paid to players
  const saidasReais = totalSaidas;

  // Pagamento Dealers
  const pagamentoDealers = totalPayouts;

  // SALDO FINAL DO CAIXA
  const saldoFinalCaixa = (entradasReais + recebimentoFiados) - (saidasReais + pagamentoDealers);

  // ============ SEÇÃO 3: RESUMO ============
  const fiadosGerados = dailySummary.totalCredits; // New fiados created this session
  const totalBonus = dailySummary.totalBonuses;

  // Format dates
  const openedAt = format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const closedAtDate = new Date();
  const closedAt = format(closedAtDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const clubName = organization?.name || settings?.club_name || 'Poker Club';
  const logoUrl = organization?.logo_url || settings?.logo_url || null;

  const handleClose = async () => {
    setIsProcessing(true);
    try {
      await deactivateSessionTablesAsync(session.id);
      await closeSessionAsync({
        sessionIdToClose: session.id,
        notes: notes || undefined,
        finalBalance: saldoFinalCaixa,
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
      await deactivateSessionTablesAsync(session.id);
      await closeSessionAsync({
        sessionIdToClose: session.id,
        notes: notes || undefined,
        finalBalance: saldoFinalCaixa,
      });
      await generatePDF();
      toast.success('Caixa fechado e PDF gerado!');
      onClose();
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Erro ao fechar caixa');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ LOAD LOGO FOR PDF ============
  async function loadLogoBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  // ============ GENERATE 80mm THERMAL PDF ============
  const generatePDF = async () => {
    const w = 80;
    // Estimate height dynamically
    const estimatedHeight = 600;
    const doc = new jsPDF({ unit: 'mm', format: [w, estimatedHeight] });
    let y = 6;

    const addDashedLine = () => {
      doc.setDrawColor(0);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(3, y, w - 3, y);
      y += 4;
    };

    const addSectionTitle = (title: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, w / 2, y, { align: 'center' });
      y += 5;
      addDashedLine();
    };

    const addRow = (label: string, value: string, bold = false) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, 4, y);
      doc.text(value, w - 4, y, { align: 'right' });
      y += 5;
    };

    const addRowBig = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 4, y);
      doc.text(value, w - 4, y, { align: 'right' });
      y += 6;
    };

    // ===== LOGO =====
    if (logoUrl) {
      const logoBase64 = await loadLogoBase64(logoUrl);
      if (logoBase64) {
        try {
          const logoSize = 16;
          doc.addImage(logoBase64, 'PNG', (w - logoSize) / 2, y, logoSize, logoSize);
          y += logoSize + 2;
        } catch { /* ignore logo errors */ }
      }
    }

    // ===== HEADER =====
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(clubName, w / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('RELATÓRIO DE FECHAMENTO', w / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(session.name, w / 2, y, { align: 'center' });
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.text(`Abertura: ${openedAt}`, w / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Fechamento: ${closedAt}`, w / 2, y, { align: 'center' });
    y += 4;
    if (session.responsible) {
      doc.text(`Responsável: ${session.responsible}`, w / 2, y, { align: 'center' });
      y += 4;
    }
    y += 2;

    // ===== 1. FLUXO DE FICHAS =====
    addSectionTitle('1. FLUXO DE FICHAS');

    addRow('Total de Entradas (Buy-ins):', formatChips(totalEntradas));
    // Breakdown by method
    const methodBreakdown = buyIns.reduce((acc, b) => {
      const key = b.is_bonus ? 'bonus' : b.payment_method;
      acc[key] = (acc[key] || 0) + Number(b.amount);
      return acc;
    }, {} as Record<string, number>);
    const methodLabels: Record<string, string> = {
      pix: 'PIX', cash: 'Dinheiro', debit: 'Débito', credit: 'Crédito',
      credit_fiado: 'Fiado', bonus: 'Bônus', fichas: 'Fichas',
    };
    Object.entries(methodBreakdown).forEach(([m, v]) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`  ${methodLabels[m] || m}:`, 6, y);
      doc.text(formatChips(v), w - 4, y, { align: 'right' });
      y += 4;
    });

    addRow('Caixinha dos Dealers:', formatChips(totalCaixinha));
    addRow('Total de Saídas (Cash-outs):', formatChips(totalSaidas));
    y += 2;
    addRowBig('Rake Calculado:', formatChips(rakeCalculado));
    addRow('Rake Registrado (conf.):', formatChips(rakeRegistrado));

    if (rakeByTable.length > 0) {
      rakeByTable.forEach((rt) => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`  ${rt.tableName}:`, 6, y);
        doc.text(formatChips(rt.total), w - 4, y, { align: 'right' });
        y += 4;
      });
    }
    y += 2;

    // ===== 2. FLUXO DE CAIXA =====
    addSectionTitle('2. FLUXO DE CAIXA (R$)');

    addRow('Entradas Reais (Buy-ins):', formatCurrency(entradasReais));
    addRow('Recebimento Fiados:', formatCurrency(recebimentoFiados));
    addRow('Saídas Reais (Cash-outs):', formatCurrency(saidasReais));
    addRow('Pagamento Dealers:', formatCurrency(pagamentoDealers));

    // Dealer payout detail
    if (payouts.length > 0) {
      payouts.forEach((p: any) => {
        const dealerName = p.dealer?.name || 'Dealer';
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`  ${dealerName}:`, 6, y);
        doc.text(formatCurrency(Number(p.amount)), w - 4, y, { align: 'right' });
        y += 4;
      });
    }

    y += 2;
    addDashedLine();
    addRowBig('SALDO FINAL CAIXA:', formatCurrency(saldoFinalCaixa));
    y += 2;

    // ===== 3. RESUMO E OBSERVAÇÕES =====
    addSectionTitle('3. RESUMO');

    addRow('Fiados Gerados:', formatChips(fiadosGerados));
    addRow('Total de Bônus:', formatChips(totalBonus));

    if (cancelledBuyIns.length > 0) {
      const totalCancelled = cancelledBuyIns.reduce((sum: number, cb: any) => sum + Number(cb.amount), 0);
      addRow(`Buy-ins Cancelados (${cancelledBuyIns.length}):`, formatChips(totalCancelled));
    }

    if (notes) {
      y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 4, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const splitNotes = doc.splitTextToSize(notes, w - 8);
      doc.text(splitNotes, 4, y);
      y += splitNotes.length * 3.5 + 2;
    }

    y += 2;

    // ===== EXTRATO DE MOVIMENTAÇÕES =====
    addSectionTitle('EXTRATO DE MOVIMENTAÇÕES');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Hora', 4, y);
    doc.text('Tipo', 18, y);
    doc.text('Nome', 36, y);
    doc.text('Valor', w - 4, y, { align: 'right' });
    y += 1;
    doc.line(3, y, w - 3, y);
    y += 3;

    doc.setFont('helvetica', 'normal');

    const allMovements = [
      ...buyIns.map(b => ({
        time: new Date(b.created_at),
        type: b.is_bonus ? 'Bônus' : b.payment_method === 'credit_fiado' ? 'Fiado' : 'Buy-in',
        name: b.player?.name || '?',
        amount: Number(b.amount),
        isEntry: true,
      })),
      ...cashOuts.map(c => ({
        time: new Date(c.created_at),
        type: 'Cash-out',
        name: c.player?.name || '?',
        amount: Number(c.chip_value),
        isEntry: false,
      })),
      ...dealerTips.map((t: any) => ({
        time: new Date(t.created_at),
        type: 'Caixinha',
        name: t.dealer?.name || 'Dealer',
        amount: Number(t.amount),
        isEntry: true,
      })),
      ...sessionReceipts.map((r: any) => {
        const playerBuyIn = buyIns.find(b => b.player_id === r.player_id);
        return {
          time: new Date(r.created_at),
          type: 'Quitação',
          name: playerBuyIn?.player?.name || 'Jogador',
          amount: Number(r.amount),
          isEntry: true,
        };
      }),
    ].sort((a, b) => a.time.getTime() - b.time.getTime());

    allMovements.forEach(mov => {
      doc.setFontSize(6);
      doc.text(format(mov.time, 'HH:mm'), 4, y);
      doc.text(mov.type, 18, y);
      const truncName = mov.name.length > 12 ? mov.name.substring(0, 11) + '..' : mov.name;
      doc.text(truncName, 36, y);
      const prefix = mov.isEntry ? '+' : '-';
      doc.text(`${prefix}${mov.amount.toLocaleString('pt-BR')}`, w - 4, y, { align: 'right' });
      y += 4;
    });

    y += 2;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.text(`Total: ${allMovements.length} movimentações`, 4, y);
    y += 8;

    // ===== ASSINATURA =====
    addDashedLine();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Gerente:', 4, y);
    y += 10;
    doc.setLineDashPattern([], 0);
    doc.line(10, y, w - 10, y);
    y += 4;
    doc.setFontSize(6);
    doc.text(session.responsible || 'Responsável', w / 2, y, { align: 'center' });
    y += 6;

    // ===== FOOTER =====
    doc.setFontSize(6);
    doc.setTextColor(128);
    doc.text('Documento gerado automaticamente', w / 2, y, { align: 'center' });
    y += 3;
    doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm"), w / 2, y, { align: 'center' });

    // Download
    const safeSessionName = session.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    doc.save(`fechamento-${safeSessionName}-${dateStr}.pdf`);
  };

  // Dealer tips grouped by dealer
  const dealerTipSummary = dealerTips.reduce((acc: Record<string, { name: string; amount: number }>, tip: any) => {
    const id = tip.dealer_id;
    if (!acc[id]) {
      const dealer = dealers.find(d => d.id === id);
      acc[id] = { name: dealer?.name || 'Dealer', amount: 0 };
    }
    acc[id].amount += Number(tip.amount);
    return acc;
  }, {});

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
          <div className="space-y-4 py-4">
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
                {session.responsible && (
                  <div className="text-sm text-muted-foreground">
                    Responsável: <span className="font-medium text-foreground">{session.responsible}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 1. FLUXO DE FICHAS */}
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">1. FLUXO DE FICHAS</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-3 w-3 text-success" />
                    <span>Total de Entradas</span>
                  </div>
                  <span className="money-value text-success">{formatChips(totalEntradas)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-gold" />
                    <span>Caixinha Dealers</span>
                  </div>
                  <span className="money-value text-gold">{formatChips(totalCaixinha)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-3 w-3 text-destructive" />
                    <span>Total de Saídas</span>
                  </div>
                  <span className="money-value text-destructive">{formatChips(totalSaidas)}</span>
                </div>

                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gold" />
                    <span className="font-bold text-sm">Rake Calculado</span>
                  </div>
                  <span className={cn('money-value font-bold', rakeCalculado >= 0 ? 'text-gold' : 'text-destructive')}>
                    {formatChips(rakeCalculado)}
                  </span>
                </div>

                {rakeRegistrado > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Rake Registrado (conf.)</span>
                    <span>{formatChips(rakeRegistrado)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. FLUXO DE CAIXA */}
            <Card className="border-gold/20">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-gold" />
                  <span className="font-bold text-sm">2. FLUXO DE CAIXA (R$)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Entradas Reais (Buy-ins)</span>
                  <span className="money-value text-success">{formatCurrency(entradasReais)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Recebimento Fiados</span>
                  <span className="money-value text-success">{formatCurrency(recebimentoFiados)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Saídas Reais (Cash-outs)</span>
                  <span className="money-value text-destructive">{formatCurrency(saidasReais)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Pagamento Dealers</span>
                  <span className="money-value text-destructive">{formatCurrency(pagamentoDealers)}</span>
                </div>

                <div className="border-t-2 border-gold/50 pt-3 flex items-center justify-between bg-gold/5 -mx-4 px-4 pb-2 rounded-b-lg">
                  <span className="font-bold text-lg">SALDO FINAL</span>
                  <span className={cn(
                    'money-value text-2xl font-bold',
                    saldoFinalCaixa >= 0 ? 'text-gold' : 'text-destructive'
                  )}>
                    {formatCurrency(saldoFinalCaixa)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. RESUMO */}
            <Card className="border-border">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-sm">3. RESUMO</span>
                </div>

                {fiadosGerados > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-orange-500" />
                      <span>Fiados Gerados</span>
                    </div>
                    <span className="text-orange-500">{formatChips(fiadosGerados)}</span>
                  </div>
                )}

                {totalBonus > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Gift className="h-3 w-3 text-purple-500" />
                      <span>Total de Bônus</span>
                    </div>
                    <span className="text-purple-500">{formatChips(totalBonus)}</span>
                  </div>
                )}

                {cancelledBuyIns.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-destructive">Buy-ins Cancelados ({cancelledBuyIns.length})</span>
                    <span className="text-destructive">
                      {formatChips(cancelledBuyIns.reduce((sum: number, cb: any) => sum + Number(cb.amount), 0))}
                    </span>
                  </div>
                )}

                {/* Dealer tip breakdown */}
                {Object.keys(dealerTipSummary).length > 0 && (
                  <div className="border-t border-border pt-2 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Caixinhas por Dealer:</span>
                    {Object.values(dealerTipSummary).map((d: any, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>  {d.name}</span>
                        <span>{formatChips(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
