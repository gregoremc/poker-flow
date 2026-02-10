import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  event_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Filter categories for the History page
export type AuditFilterCategory = 'all' | 'financial' | 'system' | 'cancelled';

// Event types grouped by category
export const FINANCIAL_EVENTS = [
  'buy_in_created', 'cash_out_created', 'dealer_tip_created',
  'rake_created', 'dealer_payout', 'credit_paid',
];

export const SYSTEM_EVENTS = [
  'session_opened', 'session_closed', 'session_reopened',
  'table_created', 'table_deleted', 'session_deleted',
  'player_deleted',
];

export const CANCELLED_EVENTS = [
  'buy_in_cancelled', 'cash_out_cancelled', 'dealer_tip_cancelled',
  'rake_cancelled',
];

// Which event types support undo
const UNDOABLE_EVENTS: Record<string, string> = {
  'buy_in_cancelled': 'buy_ins',
  'cash_out_cancelled': 'cash_outs',
  'dealer_tip_cancelled': 'dealer_tips',
  'rake_cancelled': 'rake_entries',
  'buy_in_created': 'buy_ins',
  'cash_out_created': 'cash_outs',
};

export function useAuditLogs(date?: string) {
  const queryClient = useQueryClient();
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-outs'] });
    queryClient.invalidateQueries({ queryKey: ['dealer-tips'] });
    queryClient.invalidateQueries({ queryKey: ['dealers'] });
    queryClient.invalidateQueries({ queryKey: ['rake-entries'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['credit-records'] });
    queryClient.invalidateQueries({ queryKey: ['cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['table-total'] });
    queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    queryClient.invalidateQueries({ queryKey: ['dealer-payouts'] });
  };

  // Undo an action: re-insert cancelled records OR delete created records
  const undoAction = useMutation({
    mutationFn: async (log: AuditLog) => {
      if (!UNDOABLE_EVENTS[log.event_type]) throw new Error('Ação não suporta desfazer');

      const meta = log.metadata;

      // --- UNDO for CREATED events (reverse the action = delete the record) ---
      if (log.event_type === 'buy_in_created') {
        const buyInId = meta.buy_in_id;
        if (!buyInId) throw new Error('Registro sem ID. Não é possível desfazer.');

        // Check if buy-in still exists
        const { data: existing } = await supabase.from('buy_ins').select('id').eq('id', buyInId).maybeSingle();
        if (!existing) throw new Error('Buy-in já foi excluído.');

        // If credit_fiado, revert credit balance
        if (meta.payment_method === 'credit_fiado') {
          const { data: creditRecord } = await supabase
            .from('credit_records')
            .select('*')
            .eq('buy_in_id', buyInId)
            .maybeSingle();

          if (creditRecord && !creditRecord.is_paid) {
            const { data: player } = await supabase.from('players').select('credit_balance').eq('id', meta.player_id).single();
            if (player) {
              await supabase
                .from('players')
                .update({ credit_balance: Math.max(0, Number(player.credit_balance) - Number(creditRecord.amount)) })
                .eq('id', meta.player_id);
            }
          }
        }

        // Delete the buy-in (cascades credit_records)
        const { error } = await supabase.from('buy_ins').delete().eq('id', buyInId);
        if (error) throw error;

      } else if (log.event_type === 'cash_out_created') {
        const cashOutId = meta.cash_out_id;
        if (!cashOutId) throw new Error('Registro sem ID. Não é possível desfazer.');

        // Check if cash-out still exists
        const { data: existing } = await supabase.from('cash_outs').select('id').eq('id', cashOutId).maybeSingle();
        if (!existing) throw new Error('Cash-out já foi excluído.');

        // Delete the cash-out (player returns to table)
        const { error } = await supabase.from('cash_outs').delete().eq('id', cashOutId);
        if (error) throw error;

      // --- UNDO for CANCELLED events (restore the record = re-insert) ---
      } else if (log.event_type === 'buy_in_cancelled') {
        if (!meta.player_id || !meta.table_id) {
          throw new Error('Registro antigo sem dados completos. Não é possível desfazer.');
        }
        const { error } = await supabase.from('buy_ins').insert([{
          player_id: meta.player_id,
          table_id: meta.table_id,
          session_id: meta.session_id,
          amount: meta.amount,
          payment_method: meta.payment_method,
          is_bonus: meta.is_bonus || false,
        }]);
        if (error) throw error;

        // If it was fiado, re-create credit record
        if (meta.payment_method === 'credit_fiado') {
          const { data: newBuyIn } = await supabase
            .from('buy_ins')
            .select('id')
            .eq('player_id', meta.player_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (newBuyIn) {
            await supabase.from('credit_records').insert([{
              player_id: meta.player_id,
              buy_in_id: newBuyIn.id,
              amount: meta.amount,
            }]);
          }
        }
      } else if (log.event_type === 'cash_out_cancelled') {
        if (!meta.player_id) {
          throw new Error('Registro antigo sem dados completos. Não é possível desfazer.');
        }

        let tableId = meta.table_id;

        if (!tableId && meta.session_id) {
          const { data: sessionTables } = await supabase
            .from('tables')
            .select('id')
            .eq('session_id', meta.session_id)
            .limit(1);
          tableId = sessionTables?.[0]?.id;
        }

        if (!tableId) {
          throw new Error('Não foi possível identificar a mesa. Registro incompleto.');
        }

        const { error } = await supabase.from('cash_outs').insert([{
          player_id: meta.player_id,
          table_id: tableId,
          session_id: meta.session_id,
          chip_value: meta.chip_value,
          total_buy_in: meta.total_buy_in,
          profit: meta.profit,
          payment_method: meta.payment_method || 'cash',
        }]);
        if (error) throw error;
      } else if (log.event_type === 'dealer_tip_cancelled') {
        const { error } = await supabase.from('dealer_tips').insert([{
          dealer_id: meta.dealer_id,
          table_id: meta.table_id,
          session_id: meta.session_id,
          amount: meta.amount,
          notes: meta.notes,
        }]);
        if (error) throw error;
      } else if (log.event_type === 'rake_cancelled') {
        const { error } = await supabase.from('rake_entries').insert([{
          table_id: meta.table_id,
          session_id: meta.session_id,
          amount: meta.amount,
          notes: meta.notes,
        }]);
        if (error) throw error;
      }

      // Delete the audit log entry after successful undo
      await supabase.from('audit_logs').delete().eq('id', log.id);
    },
    onSuccess: (_, log) => {
      invalidateAll();
      const isCreated = log.event_type.endsWith('_created');
      toast.success(isCreated ? 'Ação revertida! Registro excluído.' : 'Ação desfeita! Registro restaurado.');
    },
    onError: (error) => {
      toast.error('Erro ao desfazer ação: ' + (error as Error).message);
      console.error(error);
    },
  });

  return {
    auditLogs,
    isLoading,
    undoAction: undoAction.mutate,
    isUndoing: undoAction.isPending,
    isUndoable: (eventType: string) => !!UNDOABLE_EVENTS[eventType],
  };
}
