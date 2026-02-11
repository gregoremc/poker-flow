import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

/**
 * Format amount as "X Fichas" instead of R$ for thermal receipts
 */
function formatChips(amount: number): string {
  return `${amount.toLocaleString('pt-BR')} Fichas`;
}

/**
 * Generates a thermal receipt PDF (80mm width) for a fiado (credit) entry.
 * Shows cumulative balance for the player.
 * Uses "Fichas" instead of "R$" and "Fiado"
 */
export async function generateFiadoReceipt({
  playerName,
  playerId,
  amount,
  clubName,
}: {
  playerName: string;
  playerId: string;
  amount: number;
  clubName?: string;
}) {
  // Fetch cumulative balance for the player
  const { data: player } = await supabase
    .from('players')
    .select('credit_balance')
    .eq('id', playerId)
    .single();

  const cumulativeBalance = player?.credit_balance ?? amount;

  // 80mm = ~226 points width, thermal receipt style
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150],
  });

  const w = 80;
  let y = 8;

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clubName || 'Poker Club', w / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE DE DÉBITO', w / 2, y, { align: 'center' });
  y += 5;

  // Separator
  doc.setDrawColor(0);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 6;

  // Player name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Jogador:', 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(playerName, w - 5, y, { align: 'right' });
  y += 6;

  // Date
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), w - 5, y, { align: 'right' });
  y += 6;

  // Separator
  doc.line(5, y, w - 5, y);
  y += 6;

  // Current debt
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor:', 5, y);
  doc.text(formatChips(amount), w - 5, y, { align: 'right' });
  y += 8;

  // Cumulative balance
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SALDO DEVEDOR TOTAL:', w / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(14);
  doc.text(formatChips(cumulativeBalance), w / 2, y, { align: 'center' });
  y += 8;

  // Separator
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 8;

  // Signature
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Jogador:', 5, y);
  y += 12;
  doc.setLineDashPattern([], 0);
  doc.line(10, y, w - 10, y);
  y += 5;
  doc.setFontSize(7);
  doc.text(playerName, w / 2, y, { align: 'center' });
  y += 8;

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('Documento gerado automaticamente', w / 2, y, { align: 'center' });

  // Download
  const safeName = playerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`debito-${safeName}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}
