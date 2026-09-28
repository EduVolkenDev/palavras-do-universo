-- Internal-only recurring Circle variant for controlled Stripe test-mode validation.
-- It is hidden and never changes the commercial Circle product.
insert into public.oracle_products (
  product_key, title, product_type, status, price_cents, currency,
  access_model, provider_price_id, provider_product_id, short_description,
  promise, best_for, not_for, value_position, funnel_stage, cta_label,
  route_path, sort_order, included_in, metadata
)
values (
  'circulo_teste_50', 'Círculo de Teste', 'subscription', 'active', 50, 'BRL',
  'subscription', null, null,
  'Variante interna do Círculo para validar assinatura e entrega.',
  'Confirmar checkout recorrente, webhook, entitlement e acesso diário do Lume.',
  'Ensaio operacional em modo de teste antes de qualquer divulgação.',
  'Uso público ou oferta comercial.',
  'Produto oculto de validação interna.', 'conversion', 'Testar Círculo', null,
  998, array['circulo_teste_50']::text[],
  '{"internal_test":true,"hidden":true,"purpose":"circle_subscription_validation","depth":"test","pricing_source":"inline"}'::jsonb
)
on conflict (product_key) do update set
  title = excluded.title,
  product_type = excluded.product_type,
  status = excluded.status,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  access_model = excluded.access_model,
  provider_price_id = excluded.provider_price_id,
  provider_product_id = excluded.provider_product_id,
  short_description = excluded.short_description,
  promise = excluded.promise,
  best_for = excluded.best_for,
  not_for = excluded.not_for,
  value_position = excluded.value_position,
  funnel_stage = excluded.funnel_stage,
  cta_label = excluded.cta_label,
  route_path = excluded.route_path,
  sort_order = excluded.sort_order,
  included_in = excluded.included_in,
  metadata = public.oracle_products.metadata || excluded.metadata,
  updated_at = now();

update public.oracle_products
set included_in = array_append(included_in, 'circulo_teste_50'::text),
    updated_at = now()
where 'circulo_do_universo' = any(included_in)
  and not ('circulo_teste_50' = any(included_in));
