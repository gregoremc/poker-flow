import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

function formatChips(amount: number): string {
  return `${amount.toLocaleString('pt-BR')} Fichas`;
}

/**
 * Load logo as base64 for embedding in PDF
 */
async function loadLogoBase64(logoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl);
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

/**
 * Add centered logo to PDF
 */
function addLogo(doc: jsPDF, logoBase64: string, w: number, y: number): number {
  try {
    const logoSize = 18;
    doc.addImage(logoBase64, 'PNG', (w - logoSize) / 2, y, logoSize, logoSize);
    return y + logoSize + 3;
  } catch {
    return y;
  }
}

/**
 * Add dotted signature field
 */
function addSignatureField(doc: jsPDF, w: number, y: number, playerName: string): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Jogador:', 5, y);
  y += 12;
  doc.setLineDashPattern([], 0);
  doc.line(10, y, w - 10, y);
  y += 5;
  doc.setFontSize(7);
  doc.text(playerName, w / 2, y, { align: 'center' });
  return y + 5;
}

/**
 * Get club logo URL and name
 */
async function getClubBranding(): Promise<{ logoUrl: string | null; clubName: string }> {
  // Try organization first
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .limit(1)
    .maybeSingle();

  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('logo_url, name')
      .eq('id', profile.organization_id)
      .single();
    if (org) {
      return { logoUrl: org.logo_url, clubName: org.name };
    }
  }

  // Fallback to club_settings
  const { data: settings } = await supabase
    .from('club_settings')
    .select('logo_url, club_name')
    .limit(1)
    .maybeSingle();

  return {
    logoUrl: settings?.logo_url || null,
    clubName: settings?.club_name || 'Poker Club',
  };
}

/**
 * Fiado receipt (80mm thermal)
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
  const { data: player } = await supabase
    .from('players')
    .select('credit_balance')
    .eq('id', playerId)
    .single();

  const cumulativeBalance = player?.credit_balance ?? amount;
  const branding = await getClubBranding();
  const finalClubName = clubName || branding.clubName;

  const doc = new jsPDF({ unit: 'mm', format: [80, 160] });
  const w = 80;
  let y = 6;

  // Logo
  if (branding.logoUrl) {
    const logoBase64 = await loadLogoBase64(branding.logoUrl);
    if (logoBase64) y = addLogo(doc, logoBase64, w, y);
  }

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(finalClubName, w / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE DE DÉBITO', w / 2, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(0);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 6;

  // Player
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

  doc.line(5, y, w - 5, y);
  y += 6;

  // Value
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

  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 8;

  // Signature
  y = addSignatureField(doc, w, y, playerName);
  y += 3;

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('Documento gerado automaticamente', w / 2, y, { align: 'center' });

  const safeName = playerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`debito-${safeName}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}

/**
 * Buy-in receipt (80mm thermal)
 */
export async function generateBuyInReceipt({
  playerName,
  amount,
  tableName,
  paymentMethod,
}: {
  playerName: string;
  amount: number;
  tableName: string;
  paymentMethod: string;
}) {
  const branding = await getClubBranding();
  const doc = new jsPDF({ unit: 'mm', format: [80, 130] });
  const w = 80;
  let y = 6;

  if (branding.logoUrl) {
    const logoBase64 = await loadLogoBase64(branding.logoUrl);
    if (logoBase64) y = addLogo(doc, logoBase64, w, y);
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(branding.clubName, w / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE DE BUY-IN', w / 2, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(0);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 6;

  const lines = [
    ['Jogador:', playerName],
    ['Mesa:', tableName],
    ['Valor:', formatChips(amount)],
    ['Pagamento:', paymentMethod],
    ['Data:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
  ];

  doc.setFontSize(10);
  for (const [label, value] of lines) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, w - 5, y, { align: 'right' });
    y += 6;
  }

  y += 2;
  doc.line(5, y, w - 5, y);
  y += 8;

  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('Documento gerado automaticamente', w / 2, y, { align: 'center' });

  const safeName = playerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`buyin-${safeName}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}

/**
 * Cash-out receipt (80mm thermal) with signature field
 */
export async function generateCashOutReceipt({
  playerName,
  chipValue,
  totalBuyIn,
  profit,
  tableName,
  paymentMethod,
}: {
  playerName: string;
  chipValue: number;
  totalBuyIn: number;
  profit: number;
  tableName: string;
  paymentMethod: string;
}) {
  const branding = await getClubBranding();
  const doc = new jsPDF({ unit: 'mm', format: [80, 160] });
  const w = 80;
  let y = 6;

  if (branding.logoUrl) {
    const logoBase64 = await loadLogoBase64(branding.logoUrl);
    if (logoBase64) y = addLogo(doc, logoBase64, w, y);
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(branding.clubName, w / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE DE CASH-OUT', w / 2, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(0);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 6;

  const lines = [
    ['Jogador:', playerName],
    ['Mesa:', tableName],
    ['Total Buy-in:', formatChips(totalBuyIn)],
    ['Valor Fichas:', formatChips(chipValue)],
    ['Resultado:', `${profit >= 0 ? '+' : ''}${formatChips(profit)}`],
    ['Pagamento:', paymentMethod],
    ['Data:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
  ];

  doc.setFontSize(10);
  for (const [label, value] of lines) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, w - 5, y, { align: 'right' });
    y += 6;
  }

  y += 2;
  doc.line(5, y, w - 5, y);
  y += 8;

  // Signature field
  y = addSignatureField(doc, w, y, playerName);
  y += 3;

  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('Documento gerado automaticamente', w / 2, y, { align: 'center' });

  const safeName = playerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`cashout-${safeName}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}

/**
 * Payment receipt (80mm thermal) for fiado payment
 */
export async function generatePaymentReceipt({
  playerName,
  amount,
  paymentMethod,
  remainingBalance,
}: {
  playerName: string;
  amount: number;
  paymentMethod: string;
  remainingBalance: number;
}) {
  const branding = await getClubBranding();
  const doc = new jsPDF({ unit: 'mm', format: [80, 140] });
  const w = 80;
  let y = 6;

  if (branding.logoUrl) {
    const logoBase64 = await loadLogoBase64(branding.logoUrl);
    if (logoBase64) y = addLogo(doc, logoBase64, w, y);
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(branding.clubName, w / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE DE PAGAMENTO', w / 2, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(0);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, w - 5, y);
  y += 6;

  const lines = [
    ['Jogador:', playerName],
    ['Valor Pago:', formatChips(amount)],
    ['Forma:', paymentMethod],
    ['Data:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
  ];

  doc.setFontSize(10);
  for (const [label, value] of lines) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, w - 5, y, { align: 'right' });
    y += 6;
  }

  y += 2;
  doc.line(5, y, w - 5, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SALDO RESTANTE:', w / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(14);
  doc.text(formatChips(Math.max(0, remainingBalance)), w / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('Documento gerado automaticamente', w / 2, y, { align: 'center' });

  const safeName = playerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`pagamento-${safeName}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
}
