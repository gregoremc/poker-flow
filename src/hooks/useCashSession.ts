import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CashSession, ChipInventory, ChipType } from '@/types/poker';
import { toast } from 'sonner';

export function useCashSession(date?: string) {
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get or create session for today
  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-session', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('session_date', targetDate)
        .maybeSingle();

      if (error) throw error;
      
      // If no session exists for today, create one
      if (!data) {
        const { data: newSession, error: createError } = await supabase
          .from('cash_sessions')
          .insert([{ session_date: targetDate }])
          .select()
          .single();
        
        if (createError) throw createError;
        return newSession as CashSession;
      }
      
      return data as CashSession;
    },
  });

  // Get chip types
  const { data: chipTypes = [] } = useQuery({
    queryKey: ['chip-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chip_types')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as ChipType[];
    },
  });

  // Close session
  const closeSession = useMutation({
    mutationFn: async ({ 
      finalInventory, 
      notes 
    }: { 
      finalInventory: ChipInventory; 
      notes?: string;
    }) => {
      if (!session?.id) throw new Error('No session found');

      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          is_open: false,
          final_chip_inventory: finalInventory,
          notes,
          closed_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      return data as CashSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      toast.success('Caixa fechado!');
    },
    onError: (error) => {
      toast.error('Erro ao fechar caixa');
      console.error(error);
    },
  });

  // Reopen session
  const reopenSession = useMutation({
    mutationFn: async () => {
      if (!session?.id) throw new Error('No session found');

      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          is_open: true,
          closed_at: null,
        })
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      return data as CashSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      toast.success('Caixa reaberto!');
    },
    onError: (error) => {
      toast.error('Erro ao reabrir caixa');
      console.error(error);
    },
  });

  // Update initial inventory
  const updateInitialInventory = useMutation({
    mutationFn: async (inventory: ChipInventory) => {
      if (!session?.id) throw new Error('No session found');

      const { data, error } = await supabase
        .from('cash_sessions')
        .update({ initial_chip_inventory: inventory })
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      return data as CashSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      toast.success('Inventário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar inventário');
      console.error(error);
    },
  });

  return {
    session,
    chipTypes,
    isLoading,
    closeSession: closeSession.mutate,
    closeSessionAsync: closeSession.mutateAsync,
    reopenSession: reopenSession.mutate,
    updateInitialInventory: updateInitialInventory.mutate,
    isClosing: closeSession.isPending,
  };
}
