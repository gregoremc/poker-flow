import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dealer, DealerTip } from '@/types/poker';
import { toast } from 'sonner';

export function useDealers() {
  const queryClient = useQueryClient();

  const { data: dealers = [], isLoading } = useQuery({
    queryKey: ['dealers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Dealer[];
    },
  });

  const addDealer = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('dealers')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;
      return data as Dealer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast.success('Dealer adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar dealer');
      console.error(error);
    },
  });

  const deleteDealer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dealers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast.success('Dealer removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover dealer');
      console.error(error);
    },
  });

  const addTip = useMutation({
    mutationFn: async ({ dealer_id, amount, session_id, notes }: { 
      dealer_id: string; 
      amount: number; 
      session_id?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('dealer_tips')
        .insert([{ dealer_id, amount, session_id, notes }])
        .select()
        .single();

      if (error) throw error;
      return data as DealerTip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-tips'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      toast.success('Caixinha registrada!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar caixinha');
      console.error(error);
    },
  });

  return {
    dealers,
    isLoading,
    addDealer: addDealer.mutateAsync,
    deleteDealer: deleteDealer.mutate,
    addTip: addTip.mutate,
    isAdding: addDealer.isPending,
  };
}
