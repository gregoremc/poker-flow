import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table } from '@/types/poker';
import { toast } from 'sonner';

export function useTables() {
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Table[];
    },
  });

  const addTable = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('tables')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;
      return data as Table;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
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
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar mesa');
      console.error(error);
    },
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Mesa excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir mesa');
      console.error(error);
    },
  });

  return {
    tables,
    isLoading,
    addTable: addTable.mutate,
    toggleTable: toggleTable.mutate,
    deleteTable: deleteTable.mutate,
  };
}
