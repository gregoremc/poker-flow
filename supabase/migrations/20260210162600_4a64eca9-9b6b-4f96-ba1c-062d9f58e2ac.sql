
-- 1. Log BUY-IN creation
CREATE OR REPLACE FUNCTION public.log_buy_in_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_name TEXT;
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_player_name FROM public.players WHERE id = NEW.player_id;
  SELECT name INTO v_table_name FROM public.tables WHERE id = NEW.table_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'buy_in_created',
    'Buy-in de "' || COALESCE(v_player_name, 'Desconhecido') || '" - R$ ' || NEW.amount,
    jsonb_build_object(
      'buy_in_id', NEW.id,
      'player_id', NEW.player_id,
      'player_name', v_player_name,
      'table_id', NEW.table_id,
      'table_name', v_table_name,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'is_bonus', NEW.is_bonus,
      'session_id', NEW.session_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_buy_in_creation_trigger
AFTER INSERT ON public.buy_ins
FOR EACH ROW
EXECUTE FUNCTION public.log_buy_in_creation();

-- 2. Log CASH-OUT creation
CREATE OR REPLACE FUNCTION public.log_cash_out_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_name TEXT;
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_player_name FROM public.players WHERE id = NEW.player_id;
  SELECT name INTO v_table_name FROM public.tables WHERE id = NEW.table_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'cash_out_created',
    'Cash-out de "' || COALESCE(v_player_name, 'Desconhecido') || '" - R$ ' || NEW.chip_value,
    jsonb_build_object(
      'cash_out_id', NEW.id,
      'player_id', NEW.player_id,
      'player_name', v_player_name,
      'table_id', NEW.table_id,
      'table_name', v_table_name,
      'chip_value', NEW.chip_value,
      'total_buy_in', NEW.total_buy_in,
      'profit', NEW.profit,
      'payment_method', NEW.payment_method,
      'session_id', NEW.session_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_cash_out_creation_trigger
AFTER INSERT ON public.cash_outs
FOR EACH ROW
EXECUTE FUNCTION public.log_cash_out_creation();

-- 3. Log DEALER TIP creation
CREATE OR REPLACE FUNCTION public.log_dealer_tip_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_dealer_name TEXT;
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_dealer_name FROM public.dealers WHERE id = NEW.dealer_id;
  IF NEW.table_id IS NOT NULL THEN
    SELECT name INTO v_table_name FROM public.tables WHERE id = NEW.table_id;
  END IF;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'dealer_tip_created',
    'Caixinha para "' || COALESCE(v_dealer_name, 'Desconhecido') || '" - R$ ' || NEW.amount,
    jsonb_build_object(
      'dealer_tip_id', NEW.id,
      'dealer_id', NEW.dealer_id,
      'dealer_name', v_dealer_name,
      'table_id', NEW.table_id,
      'table_name', v_table_name,
      'amount', NEW.amount,
      'session_id', NEW.session_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_dealer_tip_creation_trigger
AFTER INSERT ON public.dealer_tips
FOR EACH ROW
EXECUTE FUNCTION public.log_dealer_tip_creation();

-- 4. Log RAKE creation
CREATE OR REPLACE FUNCTION public.log_rake_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_table_name FROM public.tables WHERE id = NEW.table_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'rake_created',
    'Rake registrado na "' || COALESCE(v_table_name, 'Mesa') || '" - R$ ' || NEW.amount,
    jsonb_build_object(
      'rake_id', NEW.id,
      'table_id', NEW.table_id,
      'table_name', v_table_name,
      'amount', NEW.amount,
      'notes', NEW.notes,
      'session_id', NEW.session_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_rake_creation_trigger
AFTER INSERT ON public.rake_entries
FOR EACH ROW
EXECUTE FUNCTION public.log_rake_creation();

-- 5. Log RAKE deletion
CREATE OR REPLACE FUNCTION public.log_rake_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_table_name FROM public.tables WHERE id = OLD.table_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'rake_cancelled',
    'Rake estornado na "' || COALESCE(v_table_name, 'Mesa') || '" - R$ ' || OLD.amount,
    jsonb_build_object(
      'rake_id', OLD.id,
      'table_id', OLD.table_id,
      'table_name', v_table_name,
      'amount', OLD.amount,
      'notes', OLD.notes,
      'session_id', OLD.session_id,
      'created_at', OLD.created_at
    )
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER log_rake_deletion_trigger
BEFORE DELETE ON public.rake_entries
FOR EACH ROW
EXECUTE FUNCTION public.log_rake_deletion();

-- 6. Log TABLE creation
CREATE OR REPLACE FUNCTION public.log_table_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'table_created',
    'Mesa "' || NEW.name || '" criada',
    jsonb_build_object(
      'table_id', NEW.id,
      'table_name', NEW.name,
      'session_id', NEW.session_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_table_creation_trigger
AFTER INSERT ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.log_table_creation();

-- 7. Log TABLE deletion
CREATE OR REPLACE FUNCTION public.log_table_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'table_deleted',
    'Mesa "' || OLD.name || '" excluída',
    jsonb_build_object(
      'table_id', OLD.id,
      'table_name', OLD.name,
      'session_id', OLD.session_id
    )
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER log_table_deletion_trigger
BEFORE DELETE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.log_table_deletion();

-- 8. Log SESSION creation (open)
CREATE OR REPLACE FUNCTION public.log_session_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'session_opened',
    'Caixa "' || NEW.name || '" aberto' || COALESCE(' por ' || NEW.responsible, ''),
    jsonb_build_object(
      'session_id', NEW.id,
      'session_name', NEW.name,
      'session_date', NEW.session_date,
      'responsible', NEW.responsible
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_session_creation_trigger
AFTER INSERT ON public.cash_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_session_creation();

-- 9. Log SESSION close/reopen
CREATE OR REPLACE FUNCTION public.log_session_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.is_open = true AND NEW.is_open = false THEN
    INSERT INTO public.audit_logs (event_type, description, metadata)
    VALUES (
      'session_closed',
      'Caixa "' || NEW.name || '" fechado',
      jsonb_build_object(
        'session_id', NEW.id,
        'session_name', NEW.name,
        'session_date', NEW.session_date,
        'responsible', NEW.responsible,
        'closed_at', NEW.closed_at,
        'notes', NEW.notes
      )
    );
  ELSIF OLD.is_open = false AND NEW.is_open = true THEN
    INSERT INTO public.audit_logs (event_type, description, metadata)
    VALUES (
      'session_reopened',
      'Caixa "' || NEW.name || '" reaberto',
      jsonb_build_object(
        'session_id', NEW.id,
        'session_name', NEW.name,
        'session_date', NEW.session_date,
        'responsible', NEW.responsible
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_session_status_change_trigger
AFTER UPDATE ON public.cash_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_session_status_change();

-- 10. Log DEALER PAYOUT
CREATE OR REPLACE FUNCTION public.log_dealer_payout_creation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_dealer_name TEXT;
BEGIN
  SELECT name INTO v_dealer_name FROM public.dealers WHERE id = NEW.dealer_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'dealer_payout',
    'Dealer "' || COALESCE(v_dealer_name, 'Desconhecido') || '" quitado - R$ ' || NEW.amount,
    jsonb_build_object(
      'payout_id', NEW.id,
      'dealer_id', NEW.dealer_id,
      'dealer_name', v_dealer_name,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'session_id', NEW.session_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_dealer_payout_creation_trigger
AFTER INSERT ON public.dealer_payouts
FOR EACH ROW
EXECUTE FUNCTION public.log_dealer_payout_creation();

-- 11. Log CREDIT PAYMENT (fiado quitação)
CREATE OR REPLACE FUNCTION public.log_credit_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_name TEXT;
BEGIN
  IF OLD.is_paid = false AND NEW.is_paid = true THEN
    SELECT name INTO v_player_name FROM public.players WHERE id = NEW.player_id;
    INSERT INTO public.audit_logs (event_type, description, metadata)
    VALUES (
      'credit_paid',
      'Fiado de "' || COALESCE(v_player_name, 'Desconhecido') || '" quitado - R$ ' || NEW.amount,
      jsonb_build_object(
        'credit_id', NEW.id,
        'player_id', NEW.player_id,
        'player_name', v_player_name,
        'amount', NEW.amount,
        'paid_at', NEW.paid_at,
        'buy_in_id', NEW.buy_in_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_credit_payment_trigger
AFTER UPDATE ON public.credit_records
FOR EACH ROW
EXECUTE FUNCTION public.log_credit_payment();

-- 12. Also update existing deletion triggers to save FULL object data in metadata
-- Update cash_out deletion to include full data
CREATE OR REPLACE FUNCTION public.log_cash_out_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_name TEXT;
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_player_name FROM public.players WHERE id = OLD.player_id;
  SELECT name INTO v_table_name FROM public.tables WHERE id = OLD.table_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'cash_out_cancelled',
    'Cash-out de "' || COALESCE(v_player_name, 'Desconhecido') || '" estornado - R$ ' || OLD.chip_value,
    jsonb_build_object(
      'cash_out_id', OLD.id,
      'player_id', OLD.player_id,
      'player_name', v_player_name,
      'table_id', OLD.table_id,
      'table_name', v_table_name,
      'chip_value', OLD.chip_value,
      'total_buy_in', OLD.total_buy_in,
      'profit', OLD.profit,
      'payment_method', OLD.payment_method,
      'session_id', OLD.session_id,
      'created_at', OLD.created_at
    )
  );
  RETURN OLD;
END;
$$;

-- Update dealer tip deletion to include full data
CREATE OR REPLACE FUNCTION public.log_dealer_tip_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_dealer_name TEXT;
  v_table_name TEXT;
BEGIN
  SELECT name INTO v_dealer_name FROM public.dealers WHERE id = OLD.dealer_id;
  IF OLD.table_id IS NOT NULL THEN
    SELECT name INTO v_table_name FROM public.tables WHERE id = OLD.table_id;
  END IF;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'dealer_tip_cancelled',
    'Caixinha de "' || COALESCE(v_dealer_name, 'Desconhecido') || '" estornada - R$ ' || OLD.amount,
    jsonb_build_object(
      'dealer_tip_id', OLD.id,
      'dealer_id', OLD.dealer_id,
      'dealer_name', v_dealer_name,
      'table_id', OLD.table_id,
      'table_name', v_table_name,
      'amount', OLD.amount,
      'notes', OLD.notes,
      'session_id', OLD.session_id,
      'created_at', OLD.created_at
    )
  );
  RETURN OLD;
END;
$$;
