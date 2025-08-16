-- Create trigger function to call detect-available-spots immediately
CREATE OR REPLACE FUNCTION public.trigger_detect_available_spots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Call the detect-available-spots edge function immediately
  PERFORM net.http_post(
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

-- Create trigger for new programmed classes
CREATE TRIGGER trigger_new_class_available_spots
  AFTER INSERT ON public.programmed_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_detect_available_spots();

-- Create trigger for participant changes (when someone leaves a class)
CREATE TRIGGER trigger_participant_change_available_spots
  AFTER UPDATE OR DELETE ON public.class_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_detect_available_spots();