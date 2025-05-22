
create or replace function public.increment(inc_amount int default 1)
returns int
language sql
as $$
  select inc_amount;
$$;
