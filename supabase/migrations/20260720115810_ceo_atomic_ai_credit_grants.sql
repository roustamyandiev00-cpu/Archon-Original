-- Make CEO AI credit grants atomic, auditable, and safe to retry.

alter table public.ai_credit_transactions
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists idempotency_key uuid;

create unique index if not exists ai_credit_transactions_admin_grant_idempotency_key
  on public.ai_credit_transactions (idempotency_key)
  where type = 'admin_grant' and idempotency_key is not null;

create or replace function public.ceo_grant_ai_credits(
  p_company_id bigint,
  p_tokens bigint,
  p_actor_user_id uuid,
  p_idempotency_key uuid,
  p_note text
)
returns table (
  transaction_id uuid,
  credits_before bigint,
  credits_after bigint,
  applied boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_before bigint;
  v_after bigint;
  v_transaction_id uuid;
  v_existing_company_id bigint;
  v_existing_amount bigint;
  v_existing_actor_user_id uuid;
  v_existing_before bigint;
  v_existing_after bigint;
begin
  if p_company_id is null or p_company_id <= 0 then
    raise exception 'Invalid company id' using errcode = '22023';
  end if;

  if p_tokens is null or p_tokens < 1 or p_tokens > 10000000 then
    raise exception 'AI credit grant must be between 1 and 10000000'
      using errcode = '22023';
  end if;

  if p_actor_user_id is null or p_idempotency_key is null then
    raise exception 'Actor and idempotency key are required'
      using errcode = '22023';
  end if;

  if p_note is not null and char_length(btrim(p_note)) > 500 then
    raise exception 'Audit note exceeds 500 characters'
      using errcode = '22023';
  end if;

  select credits.credits_remaining
    into v_before
    from public.company_ai_credits as credits
    where credits.company_id = p_company_id
    for update;

  if not found then
    raise exception 'Company credits record not found' using errcode = 'P0002';
  end if;

  select
    tx.id,
    tx.company_id,
    tx.amount,
    tx.actor_user_id,
    tx.credits_before,
    tx.credits_after
  into
    v_transaction_id,
    v_existing_company_id,
    v_existing_amount,
    v_existing_actor_user_id,
    v_existing_before,
    v_existing_after
  from public.ai_credit_transactions as tx
  where tx.type = 'admin_grant'
    and tx.idempotency_key = p_idempotency_key;

  if found then
    if v_existing_company_id <> p_company_id
      or v_existing_amount <> p_tokens
      or v_existing_actor_user_id is distinct from p_actor_user_id then
      raise exception 'Idempotency key was already used for another grant'
        using errcode = '22023';
    end if;

    return query
      select v_transaction_id, v_existing_before, v_existing_after, false;
    return;
  end if;

  v_after := v_before + p_tokens;

  update public.company_ai_credits
  set
    credits_remaining = v_after,
    total_purchased = total_purchased + p_tokens,
    updated_at = now()
  where company_id = p_company_id;

  insert into public.ai_credit_transactions (
    company_id,
    type,
    amount,
    credits_before,
    credits_after,
    description,
    actor_user_id,
    idempotency_key
  )
  values (
    p_company_id,
    'admin_grant',
    p_tokens,
    v_before,
    v_after,
    coalesce(nullif(btrim(p_note), ''), format('CEO granted %s AI credits', p_tokens)),
    p_actor_user_id,
    p_idempotency_key
  )
  returning id into v_transaction_id;

  return query
    select v_transaction_id, v_before, v_after, true;
end;
$$;

revoke all on function public.ceo_grant_ai_credits(bigint, bigint, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.ceo_grant_ai_credits(bigint, bigint, uuid, uuid, text)
  to service_role;

comment on function public.ceo_grant_ai_credits(bigint, bigint, uuid, uuid, text) is
  'Atomically grants AI credits after an application-level CEO check and writes an actor-linked audit transaction.';
