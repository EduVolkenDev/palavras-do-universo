insert into public.oracle_products (
  product_key,
  title,
  product_type,
  status,
  price_cents,
  currency,
  metadata,
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
  experience_archetype,
  transformation,
  decision_support,
  emotional_support,
  ritual_design,
  premium_summary
)
values (
  'clareza_urgente',
  'Clareza Urgente',
  'one_time',
  'active',
  1990,
  'BRL',
  '{
    "cards":3,
    "depth":"deep",
    "urgency":"same_moment",
    "primary_job":"urgent_decision_support",
    "pillars":["clareza","decisao","inteligencia_emocional","ritual"],
    "experience_level":"paid_urgent"
  }'::jsonb,
  'Leitura premium para quando a pessoa precisa respirar, organizar o que sente e escolher o próximo passo hoje.',
  'Transformar urgência emocional em clareza, eixo e uma ação segura.',
  'Momentos de ansiedade, dúvida forte, conversa difícil, decisão imediata ou sensação de estar sem chão.',
  'Situações de risco físico, emergência médica, promessa de resultado externo ou substituição de ajuda profissional.',
  'Oferta de conversão imediata: mais intensa e prática que 3 cartas, sem virar assinatura.',
  'conversion',
  'one_time',
  'Quero clareza agora',
  '/',
  25,
  array[]::text[],
  'clareza_urgente',
  'De urgência emocional para eixo, limite e próximo passo possível.',
  'Ajuda a separar impulso, medo, necessidade real e ação segura para as próximas horas.',
  'Acolhe a pessoa sem dramatizar, devolvendo presença e senso de escolha.',
  'Escuta inicial, três cartas, síntese direta, plano de 24 horas e ritual de aterramento.',
  'Produto de caixa rápido: uma experiência premium de orientação imediata e significativa.'
)
on conflict (product_key) do update
set
  title = excluded.title,
  product_type = excluded.product_type,
  status = excluded.status,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  metadata = public.oracle_products.metadata || excluded.metadata,
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
  experience_archetype = excluded.experience_archetype,
  transformation = excluded.transformation,
  decision_support = excluded.decision_support,
  emotional_support = excluded.emotional_support,
  ritual_design = excluded.ritual_design,
  premium_summary = excluded.premium_summary,
  updated_at = now();
delete from public.oracle_product_features
where product_key = 'clareza_urgente';
insert into public.oracle_product_features (product_key, label, description, feature_type, sort_order)
values
  ('clareza_urgente', 'Escuta inicial humanizada', 'A leitura começa entendendo a tensão por trás da pergunta.', 'experience', 10),
  ('clareza_urgente', '3 cartas com foco em ação', 'Situação, sombra e direção para organizar o próximo passo.', 'deliverable', 20),
  ('clareza_urgente', 'Plano de 24 horas', 'Micro-ações para sair do estado de confusão sem agir no impulso.', 'deliverable', 30),
  ('clareza_urgente', 'Ritual de aterramento', 'Uma prática simples para recuperar eixo e presença.', 'premium', 40);
delete from public.oracle_product_comparisons
where product_key = 'clareza_urgente';
insert into public.oracle_product_comparisons (product_key, compared_to_key, better_when, worse_when)
values
  (
    'clareza_urgente',
    'caminho_3_cartas',
    'Melhor quando a pessoa está emocionalmente tomada e precisa de eixo agora, não só de interpretação.',
    'Pior quando a pergunta é comum, calma e cabe em uma leitura avulsa mais barata.'
  ),
  (
    'clareza_urgente',
    'circulo_do_universo',
    'Melhor para compra imediata e decisão pontual sem compromisso mensal.',
    'Pior para acompanhamento recorrente, histórico profundo e construção de jornada.'
  );
