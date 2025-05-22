
create or replace function public.increment(inc_amount int default 1, table_name text default '', column_name text default '', id text default '', id_column text default 'id')
returns int
language plpgsql
as $$
declare
  query text;
  result int;
begin
  -- Build dynamic SQL to update the specified column
  query := format('UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE %I = $2 RETURNING %I',
                 table_name, column_name, column_name, id_column, column_name);
                 
  -- Execute the query with parameters
  execute query using inc_amount, id into result;
  
  -- Return the new value
  return result;
exception
  when others then
    -- Log error and return the increment amount as fallback
    raise notice 'Error in increment function: %', SQLERRM;
    return inc_amount;
end;
$$;
