import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CashSession, ChipInventory, ChipType } from '@/types/poker';
import { toast } from 'sonner';

export function useCashSession(date?: string, sessionId?: string | null) {
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Helper to invalidate all related queries
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-outs'] });
    queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['rake-entries'] });
    queryClient.invalidateQueries({ queryKey: ['dealer-tips'] });
    queryClient.invalidateQueries({ queryKey: ['dealer-payouts'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['table-total'] });
  };

  // Get ALL sessions for the date (supports multiple sessions per day)
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['cash-sessions', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('session_date', targetDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CashSession[];
    },
  });

  // Get selected session (or first open one, or first one)
  const session = sessionId 
    ? sessions.find(s => s.id === sessionId) 
    : sessions.find(s => s.is_open) || sessions[0] || null;

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

  // Open a new session for the date with a name
  const openSession = useMutation({
    mutationFn: async ({ name, responsible, initialInventory }: { name: string; responsible?: string; initialInventory?: ChipInventory }) => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .insert([{ 
          name,
          responsible: responsible || null,
          session_date: targetDate,
          initial_chip_inventory: initialInventory || {},
          is_open: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Auto-fix: link orphan transactions (no session_id) to this new session
      const sessionId = data.id;
      await Promise.all([
        supabase.from('buy_ins').update({ session_id: sessionId }).is('session_id', null),
        supabase.from('cash_outs').update({ session_id: sessionId }).is('session_id', null),
        supabase.from('dealer_tips').update({ session_id: sessionId }).is('session_id', null),
        supabase.from('rake_entries').update({ session_id: sessionId }).is('session_id', null),
      ]);

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
      sessionIdToClose,
      finalInventory, 
      notes,
      finalBalance
    }: { 
      sessionIdToClose?: string;
      finalInventory: ChipInventory; 
      notes?: string;
      finalBalance?: number;
    }) => {
      const targetSessionId = sessionIdToClose || session?.id;
      if (!targetSessionId) throw new Error('No session found');

      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          is_open: false,
          final_chip_inventory: finalInventory,
          notes,
          closed_at: new Date().toISOString(),
        })
        .eq('id', targetSessionId)
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
    mutationFn: async (sessionIdToReopen?: string) => {
      const targetSessionId = sessionIdToReopen || session?.id;
      if (!targetSessionId) throw new Error('No session found');

      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          is_open: true,
          closed_at: null,
        })
        .eq('id', targetSessionId)
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

  // Delete session (cascade will handle related records)
  const deleteSession = useMutation({
    mutationFn: async (sessionIdToDelete: string) => {
      const { error, count } = await supabase
        .from('cash_sessions')
        .delete()
        .eq('id', sessionIdToDelete)
        .select();

      if (error) throw error;
      return sessionIdToDelete;
    },
    onSuccess: () => {
      // Force remove all cached data to prevent ghost sessions
      queryClient.removeQueries({ queryKey: ['cash-sessions'] });
      queryClient.removeQueries({ queryKey: ['cash-session'] });
      invalidateAllQueries();
      toast.success('Sessão excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir sessão: ' + (error as Error).message);
      console.error('Delete session error:', error);
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

  // Derived states
  const hasAnySessions = sessions.length > 0;
  const hasMultipleSessions = sessions.length > 1;
  const sessionExists = !!session;
  const isSessionOpen = session?.is_open === true;
  const isSessionClosed = session?.is_open === false;
  const hasOpenSession = sessions.some(s => s.is_open);

  return {
    // Multiple sessions
    sessions,
    hasAnySessions,
    hasMultipleSessions,
    hasOpenSession,
    
    // Current/selected session
    session,
    chipTypes,
    isLoading: isLoadingSessions,
    sessionExists,
    isSessionOpen,
    isSessionClosed,
    
    // Actions
    openSession: openSession.mutate,
    openSessionAsync: openSession.mutateAsync,
    closeSession: closeSession.mutate,
    closeSessionAsync: closeSession.mutateAsync,
    reopenSession: reopenSession.mutate,
    reopenSessionAsync: reopenSession.mutateAsync,
    deleteSession: deleteSession.mutate,
    deleteSessionAsync: deleteSession.mutateAsync,
    updateInitialInventory: updateInitialInventory.mutate,
    
    // Loading states
    isOpening: openSession.isPending,
    isClosing: closeSession.isPending,
    isDeleting: deleteSession.isPending,
  };
}
