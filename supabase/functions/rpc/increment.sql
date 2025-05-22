
create or replace function public.increment(inc_amount int default 1, table_name text default '', column_name text default '', id text default '', id_column text default 'id')
returns int
language plpgsql
as $$
declare
  query text;
  result int;
  column_exists boolean;
begin
  -- First check if the column exists in the table
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = increment.table_name
    AND column_name = increment.column_name
  ) INTO column_exists;
  
  -- Only proceed if the column exists
  IF column_exists THEN
    -- Build dynamic SQL to update the specified column
    query := format('UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE %I = $2 RETURNING %I',
                   table_name, column_name, column_name, id_column, column_name);
                   
    -- Execute the query with parameters
    execute query using inc_amount, id into result;
    
    -- Return the new value
    return result;
  ELSE
    -- Add the column if it doesn't exist for profiles table specifically
    IF table_name = 'profiles' AND column_name = 'generation_count' THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I int DEFAULT 0', table_name, column_name);
      
      -- Now update it
      query := format('UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE %I = $2 RETURNING %I',
                     table_name, column_name, column_name, id_column, column_name);
      
      -- Execute the query with parameters
      execute query using inc_amount, id into result;
      
      -- Return the new value
      return result;
    END IF;
    
    -- Return the increment amount as fallback for other cases
    return inc_amount;
  END IF;
exception
  when others then
    -- Log error and return the increment amount as fallback
    raise notice 'Error in increment function: %', SQLERRM;
    return inc_amount;
end;
$$;
