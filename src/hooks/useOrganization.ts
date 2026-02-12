import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useOrganization() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data?.role as string;
    },
    enabled: !!user?.id,
  });

  return {
    profile,
    organization,
    organizationId: profile?.organization_id,
    organizationName: organization?.name,
    isAdmin: userRole === 'admin',
    userRole,
  };
}
