import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BuyIn, CashOut, PaymentMethod, Transaction, DailySummary, CreditRecord } from '@/types/poker';
import { toast } from 'sonner';

export function useTransactions(date?: string, sessionId?: string | null) {
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Buy-ins filtered by session_id when available, otherwise by date
  const { data: buyIns = [], isLoading: loadingBuyIns } = useQuery({
    queryKey: ['buy-ins', targetDate, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('buy_ins')
        .select(`
          *,
          player:players(*),
          table:tables(*)
        `)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        const startOfDay = `${targetDate}T00:00:00`;
        const endOfDay = `${targetDate}T23:59:59`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BuyIn[];
    },
  });

  // Cash-outs filtered by session_id when available, otherwise by date
  const { data: cashOuts = [], isLoading: loadingCashOuts } = useQuery({
    queryKey: ['cash-outs', targetDate, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('cash_outs')
        .select(`
          *,
          player:players(*),
          table:tables(*)
        `)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        const startOfDay = `${targetDate}T00:00:00`;
        const endOfDay = `${targetDate}T23:59:59`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CashOut[];
    },
  });

  // Dealer tips filtered by session_id when available, otherwise by date
  const { data: dealerTips = [] } = useQuery({
    queryKey: ['dealer-tips', targetDate, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('dealer_tips')
        .select(`
          *,
          dealer:dealers(*)
        `)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        const startOfDay = `${targetDate}T00:00:00`;
        const endOfDay = `${targetDate}T23:59:59`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Helper to invalidate all related queries
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-outs'] });
    queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['credit-records'] });
    queryClient.invalidateQueries({ queryKey: ['cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['table-total'] });
  };

  // Add buy-in
  const addBuyIn = useMutation({
    mutationFn: async ({ 
      table_id, 
      player_id, 
      amount, 
      payment_method,
      session_id,
      is_bonus = false
    }: { 
      table_id: string; 
      player_id: string; 
      amount: number; 
      payment_method: PaymentMethod;
      session_id?: string;
      is_bonus?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('buy_ins')
        .insert([{ table_id, player_id, amount, payment_method, session_id, is_bonus }])
        .select()
        .single();

      if (error) throw error;

      // If it's a credit/fiado, create a credit record
      if (payment_method === 'credit_fiado') {
        await supabase
          .from('credit_records')
          .insert([{ player_id, buy_in_id: data.id, amount }]);
      }

      return data as BuyIn;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Buy-in registrado!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar buy-in');
      console.error(error);
    },
  });

  // Add cash-out
  const addCashOut = useMutation({
    mutationFn: async ({ 
      table_id, 
      player_id, 
      chip_value,
      total_buy_in,
      profit,
      payment_method,
      session_id
    }: { 
      table_id: string; 
      player_id: string; 
      chip_value: number;
      total_buy_in: number;
      profit: number;
      payment_method: PaymentMethod;
      session_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('cash_outs')
        .insert([{ table_id, player_id, chip_value, total_buy_in, profit, payment_method, session_id }])
        .select()
        .single();

      if (error) throw error;
      return data as CashOut;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Cash-out registrado!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar cash-out');
      console.error(error);
    },
  });

  // Delete buy-in with smart rollback (handles credit_fiado cleanup via CASCADE)
  // Also tracks the cancelled buy-in for reporting
  const deleteBuyIn = useMutation({
    mutationFn: async (id: string) => {
      // First, get the buy-in details to check if it was credit_fiado
      const { data: buyIn, error: fetchError } = await supabase
        .from('buy_ins')
        .select('*, player:players(*), table:tables(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Track the cancelled buy-in for reporting
      await supabase
        .from('cancelled_buy_ins')
        .insert([{
          original_buy_in_id: buyIn.id,
          player_id: buyIn.player_id,
          player_name: buyIn.player?.name || 'Desconhecido',
          table_id: buyIn.table_id,
          table_name: buyIn.table?.name || 'Mesa',
          session_id: buyIn.session_id,
          amount: buyIn.amount,
          payment_method: buyIn.payment_method,
        }]);

      // If it was credit_fiado, we need to update player's credit_balance
      if (buyIn.payment_method === 'credit_fiado') {
        const { data: creditRecord } = await supabase
          .from('credit_records')
          .select('*')
          .eq('buy_in_id', id)
          .maybeSingle();

        if (creditRecord && !creditRecord.is_paid) {
          await supabase
            .from('players')
            .update({ 
              credit_balance: Math.max(0, (buyIn.player?.credit_balance || 0) - creditRecord.amount)
            })
            .eq('id', buyIn.player_id);
        }
      }

      // Delete the buy-in (credit_records will cascade)
      const { error } = await supabase
        .from('buy_ins')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { buyIn };
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Buy-in excluído e saldos revertidos!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir buy-in');
      console.error(error);
    },
  });

  // Delete cash-out
  const deleteCashOut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_outs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Cash-out excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir cash-out');
      console.error(error);
    },
  });

  // Get daily summary
  const dailySummary: DailySummary = {
    date: targetDate,
    totalBuyIns: buyIns.reduce((sum, b) => sum + Number(b.amount), 0),
    totalCashOuts: cashOuts.reduce((sum, c) => sum + Number(c.chip_value), 0),
    totalBonuses: buyIns.filter(b => b.is_bonus || b.payment_method === 'bonus').reduce((sum, b) => sum + Number(b.amount), 0),
    totalCredits: buyIns.filter(b => b.payment_method === 'credit_fiado').reduce((sum, b) => sum + Number(b.amount), 0),
    totalDealerTips: dealerTips.reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0),
    balance: buyIns.reduce((sum, b) => sum + Number(b.amount), 0) - cashOuts.reduce((sum, c) => sum + Number(c.chip_value), 0),
    realBalance: buyIns
      .filter(b => !b.is_bonus && b.payment_method !== 'bonus' && b.payment_method !== 'credit_fiado')
      .reduce((sum, b) => sum + Number(b.amount), 0) - cashOuts.reduce((sum, c) => sum + Number(c.chip_value), 0),
    transactionCount: buyIns.length + cashOuts.length,
  };

  // Combine into transactions list
  const transactions: Transaction[] = [
    ...buyIns.map((b): Transaction => ({
      id: b.id,
      type: 'buy-in',
      table_id: b.table_id,
      table_name: b.table?.name,
      player_id: b.player_id,
      player_name: b.player?.name,
      amount: Number(b.amount),
      payment_method: b.payment_method,
      is_bonus: b.is_bonus,
      timestamp: new Date(b.created_at),
    })),
    ...cashOuts.map((c): Transaction => ({
      id: c.id,
      type: 'cash-out',
      table_id: c.table_id,
      table_name: c.table?.name,
      player_id: c.player_id,
      player_name: c.player?.name,
      amount: Number(c.chip_value),
      payment_method: c.payment_method,
      profit: Number(c.profit),
      timestamp: new Date(c.created_at),
    })),
    ...dealerTips.map((t: { id: string; dealer_id: string; dealer: { name: string }; amount: number; created_at: string }): Transaction => ({
      id: t.id,
      type: 'dealer-tip',
      dealer_id: t.dealer_id,
      dealer_name: t.dealer?.name,
      amount: Number(t.amount),
      timestamp: new Date(t.created_at),
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    buyIns,
    cashOuts,
    dealerTips,
    transactions,
    dailySummary,
    isLoading: loadingBuyIns || loadingCashOuts,
    addBuyIn: addBuyIn.mutate,
    addCashOut: addCashOut.mutate,
    deleteBuyIn: deleteBuyIn.mutate,
    deleteCashOut: deleteCashOut.mutate,
  };
}

// Hook for getting active sessions at a table
export function useActiveSessions(tableId: string) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['active-sessions', tableId],
    queryFn: async () => {
      // Get all buy-ins for this table
      const { data: buyIns, error: buyInError } = await supabase
        .from('buy_ins')
        .select('*, player:players(*)')
        .eq('table_id', tableId);

      if (buyInError) throw buyInError;

      // Get all cash-outs for this table
      const { data: cashOuts, error: cashOutError } = await supabase
        .from('cash_outs')
        .select('*')
        .eq('table_id', tableId);

      if (cashOutError) throw cashOutError;

      // Calculate active sessions
      const playerMap = new Map<string, {
        playerId: string;
        playerName: string;
        tableId: string;
        totalBuyIn: number;
        buyInCount: number;
        startTime: Date;
      }>();

      for (const buyIn of buyIns || []) {
        const existing = playerMap.get(buyIn.player_id);
        if (existing) {
          existing.totalBuyIn += Number(buyIn.amount);
          existing.buyInCount += 1;
        } else {
          playerMap.set(buyIn.player_id, {
            playerId: buyIn.player_id,
            playerName: buyIn.player?.name || 'Desconhecido',
            tableId,
            totalBuyIn: Number(buyIn.amount),
            buyInCount: 1,
            startTime: new Date(buyIn.created_at),
          });
        }
      }

      // Subtract cash-outs
      for (const cashOut of cashOuts || []) {
        const existing = playerMap.get(cashOut.player_id);
        if (existing) {
          existing.totalBuyIn -= Number(cashOut.total_buy_in);
          if (existing.totalBuyIn <= 0) {
            playerMap.delete(cashOut.player_id);
          }
        }
      }

      return Array.from(playerMap.values());
    },
    enabled: !!tableId,
  });

  return { sessions, isLoading };
}

// Hook for getting table buy-ins total
export function useTableTotal(tableId: string) {
  const { data: total = 0 } = useQuery({
    queryKey: ['table-total', tableId],
    queryFn: async () => {
      const { data: buyIns, error: buyInError } = await supabase
        .from('buy_ins')
        .select('amount')
        .eq('table_id', tableId);

      if (buyInError) throw buyInError;

      const { data: cashOuts, error: cashOutError } = await supabase
        .from('cash_outs')
        .select('chip_value')
        .eq('table_id', tableId);

      if (cashOutError) throw cashOutError;

      const totalBuyIns = (buyIns || []).reduce((sum, b) => sum + Number(b.amount), 0);
      const totalCashOuts = (cashOuts || []).reduce((sum, c) => sum + Number(c.chip_value), 0);

      return totalBuyIns - totalCashOuts;
    },
    enabled: !!tableId,
  });

  return total;
}
