-- Enable the http extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Update the trigger function to use the http extension
CREATE OR REPLACE FUNCTION public.trigger_detect_available_spots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Call the detect-available-spots edge function immediately using the http extension
  PERFORM extensions.http_post(
    'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
    '{"triggered_by": "database_trigger", "trigger_event": "' || TG_OP || '", "table": "' || TG_TABLE_NAME || '"}',
    'application/json'
  );
  
  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;