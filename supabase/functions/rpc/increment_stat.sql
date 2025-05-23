
CREATE OR REPLACE FUNCTION public.increment_stat(stat_id text, inc_amount integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  result INT;
BEGIN
  -- First check if the record exists
  IF NOT EXISTS (SELECT 1 FROM public.stats WHERE id = stat_id) THEN
    -- Create the record if it doesn't exist
    INSERT INTO public.stats (id, count)
    VALUES (stat_id, 0);
  END IF;

  -- Update the stats counter and return new value  
  UPDATE public.stats 
  SET count = count + inc_amount,
      updated_at = now()
  WHERE id = stat_id
  RETURNING count INTO result;
  
  -- Return the new count value
  RETURN result;
END;
$function$;
