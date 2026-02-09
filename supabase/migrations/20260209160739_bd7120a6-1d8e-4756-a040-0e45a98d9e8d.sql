
-- Create audit_logs table for tracking all system events
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'session_deleted', 'player_deleted', 'buy_in_cancelled', 'cash_out_cancelled', 'session_closed', 'session_reopened'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read/write access (no auth in this project)
CREATE POLICY "Public access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Trigger: log session deletions
CREATE OR REPLACE FUNCTION public.log_session_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'session_deleted',
    'Caixa "' || OLD.name || '" excluído' || COALESCE(' pelo responsável ' || OLD.responsible, ''),
    jsonb_build_object(
      'session_id', OLD.id,
      'session_name', OLD.name,
      'session_date', OLD.session_date,
      'responsible', OLD.responsible
    )
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_log_session_deletion
BEFORE DELETE ON public.cash_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_session_deletion();

-- Trigger: log player soft-deletion (is_active = false)
CREATE OR REPLACE FUNCTION public.log_player_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.audit_logs (event_type, description, metadata)
    VALUES (
      'player_deleted',
      'Jogador "' || OLD.name || '" removido do sistema',
      jsonb_build_object(
        'player_id', OLD.id,
        'player_name', OLD.name,
        'cpf', OLD.cpf,
        'phone', OLD.phone
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_player_deletion
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.log_player_deletion();

-- Trigger: log buy-in cancellations (already tracked in cancelled_buy_ins, but also add to audit_logs)
CREATE OR REPLACE FUNCTION public.log_buy_in_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'buy_in_cancelled',
    'Buy-in de "' || NEW.player_name || '" cancelado - ' || NEW.amount || ' (' || NEW.payment_method || ')',
    jsonb_build_object(
      'original_buy_in_id', NEW.original_buy_in_id,
      'player_name', NEW.player_name,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'table_name', NEW.table_name,
      'session_id', NEW.session_id
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_buy_in_cancellation
AFTER INSERT ON public.cancelled_buy_ins
FOR EACH ROW
EXECUTE FUNCTION public.log_buy_in_cancellation();

-- Trigger: log cash-out deletions  
CREATE OR REPLACE FUNCTION public.log_cash_out_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_player_name TEXT;
BEGIN
  SELECT name INTO v_player_name FROM public.players WHERE id = OLD.player_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'cash_out_cancelled',
    'Cash-out de "' || COALESCE(v_player_name, 'Desconhecido') || '" estornado - ' || OLD.chip_value,
    jsonb_build_object(
      'player_id', OLD.player_id,
      'player_name', v_player_name,
      'chip_value', OLD.chip_value,
      'total_buy_in', OLD.total_buy_in,
      'profit', OLD.profit,
      'session_id', OLD.session_id
    )
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_log_cash_out_deletion
BEFORE DELETE ON public.cash_outs
FOR EACH ROW
EXECUTE FUNCTION public.log_cash_out_deletion();
