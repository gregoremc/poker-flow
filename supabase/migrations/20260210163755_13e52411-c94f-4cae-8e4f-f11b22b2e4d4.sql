
CREATE OR REPLACE FUNCTION public.log_buy_in_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (event_type, description, metadata)
  VALUES (
    'buy_in_cancelled',
    'Buy-in de "' || NEW.player_name || '" cancelado - R$ ' || NEW.amount || ' (' || NEW.payment_method || ')',
    jsonb_build_object(
      'original_buy_in_id', NEW.original_buy_in_id,
      'player_id', NEW.player_id,
      'player_name', NEW.player_name,
      'table_id', NEW.table_id,
      'table_name', NEW.table_name,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method,
      'session_id', NEW.session_id,
      'is_bonus', false
    )
  );
  RETURN NEW;
END;
$function$;
