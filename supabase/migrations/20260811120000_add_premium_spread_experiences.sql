-- Seven premium spread experiences included in Círculo do Universo.
-- The reading engine persists spread_type as text, so no readings-table change
-- is required. Product records and entitlements are the access contract.

insert into public.oracle_products (
  product_key,
  title,
  product_type,
  status,
  price_cents,
  currency,
  short_description,
  promise,
  best_for,
  not_for,
  value_position,
  funnel_stage,
  access_model,
  cta_label,
  route_path,
  sort_order,
  included_in,
  metadata
)
values
  (
    'tirada_diamante', 'O Diamante', 'subscription', 'active', null, 'BRL',
    'Cinco cartas para observar uma questão por dentro, por fora e no ponto de integração.',
    'Transformar confusão em camadas numa decisão mais nítida.',
    'Uma pergunta importante que pede contexto antes de conclusão.',
    'Quem busca resposta instantânea ou previsão fechada.',
    'Experiência premium de clareza prismática.', 'retention', 'subscription_included',
    'Abrir O Diamante', '/tiradas/diamante', 61,
    array['circulo_do_universo']::text[],
    '{"spread_type":"diamond","cards":5,"experience":"prismatic"}'::jsonb
  ),
  (
    'passaro_voando', 'O Pássaro Voando', 'subscription', 'active', null, 'BRL',
    'Sete cartas para diferenciar medo, receptividade, ação e horizonte.',
    'Transformar paralisia ou controle excessivo em movimento possível.',
    'Transições, recomeços e momentos que pedem avanço consciente.',
    'Decisões tomadas no impulso ou como fuga do desconforto.',
    'Experiência premium de travessia e movimento.', 'retention', 'subscription_included',
    'Abrir O Pássaro Voando', '/tiradas/passaro-voando', 62,
    array['circulo_do_universo']::text[],
    '{"spread_type":"flying_bird","cards":7,"experience":"open_sky"}'::jsonb
  ),
  (
    'a_chave', 'A Chave', 'subscription', 'active', null, 'BRL',
    'Oito cartas para dar linguagem ao que atua em silêncio e encontrar abertura.',
    'Transformar padrão sem nome em compreensão que devolve escolha.',
    'Questões recorrentes, travas internas e mudanças profundas.',
    'Diagnóstico psicológico, certeza absoluta ou substituição de cuidado profissional.',
    'Experiência premium de investigação interior responsável.', 'retention', 'subscription_included',
    'Abrir A Chave', '/tiradas/a-chave', 63,
    array['circulo_do_universo']::text[],
    '{"spread_type":"the_key","cards":8,"experience":"inner_door"}'::jsonb
  ),
  (
    'o_espelho', 'O Espelho', 'subscription', 'active', null, 'BRL',
    'Doze cartas para observar vínculo, projeção, necessidade, limite e escolha.',
    'Transformar ansiedade relacional em leitura madura do encontro.',
    'Relações importantes, conversas difíceis e padrões afetivos.',
    'Invadir, adivinhar ou controlar o que outra pessoa sente.',
    'A experiência relacional mais profunda do portal.', 'retention', 'subscription_included',
    'Abrir O Espelho', '/tiradas/o-espelho', 64,
    array['circulo_do_universo']::text[],
    '{"spread_type":"mirror","cards":12,"experience":"silver_reflection"}'::jsonb
  ),
  (
    'cruz_celta', 'Cruz Celta', 'subscription', 'active', null, 'BRL',
    'Dez cartas para organizar contexto, tensão, raízes, campo e horizonte.',
    'Transformar uma fase complexa num mapa com prioridade e integração.',
    'Decisões de vida e perguntas com múltiplas camadas.',
    'Perguntas simples que uma tirada breve já esclarece.',
    'A leitura de maior amplitude estratégica do portal.', 'retention', 'subscription_included',
    'Abrir a Cruz Celta', '/tiradas/cruz-celta', 65,
    array['circulo_do_universo']::text[],
    '{"spread_type":"celtic_cross","cards":10,"experience":"stone_compass"}'::jsonb
  ),
  (
    'relacionar', 'Relacionar', 'subscription', 'active', null, 'BRL',
    'Quatro cartas para olhar duas presenças e o campo criado entre elas.',
    'Transformar suposição afetiva em presença, conversa e limite.',
    'Um vínculo que pede clareza com responsabilidade relacional.',
    'Previsões ou garantias sobre o comportamento do outro.',
    'Experiência premium breve de consciência relacional.', 'retention', 'subscription_included',
    'Abrir Relacionar', '/tiradas/relacionar', 66,
    array['circulo_do_universo']::text[],
    '{"spread_type":"relating","cards":4,"experience":"two_pulse"}'::jsonb
  ),
  (
    'o_paradoxo', 'O Paradoxo', 'subscription', 'active', null, 'BRL',
    'Cinco cartas para acolher duas verdades e abrir um terceiro olhar.',
    'Transformar escolha binária em compreensão mais ampla.',
    'Ambivalências, encruzilhadas e tensões internas legítimas.',
    'Terceirizar uma decisão pessoal para as cartas.',
    'Experiência premium de integração de contrários.', 'retention', 'subscription_included',
    'Abrir O Paradoxo', '/tiradas/o-paradoxo', 67,
    array['circulo_do_universo']::text[],
    '{"spread_type":"paradox","cards":5,"experience":"split_light"}'::jsonb
  )
