import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RakeEntry {
  id: string;
  table_id: string;
  session_id: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
  table?: {
    id: string;
    name: string;
  };
}

export function useRake(date?: string) {
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data: rakeEntries = [], isLoading } = useQuery({
    queryKey: ['rake-entries', targetDate],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;

      const { data, error } = await supabase
        .from('rake_entries')
        .select(`
          *,
          table:tables(id, name)
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RakeEntry[];
    },
  });

  const addRake = useMutation({
    mutationFn: async ({ 
      table_id, 
      amount, 
      session_id,
      notes 
    }: { 
      table_id: string; 
      amount: number; 
      session_id?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('rake_entries')
        .insert([{ table_id, amount, session_id, notes }])
        .select(`*, table:tables(id, name)`)
        .single();

      if (error) throw error;
      return data as RakeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rake-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      toast.success('Rake registrado!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar rake');
      console.error(error);
    },
  });

  const deleteRake = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rake_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rake-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      toast.success('Rake excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir rake');
      console.error(error);
    },
  });

  const totalRake = rakeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  // Group by table
  const rakeByTable = rakeEntries.reduce((acc, entry) => {
    const tableId = entry.table_id;
    if (!acc[tableId]) {
      acc[tableId] = {
        tableId,
        tableName: entry.table?.name || 'Mesa',
        entries: [],
        total: 0,
      };
    }
    acc[tableId].entries.push(entry);
    acc[tableId].total += Number(entry.amount);
    return acc;
  }, {} as Record<string, { tableId: string; tableName: string; entries: RakeEntry[]; total: number }>);

  return {
    rakeEntries,
    rakeByTable: Object.values(rakeByTable),
    totalRake,
    isLoading,
    addRake: addRake.mutate,
    deleteRake: deleteRake.mutate,
    isAdding: addRake.isPending,
  };
}
