
create or replace function public.increment(inc_amount int default 1, table_name text default '', column_name text default '', id text default '', id_column text default 'id')
returns int
language plpgsql
as $$
begin
  return inc_amount;
end;
$$;
