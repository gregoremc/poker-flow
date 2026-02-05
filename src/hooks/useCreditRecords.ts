import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreditRecord } from '@/types/poker';
import { toast } from 'sonner';

export function useCreditRecords() {
  const queryClient = useQueryClient();

  // Get all unpaid credit records
  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['credit-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_records')
        .select(`
          *,
          player:players(*)
        `)
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CreditRecord[];
    },
  });

  // Get credit records for a specific player
  const getPlayerCredits = async (playerId: string) => {
    const { data, error } = await supabase
      .from('credit_records')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_paid', false);

    if (error) throw error;
    return data as CreditRecord[];
  };

  // Mark credit as paid
  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('credit_records')
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CreditRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-records'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Crédito quitado!');
    },
    onError: (error) => {
      toast.error('Erro ao quitar crédito');
      console.error(error);
    },
  });

  // Total unpaid credits
  const totalUnpaid = credits.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    credits,
    isLoading,
    getPlayerCredits,
    markAsPaid: markAsPaid.mutate,
    totalUnpaid,
  };
}
