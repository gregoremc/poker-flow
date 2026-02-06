import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CashSession, ChipInventory, ChipType } from '@/types/poker';
import { toast } from 'sonner';

export function useCashSession(date?: string) {
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Helper to invalidate all related queries
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-outs'] });
    queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
  };

  // Get session for the date (DO NOT auto-create)
  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-session', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('session_date', targetDate)
        .maybeSingle();

      if (error) throw error;
      
      // Return null if no session exists - user must explicitly open one
      return data as CashSession | null;
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

  // Open a new session for the date
  const openSession = useMutation({
    mutationFn: async (initialInventory?: ChipInventory) => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .insert([{ 
          session_date: targetDate,
          initial_chip_inventory: initialInventory || {},
          is_open: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data as CashSession;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Caixa aberto com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao abrir caixa');
      console.error(error);
    },
  });

  // Close session
  const closeSession = useMutation({
    mutationFn: async ({ 
      finalInventory, 
      notes,
      finalBalance
    }: { 
      finalInventory: ChipInventory; 
      notes?: string;
      finalBalance?: number;
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
      invalidateAllQueries();
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
      invalidateAllQueries();
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
      invalidateAllQueries();
      toast.success('Inventário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar inventário');
      console.error(error);
    },
  });

  // Ensure session exists (for emergency auto-creation when tables/buy-ins are created)
  const ensureSessionExists = async (): Promise<CashSession> => {
    if (session) return session;
    
    // Auto-create session if one doesn't exist
    const result = await openSession.mutateAsync({});
    return result;
  };

  // Derived states
  const sessionExists = !!session;
  const isSessionOpen = session?.is_open === true;
  const isSessionClosed = session?.is_open === false;

  return {
    session,
    chipTypes,
    isLoading,
    sessionExists,
    isSessionOpen,
    isSessionClosed,
    openSession: openSession.mutate,
    openSessionAsync: openSession.mutateAsync,
    closeSession: closeSession.mutate,
    closeSessionAsync: closeSession.mutateAsync,
    reopenSession: reopenSession.mutate,
    reopenSessionAsync: reopenSession.mutateAsync,
    updateInitialInventory: updateInitialInventory.mutate,
    ensureSessionExists,
    isOpening: openSession.isPending,
    isClosing: closeSession.isPending,
  };
}