on conflict (product_key) do update set
  title = excluded.title,
  product_type = excluded.product_type,
  status = excluded.status,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  short_description = excluded.short_description,
  promise = excluded.promise,
  best_for = excluded.best_for,
  not_for = excluded.not_for,
  value_position = excluded.value_position,
  funnel_stage = excluded.funnel_stage,
  access_model = excluded.access_model,
  cta_label = excluded.cta_label,
  route_path = excluded.route_path,
  sort_order = excluded.sort_order,
  included_in = excluded.included_in,
  metadata = public.oracle_products.metadata || excluded.metadata,
  updated_at = now();

delete from public.oracle_product_features
where product_key in (
  'tirada_diamante',
  'passaro_voando',
  'a_chave',
  'o_espelho',
  'cruz_celta',
  'relacionar',
  'o_paradoxo'
);

insert into public.oracle_product_features (
  product_key,
  label,
  description,
  feature_type,
  sort_order
)
values
  ('tirada_diamante', 'Cinco ângulos conectados', 'Questão, influências, resolução e integração.', 'deliverable', 10),
  ('tirada_diamante', 'Atmosfera prismática', 'Composição e ritmo próprios para esta experiência.', 'premium', 20),
  ('passaro_voando', 'Sete movimentos de voo', 'Medo, resposta, asas, horizonte e integração.', 'deliverable', 10),
  ('passaro_voando', 'Atmosfera de travessia', 'Composição dinâmica sem perder legibilidade.', 'premium', 20),
  ('a_chave', 'Oito camadas interiores', 'Da superfície à compreensão que destranca escolha.', 'deliverable', 10),
  ('a_chave', 'Profundidade responsável', 'Hipóteses simbólicas sem diagnóstico ou fatalismo.', 'premium', 20),
  ('o_espelho', 'Doze posições relacionais', 'Projeção, necessidade, limite, conversa e escolha.', 'deliverable', 10),
  ('o_espelho', 'Leitura sem invadir o outro', 'A interpretação permanece no campo da pessoa que pergunta.', 'premium', 20),
  ('cruz_celta', 'Mapa de dez cartas', 'Uma leitura ampla agrupada por contexto, tensão e direção.', 'deliverable', 10),
  ('cruz_celta', 'Síntese contra o excesso', 'Profundidade organizada para não transformar cartas em ruído.', 'premium', 20),
  ('relacionar', 'Quatro campos conscientes', 'Eu, outro, entre nós e consciência possível.', 'deliverable', 10),
  ('relacionar', 'Clareza relacional breve', 'Uma experiência direta com maturidade e limite.', 'premium', 20),
  ('o_paradoxo', 'Cinco pontos de ambivalência', 'Visível, oposto, tensão, silêncio e novo olhar.', 'deliverable', 10),
  ('o_paradoxo', 'Integração não binária', 'A leitura preserva a contradição até surgir uma terceira via.', 'premium', 20);

insert into public.oracle_product_features (
  product_key,
  label,
  description,
  feature_type,
  sort_order
)
select
  'circulo_do_universo',
  'Sete tiradas especiais',
  'Diamante, Pássaro Voando, A Chave, O Espelho, Cruz Celta, Relacionar e O Paradoxo.',
  'premium',
  45
where not exists (
  select 1
  from public.oracle_product_features
  where product_key = 'circulo_do_universo'
    and label = 'Sete tiradas especiais'
);

-- Existing active members receive the new included experiences immediately.
with active_circle_members as (
  select distinct
    subscription.user_id,
    subscription.current_period_end
  from public.subscriptions as subscription
  where subscription.product_key = 'circulo_do_universo'
    and subscription.status = 'active'
    and (
      subscription.current_period_end is null
      or subscription.current_period_end > now()
    )
),
spread_products(product_key) as (
  values
    ('tirada_diamante'),
    ('passaro_voando'),
    ('a_chave'),
    ('o_espelho'),
    ('cruz_celta'),
    ('relacionar'),
    ('o_paradoxo')
)
insert into public.user_entitlements (
  user_id,
  product_key,
  source,
  status,
  starts_at,
  expires_at,
  metadata
)
select
  member.user_id,
  spread.product_key,
  'subscription',
  'active',
  now(),
  member.current_period_end,
  '{"included_by":"circulo_do_universo","backfilled_by":"20260811120000"}'::jsonb
from active_circle_members as member
cross join spread_products as spread
where not exists (
  select 1
  from public.user_entitlements as entitlement
  where entitlement.user_id = member.user_id
    and entitlement.product_key = spread.product_key
    and entitlement.source = 'subscription'
    and entitlement.status = 'active'
    and (
      entitlement.expires_at is null
      or entitlement.expires_at > now()
    )
);
