create table if not exists public.payment_orders (
  invoice_number text primary key,
  session_hash text not null,
  customer_email text not null,
  amount integer not null check (amount = 25000),
  status text not null check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.pro_subscriptions (
  session_hash text primary key,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.payment_orders enable row level security;
alter table public.pro_subscriptions enable row level security;

create or replace function public.fulfill_pro_payment(p_invoice_number text, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_hash text;
  v_amount integer;
  v_status text;
begin
  select session_hash, amount, status
    into v_session_hash, v_amount, v_status
    from public.payment_orders
    where invoice_number = p_invoice_number
    for update;

  if not found or v_amount <> 25000 or p_amount <> v_amount then
    raise exception 'Payment order not found or amount mismatch';
  end if;

  if v_status = 'paid' then
    return true;
  end if;

  update public.payment_orders set status = 'paid' where invoice_number = p_invoice_number;
  insert into public.pro_subscriptions (session_hash, expires_at, updated_at)
  values (v_session_hash, now() + interval '1 month', now())
  on conflict (session_hash) do update
    set expires_at = greatest(public.pro_subscriptions.expires_at, now()) + interval '1 month',
        updated_at = now();
  return true;
end;
$$;

revoke all on function public.fulfill_pro_payment(text, integer) from public, anon, authenticated;
grant execute on function public.fulfill_pro_payment(text, integer) to service_role;
