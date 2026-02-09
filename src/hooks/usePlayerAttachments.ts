import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerAttachment } from '@/types/poker';
import { toast } from 'sonner';

export function usePlayerAttachments(playerId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['player-attachments', playerId],
    queryFn: async () => {
      if (!playerId) return [];
      const { data, error } = await supabase
        .from('player_attachments')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PlayerAttachment[];
    },
    enabled: !!playerId,
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!playerId) throw new Error('Player ID required');
      const ext = file.name.split('.').pop();
      const path = `${playerId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('player-attachments')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('player-attachments')
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from('player_attachments')
        .insert([{
          player_id: playerId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        }]);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-attachments', playerId] });
      toast.success('Arquivo enviado!');
    },
    onError: () => toast.error('Erro ao enviar arquivo'),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: PlayerAttachment) => {
      // Extract storage path from URL
      const url = new URL(attachment.file_url);
      const pathParts = url.pathname.split('/player-attachments/');
      if (pathParts[1]) {
        await supabase.storage.from('player-attachments').remove([decodeURIComponent(pathParts[1])]);
      }
      const { error } = await supabase
        .from('player_attachments')
        .delete()
        .eq('id', attachment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-attachments', playerId] });
      toast.success('Arquivo removido!');
    },
    onError: () => toast.error('Erro ao remover arquivo'),
  });

  return {
    attachments,
    isLoading,
    uploadAttachment: uploadAttachment.mutateAsync,
    deleteAttachment: deleteAttachment.mutate,
    isUploading: uploadAttachment.isPending,
  };
}
