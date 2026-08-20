-- Publieke offerte-lookup op token (geen brede anon SELECT op offertes).
create or replace function public.get_public_offerte_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offerte public.offertes%rowtype;
  v_bedrijf jsonb;
  v_customer jsonb;
  v_lijnen jsonb;
  v_prev_status text;
begin
  if p_token is null or p_token !~ '^[a-fA-F0-9]{32}$' then
    return jsonb_build_object('error', 'invalid');
  end if;

  select * into v_offerte
  from public.offertes
  where public_token = lower(p_token)
     or public_token = p_token
  limit 1;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_offerte.token_expires_at is not null
     and v_offerte.token_expires_at < now() then
    return jsonb_build_object('error', 'expired');
  end if;

  v_prev_status := v_offerte.status_new;

  if v_offerte.viewed_at is null then
    update public.offertes
    set
      viewed_at = now(),
      updated_at = now(),
      status_new = case
        when v_prev_status = 'verzonden' then 'bekeken'
        else status_new
      end,
      status = case
        when v_prev_status = 'verzonden' then 'Bekeken'
        else status
      end
    where id = v_offerte.id
      and bedrijf_id = v_offerte.bedrijf_id;
  end if;

  select to_jsonb(b) into v_bedrijf
  from (
    select naam, adres, postcode, stad, telefoon, email, btw, iban,
           algemene_voorwaarden, footer_tekst, default_quote_template
    from public.bedrijven
    where id = v_offerte.bedrijf_id
  ) b;

  if v_bedrijf is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_offerte.customer_id is not null then
    select to_jsonb(c) into v_customer
    from (
      select name, company_name, first_name, last_name, address, email, phone, btw
      from public.customers
      where id = v_offerte.customer_id
        and company_id = v_offerte.bedrijf_id
    ) c;
  end if;

  select coalesce(jsonb_agg(to_jsonb(l) order by l.sort_order), '[]'::jsonb)
  into v_lijnen
  from (
    select omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage, sort_order
    from public.offerte_lijnen
    where offerte_id = v_offerte.id
      and company_id = v_offerte.bedrijf_id
    order by sort_order
  ) l;

  return jsonb_build_object(
    'error', null,
    'offerte', jsonb_build_object(
      'id', v_offerte.id,
      'nummer', v_offerte.nummer,
      'klant', v_offerte.klant,
      'datum', v_offerte.datum,
      'geldig_tot', v_offerte.geldig_tot,
      'notes', v_offerte.notes,
      'template_id', v_offerte.template_id,
      'bedrijf_id', v_offerte.bedrijf_id
    ),
    'bedrijf', v_bedrijf,
    'customer', v_customer,
    'lijnen', v_lijnen
  );
end;
$$;

revoke all on function public.get_public_offerte_by_token(text) from public;
grant execute on function public.get_public_offerte_by_token(text) to anon, authenticated;

comment on function public.get_public_offerte_by_token(text) is
  'Token-scoped public quote payload. SECURITY DEFINER; returns only one offerte matched by public_token.';
