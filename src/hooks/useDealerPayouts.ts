import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types/poker';
import { toast } from 'sonner';

export interface DealerPayout {
  id: string;
  dealer_id: string;
  session_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  dealer?: {
    id: string;
    name: string;
  };
}

export function useDealerPayouts(date?: string, sessionId?: string | null) {
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['dealer-payouts', targetDate, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('dealer_payouts')
        .select(`
          *,
          dealer:dealers(id, name)
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
      return data as DealerPayout[];
    },
  });

  const payoutDealer = useMutation({
    mutationFn: async ({ 
      dealer_id, 
      amount, 
      session_id,
      payment_method = 'cash' as PaymentMethod
    }: { 
      dealer_id: string; 
      amount: number; 
      session_id?: string;
      payment_method?: PaymentMethod;
    }) => {
      const { data, error } = await supabase
        .from('dealer_payouts')
        .insert([{ dealer_id, amount, session_id, payment_method }])
        .select(`*, dealer:dealers(id, name)`)
        .single();

      if (error) throw error;
      return data as DealerPayout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      toast.success('Dealer quitado!');
    },
    onError: (error) => {
      toast.error('Erro ao quitar dealer');
      console.error(error);
    },
  });

  const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    payouts,
    totalPayouts,
    isLoading,
    payoutDealer: payoutDealer.mutate,
    isPaying: payoutDealer.isPending,
  };
}
