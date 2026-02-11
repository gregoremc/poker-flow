import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreditRecord, PaymentMethod } from '@/types/poker';
import { toast } from 'sonner';

export function useCreditRecords() {
  const queryClient = useQueryClient();

  // Helper to invalidate all related queries
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['credit-records'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
    queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    queryClient.invalidateQueries({ queryKey: ['buy-ins'] });
    queryClient.invalidateQueries({ queryKey: ['cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  // Get all credit records (both paid and unpaid for history)
  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['credit-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_records')
        .select(`
          *,
          player:players(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CreditRecord[];
    },
  });

  // Get payment receipts for a credit record (partial payments log)
  const { data: paymentReceipts = [] } = useQuery({
    queryKey: ['payment-receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Get credit records for a specific player
  const getPlayerCredits = async (playerId: string) => {
    const { data, error } = await supabase
      .from('credit_records')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_paid', false);

    if (error) throw error;
    return data as CreditRecord[];
  };

  // Mark credit as paid
  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('credit_records')
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CreditRecord;
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Crédito quitado!');
    },
    onError: (error) => {
      toast.error('Erro ao quitar crédito');
      console.error(error);
    },
  });

  // Receive partial or full payment
  // Handles fractional payments: only marks as paid when remainder reaches 0
  const receivePaymentMutation = useMutation({
    mutationFn: async ({ 
      creditId, 
      paymentMethod, 
      sessionId,
      amount,
    }: { 
      creditId: string; 
      paymentMethod: PaymentMethod;
      sessionId?: string;
      amount?: number; // if not provided, pays full amount
    }) => {
      // Get the credit record first
      const { data: credit, error: creditError } = await supabase
        .from('credit_records')
        .select('*')
        .eq('id', creditId)
        .single();

      if (creditError) throw creditError;

      const payAmount = amount ?? credit.amount;
      const remaining = Number(credit.amount) - payAmount;

      // Create payment receipt (this is the "entry" in the cash)
      const { error: receiptError } = await supabase
        .from('payment_receipts')
        .insert([{
          credit_record_id: creditId,
          player_id: credit.player_id,
          amount: payAmount,
          payment_method: paymentMethod,
          session_id: sessionId,
        }]);

      if (receiptError) throw receiptError;

      if (remaining <= 0) {
        // Fully paid - mark as paid (trigger will handle credit_balance reduction)
        const { data, error } = await supabase
          .from('credit_records')
          .update({ 
            is_paid: true, 
            paid_at: new Date().toISOString(),
          })
          .eq('id', creditId)
          .select()
          .single();

        if (error) throw error;
        return data as CreditRecord;
      } else {
        // Partial payment - reduce original amount and manually adjust credit_balance
        const { data: player } = await supabase
          .from('players')
          .select('credit_balance')
          .eq('id', credit.player_id)
          .single();

        if (player) {
          await supabase
            .from('players')
            .update({ credit_balance: Math.max(0, Number(player.credit_balance) - payAmount) })
            .eq('id', credit.player_id);
        }

        const { data, error } = await supabase
          .from('credit_records')
          .update({ amount: remaining })
          .eq('id', creditId)
          .select()
          .single();

        if (error) throw error;
        return data as CreditRecord;
      }
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast.success('Pagamento recebido! Entrada registrada no caixa.');
    },
    onError: (error) => {
      toast.error('Erro ao receber pagamento');
      console.error(error);
    },
  });

  // Total unpaid credits
  const unpaidCredits = credits.filter(c => !c.is_paid);
  const totalUnpaid = unpaidCredits.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    credits,
    unpaidCredits,
    paymentReceipts,
    isLoading,
    getPlayerCredits,
    markAsPaid: markAsPaid.mutate,
    receivePayment: receivePaymentMutation.mutateAsync,
    isReceiving: receivePaymentMutation.isPending,
    totalUnpaid,
  };
}
