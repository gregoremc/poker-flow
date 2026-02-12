import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardData {
  totalRake: number;
  totalTips: number;
  grossProfit: number;
  totalBuyIns: number;
  totalCashOuts: number;
  pendingCredits: number;
  paymentDistribution: { method: string; label: string; value: number; color: string }[];
  rakeByTable: { table: string; rake: number }[];
  isLoading: boolean;
}

const PAYMENT_COLORS: Record<string, string> = {
  pix: 'hsl(185 100% 50%)',
  cash: 'hsl(145 65% 38%)',
  debit: 'hsl(270 60% 55%)',
  credit: 'hsl(35 100% 55%)',
  credit_fiado: 'hsl(0 72% 51%)',
  bonus: 'hsl(45 93% 58%)',
  fichas: 'hsl(220 15% 55%)',
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  debit: 'Débito',
  credit: 'Crédito',
  credit_fiado: 'Fiado',
  bonus: 'Bônus',
  fichas: 'Fichas',
};

export function useDashboardData(sessionId?: string | null): DashboardData {
  const { data: buyIns = [], isLoading: l1 } = useQuery({
    queryKey: ['dashboard-buyins', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('buy_ins')
        .select('amount, payment_method, is_bonus')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: cashOuts = [], isLoading: l2 } = useQuery({
    queryKey: ['dashboard-cashouts', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('cash_outs')
        .select('chip_value, payment_method')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: rakeEntries = [], isLoading: l3 } = useQuery({
    queryKey: ['dashboard-rake', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('rake_entries')
        .select('amount, table:tables(name)')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: dealerTips = [], isLoading: l4 } = useQuery({
    queryKey: ['dashboard-tips', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('dealer_tips')
        .select('amount')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: pendingCredits = 0, isLoading: l5 } = useQuery({
    queryKey: ['dashboard-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_records')
        .select('amount')
        .eq('is_paid', false);
      if (error) throw error;
      return data.reduce((sum, r) => sum + Number(r.amount), 0);
    },
  });

  const totalRake = rakeEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalTips = dealerTips.reduce((s, e) => s + Number(e.amount), 0);
  const totalBuyIns = buyIns.reduce((s, b) => s + Number(b.amount), 0);
  const totalCashOuts = cashOuts.reduce((s, c) => s + Number(c.chip_value), 0);

  // Payment distribution from buy-ins
  const methodMap: Record<string, number> = {};
  buyIns.forEach((b) => {
    const m = b.payment_method as string;
    methodMap[m] = (methodMap[m] || 0) + Number(b.amount);
  });
  const paymentDistribution = Object.entries(methodMap).map(([method, value]) => ({
    method,
    label: PAYMENT_LABELS[method] || method,
    value,
    color: PAYMENT_COLORS[method] || 'hsl(220 15% 55%)',
  }));

  // Rake by table
  const tableMap: Record<string, number> = {};
  rakeEntries.forEach((e: any) => {
    const name = e.table?.name || 'Mesa';
    tableMap[name] = (tableMap[name] || 0) + Number(e.amount);
  });
  const rakeByTable = Object.entries(tableMap).map(([table, rake]) => ({ table, rake }));

  return {
    totalRake,
    totalTips,
    grossProfit: totalRake + totalTips,
    totalBuyIns,
    totalCashOuts,
    pendingCredits,
    paymentDistribution,
    rakeByTable,
    isLoading: l1 || l2 || l3 || l4 || l5,
  };
}
