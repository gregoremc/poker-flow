import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table } from '@/types/poker';
import { toast } from 'sonner';

export function useTables(sessionId?: string | null) {
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', sessionId],
    queryFn: async () => {
      if (!sessionId) return [] as Table[];

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Table[];
    },
  });

  // Helper to invalidate all related queries
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-outs'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['table-total'] });
    queryClient.invalidateQueries({ queryKey: ['rake-entries'] });
  };

  const addTable = useMutation({
    mutationFn: async ({ name, session_id }: { name: string; session_id: string }) => {
      const { data, error } = await supabase
        .from('tables')
        .insert([{ name, session_id }])
        .select()
        .single();

      if (error) throw error;
      return data as Table;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Mesa criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar mesa');
      console.error(error);
    },
  });

  const toggleTable = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('tables')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Table;
    },
    onSuccess: () => {
      invalidateAllQueries();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar mesa');
      console.error(error);
    },
  });

  // Deactivate all tables linked to a session (used when closing cash)
  const deactivateSessionTables = useMutation({
    mutationFn: async (targetSessionId: string) => {
      const { error } = await supabase
        .from('tables')
        .update({ is_active: false })
        .eq('session_id', targetSessionId)
        .eq('is_active', true);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllQueries();
    },
    onError: (error) => {
      toast.error('Erro ao desativar mesas');
      console.error(error);
    },
  });

  // Permanently delete a table (CASCADE will clean up related records)
  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Mesa excluída permanentemente!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir mesa. Verifique se há transações pendentes.');
      console.error(error);
    },
  });

  return {
    tables,
    isLoading,
    addTable: addTable.mutate,
    toggleTable: toggleTable.mutate,
    deleteTable: deleteTable.mutate,
    deactivateSessionTables: deactivateSessionTables.mutate,
    deactivateSessionTablesAsync: deactivateSessionTables.mutateAsync,
  };
}
