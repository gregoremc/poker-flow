import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClubSettings } from '@/types/poker';
import { toast } from 'sonner';

export function useClubSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['club-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ClubSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<ClubSettings>) => {
      if (!settings?.id) {
        // Create new settings if none exist
        const { data, error } = await supabase
          .from('club_settings')
          .insert([updates])
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('club_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-settings'] });
      toast.success('Configurações salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    },
  });

  const uploadLogo = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('club-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao fazer upload da logo');
      console.error(uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('club-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
    uploadLogo,
  };
}
