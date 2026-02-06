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

  // Receive payment - marks credit as paid and creates a payment receipt
  // This creates an "entry" in the current cash session
  const receivePaymentMutation = useMutation({
    mutationFn: async ({ 
      creditId, 
      paymentMethod, 
      sessionId 
    }: { 
      creditId: string; 
      paymentMethod: PaymentMethod;
      sessionId?: string;
    }) => {
      // Get the credit record first
      const { data: credit, error: creditError } = await supabase
        .from('credit_records')
        .select('*')
        .eq('id', creditId)
        .single();

      if (creditError) throw creditError;

      // Create payment receipt (this is the "entry" in the cash)
      const { error: receiptError } = await supabase
        .from('payment_receipts')
        .insert([{
          credit_record_id: creditId,
          player_id: credit.player_id,
          amount: credit.amount,
          payment_method: paymentMethod,
          session_id: sessionId,
        }]);

      if (receiptError) throw receiptError;

      // Mark credit as paid (trigger will update player's credit_balance)
      const { data, error } = await supabase
        .from('credit_records')
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq('id', creditId)
        .select()
        .single();

      if (error) throw error;
      return data as CreditRecord;
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
    isLoading,
    getPlayerCredits,
    markAsPaid: markAsPaid.mutate,
    receivePayment: receivePaymentMutation.mutateAsync,
    isReceiving: receivePaymentMutation.isPending,
    totalUnpaid,
  };
}
