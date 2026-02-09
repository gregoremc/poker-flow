import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  event_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function useAuditLogs(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', targetDate],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00.000Z`;
      const endOfDay = `${targetDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  return { auditLogs, isLoading };
}
