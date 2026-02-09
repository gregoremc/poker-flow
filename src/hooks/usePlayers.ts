import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/poker';
import { toast } from 'sonner';

export function usePlayers() {
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Player[];
    },
  });

  const addPlayer = useMutation({
    mutationFn: async (playerData: { name: string; cpf?: string | null; phone?: string | null; metadata?: Record<string, string> }) => {
      const { data, error } = await supabase
        .from('players')
        .insert([{
          name: playerData.name,
          cpf: playerData.cpf || null,
          phone: playerData.phone || null,
          metadata: playerData.metadata || {},
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Jogador adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar jogador');
      console.error(error);
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Player> & { id: string }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Jogador atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar jogador');
      console.error(error);
    },
  });

  const deletePlayer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success('Jogador removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover jogador');
      console.error(error);
    },
  });

  return {
    players,
    isLoading,
    addPlayer: addPlayer.mutateAsync,
    updatePlayer: updatePlayer.mutate,
    deletePlayer: deletePlayer.mutate,
    isAdding: addPlayer.isPending,
  };
}
