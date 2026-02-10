-- Audit log trigger for dealer tip deletion
CREATE OR REPLACE FUNCTION public.log_dealer_tip_deletion()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  v_dealer_name TEXT;
BEGIN
  SELECT name INTO v_dealer_name FROM public.dealers WHERE id = OLD.dealer_id;
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'dealer_tip_cancelled',
    'Caixinha de "' || COALESCE(v_dealer_name, 'Desconhecido') || '" estornada - ' || OLD.amount,
    jsonb_build_object(
      'dealer_id', OLD.dealer_id,
      'dealer_name', v_dealer_name,
      'amount', OLD.amount,
      'session_id', OLD.session_id,
      'table_id', OLD.table_id
    )
  );
  RETURN OLD;
END;
$function$;

CREATE TRIGGER log_dealer_tip_deletion_trigger
  BEFORE DELETE ON public.dealer_tips
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dealer_tip_deletion();