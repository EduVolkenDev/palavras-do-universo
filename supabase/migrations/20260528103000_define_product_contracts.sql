alter table public.oracle_products
  add column if not exists short_description text,
  add column if not exists promise text,
  add column if not exists best_for text,
  add column if not exists not_for text,
  add column if not exists value_position text,
  add column if not exists funnel_stage text,
  add column if not exists access_model text,
  add column if not exists cta_label text,
  add column if not exists route_path text,
  add column if not exists sort_order int not null default 100,
  add column if not exists included_in text[] not null default '{}';
create table if not exists public.oracle_product_features (
  id uuid primary key default gen_random_uuid(),
  product_key text not null references public.oracle_products(product_key) on delete cascade,
  label text not null,
  description text,
  feature_type text not null default 'deliverable',
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);
create table if not exists public.oracle_product_comparisons (
  id uuid primary key default gen_random_uuid(),
  product_key text not null references public.oracle_products(product_key) on delete cascade,
  compared_to_key text references public.oracle_products(product_key) on delete cascade,
  better_when text not null,
  worse_when text not null,
  created_at timestamptz not null default now(),
  unique (product_key, compared_to_key)
);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'oracle_products_funnel_stage_check') then
    alter table public.oracle_products add constraint oracle_products_funnel_stage_check
      check (funnel_stage is null or funnel_stage in ('habit', 'activation', 'conversion', 'retention'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oracle_products_access_model_check') then
    alter table public.oracle_products add constraint oracle_products_access_model_check
      check (access_model is null or access_model in ('free', 'one_time', 'subscription_included', 'subscription'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oracle_product_features_feature_type_check') then
    alter table public.oracle_product_features add constraint oracle_product_features_feature_type_check
      check (feature_type in ('deliverable', 'limit', 'experience', 'premium'));
  end if;
end;
$$;
with product_contracts as (
  select *
  from (values
    (
      'mensagem_do_dia',
      'Mensagem curta diária para abrir o dia com presença.',
      'Criar hábito, acolhimento e vontade de voltar amanhã.',
      'Quem quer uma pausa leve, bonita e sem compromisso.',
      'Quem precisa de uma leitura profunda ou resposta para uma pergunta específica.',
      'Entrada gratuita: baixa fricção, alto encantamento.',
      'habit',
      'free',
      'Receber agora',
      '/',
      10,
      array[]::text[],
      '{"cadence":"daily","depth":"light","question_required":false,"primary_job":"habit"}'::jsonb
    ),
    (
      'carta_do_dia',
      'Uma carta para iluminar as próximas 24 horas.',
      'Dar à pessoa a sensação de sorteio, símbolo e direção rápida.',
      'Reflexão rápida com imagem, arquétipo e foco no dia.',
      'Perguntas complexas, decisões grandes ou acompanhamento contínuo.',
      'Ativação gratuita: mais mágica que a mensagem, ainda simples.',
      'activation',
      'free',
      'Tirar minha carta',
      '/carta-do-dia',
      20,
      array[]::text[],
      '{"cadence":"daily","depth":"light_medium","cards":1,"primary_job":"activation"}'::jsonb
    ),
    (
      'caminho_3_cartas',
      'Leitura avulsa com situação, sombra e direção para uma pergunta real.',
      'Resolver uma pergunta específica com clareza prática.',
      'Uma dúvida concreta sobre amor, trabalho, dinheiro, família ou fase pessoal.',
      'Quem quer acompanhamento, histórico profundo ou rituais recorrentes.',
      'Primeiro produto pago: claro, útil e fácil de entender.',
      'conversion',
      'one_time',
      'Fazer leitura',
      '/',
      30,
      array['circulo_do_universo']::text[],
      '{"spread":"situation_shadow_direction","cards":3,"depth":"deep","primary_job":"specific_question"}'::jsonb
    ),
    (
      'sinais_do_amor',
      'Leitura avulsa focada em vínculos, sentimentos e padrões afetivos.',
      'Ajudar a pessoa a entender o que sente sem vender garantia emocional.',
      'Dúvidas afetivas, vínculo confuso, repetição emocional ou necessidade de limite.',
      'Previsão sobre outra pessoa, promessa de volta, controle ou decisão fora do campo afetivo.',
      'Produto pago emocionalmente forte: mais específico que 3 cartas, mais delicado.',
      'conversion',
      'one_time',
      'Consultar amor',
      '/',
      40,
      array['circulo_do_universo']::text[],
      '{"theme":"love","cards":3,"depth":"deep","primary_job":"emotional_clarity"}'::jsonb
    ),
    (
      'energia_da_semana',
      'Guia semanal com tema, alerta, direção e ritual.',
      'Transformar leitura em ciclo e preparar a semana com intenção.',
      'Quem quer acompanhar padrões e atravessar a semana com presença.',
      'Pergunta urgente ou decisão pontual que pede uma leitura avulsa.',
      'Benefício premium: fraco como avulso, forte dentro da assinatura.',
      'retention',
      'subscription_included',
      'Ver no Círculo',
      '#circulo',
      50,
      array['circulo_do_universo']::text[],
      '{"cadence":"weekly","depth":"medium","primary_job":"cycle_guidance"}'::jsonb
    ),
    (
      'mapa_do_momento',
      'Retrato simbólico da fase atual da pessoa.',
      'Dar contexto: onde estou, o que se repete e que direção pede cuidado.',
      'Quem quer entender a fase da vida e reconhecer padrões pessoais.',
      'Resposta objetiva imediata ou pergunta muito pequena.',
      'Benefício premium/editorial: mais diagnóstico do que conselho.',
      'retention',
      'subscription_included',
      'Abrir no Círculo',
      '#circulo',
      60,
      array['circulo_do_universo']::text[],
      '{"cadence":"monthly","depth":"deep","primary_job":"personal_pattern_map"}'::jsonb
    ),
    (
      'circulo_do_universo',
      'Assinatura para transformar orientação simbólica em jornada pessoal.',
      'Histórico, rituais, ciclos, favoritos e acesso contínuo às leituras principais.',
      'Quem quer acompanhamento, memória e um espaço pessoal de clareza.',
      'Quem só quer testar uma vez ou fazer uma pergunta isolada.',
      'Oferta principal de continuidade: não é mais leitura, é jornada.',
      'retention',
      'subscription',
      'Entrar no Círculo',
      '#circulo',
      70,
      array[]::text[],
      '{"cadence":"ongoing","depth":"complete","tier":"premium","includes":["caminho_3_cartas","sinais_do_amor","energia_da_semana","mapa_do_momento","ritual_entries","history"]}'::jsonb
    )
  ) as t(
    product_key,
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
    metadata_patch
  )
)
update public.oracle_products p
set
  short_description = c.short_description,
  promise = c.promise,
  best_for = c.best_for,
  not_for = c.not_for,
  value_position = c.value_position,
  funnel_stage = c.funnel_stage,
  access_model = c.access_model,
  cta_label = c.cta_label,
  route_path = c.route_path,
  sort_order = c.sort_order,
  included_in = c.included_in,
  metadata = p.metadata || c.metadata_patch,
  status = case
    when c.product_key in ('energia_da_semana', 'mapa_do_momento') then 'active'
    else p.status
  end,
  updated_at = now()
from product_contracts c
where p.product_key = c.product_key;
update public.oracle_products
set
  price_cents = case product_key
    when 'caminho_3_cartas' then 990
    when 'sinais_do_amor' then 1290
    when 'circulo_do_universo' then 2990
    else price_cents
  end,
  updated_at = now()
where product_key in ('caminho_3_cartas', 'sinais_do_amor', 'circulo_do_universo');
delete from public.oracle_product_features
where product_key in (
  'mensagem_do_dia',
  'carta_do_dia',
  'caminho_3_cartas',
  'sinais_do_amor',
  'energia_da_semana',
  'mapa_do_momento',
  'circulo_do_universo'
);
insert into public.oracle_product_features (product_key, label, description, feature_type, sort_order)
values
  ('mensagem_do_dia', 'Mensagem diária', 'Texto curto para abrir o dia com clareza.', 'deliverable', 10),
  ('mensagem_do_dia', 'Ritual leve', 'Sem pergunta obrigatória e sem leitura profunda.', 'experience', 20),
  ('mensagem_do_dia', 'Sem fatalismo', 'Acolhimento simbólico, não previsão.', 'limit', 30),

  ('carta_do_dia', 'Uma carta real', 'Sorteio de uma carta para as próximas 24 horas.', 'deliverable', 10),
  ('carta_do_dia', 'Conselho prático', 'Mensagem curta com direção e reflexão.', 'deliverable', 20),
  ('carta_do_dia', 'Limite diário', 'Experiência gratuita pensada para hábito.', 'limit', 30),

  ('caminho_3_cartas', 'Situação', 'O que está mais presente agora.', 'deliverable', 10),
  ('caminho_3_cartas', 'Sombra', 'O ponto que atrapalha ou pede atenção.', 'deliverable', 20),
  ('caminho_3_cartas', 'Direção', 'Um próximo passo claro e executável.', 'deliverable', 30),
  ('caminho_3_cartas', 'Ações práticas', 'Micro-passos para levar a leitura para a vida.', 'premium', 40),

  ('sinais_do_amor', 'Leitura afetiva', 'Foco em sentimentos, vínculo, limite e padrão emocional.', 'deliverable', 10),
  ('sinais_do_amor', 'Sem promessa de volta', 'Não vende garantia sobre outra pessoa.', 'limit', 20),
  ('sinais_do_amor', 'Pergunta recomendada', 'Ajuda a reformular a dúvida de modo mais saudável.', 'deliverable', 30),

  ('energia_da_semana', 'Tema da semana', 'Síntese simbólica para atravessar os próximos dias.', 'deliverable', 10),
  ('energia_da_semana', 'Alerta e direção', 'O que cuidar e onde colocar energia.', 'deliverable', 20),
  ('energia_da_semana', 'Ritual semanal', 'Pequena prática para sustentar presença.', 'premium', 30),
  ('energia_da_semana', 'Incluído no Círculo', 'Benefício premium, não produto avulso principal.', 'limit', 40),

  ('mapa_do_momento', 'Retrato da fase', 'Leitura editorial sobre o ciclo atual da pessoa.', 'deliverable', 10),
  ('mapa_do_momento', 'Padrões recorrentes', 'Conecta histórico, temas e sinais repetidos.', 'premium', 20),
  ('mapa_do_momento', 'Direção de ciclo', 'Ajuda a escolher foco para o próximo período.', 'deliverable', 30),
  ('mapa_do_momento', 'Incluído no Círculo', 'Benefício premium para dar profundidade à assinatura.', 'limit', 40),

  ('circulo_do_universo', 'Leituras recorrentes', 'Acesso contínuo às leituras principais.', 'deliverable', 10),
  ('circulo_do_universo', 'Histórico vivo', 'Mensagens salvas, leituras anteriores e padrões.', 'premium', 20),
  ('circulo_do_universo', 'Energia da Semana', 'Guia semanal incluído.', 'premium', 30),
  ('circulo_do_universo', 'Mapa do Momento', 'Retrato simbólico de fase incluído.', 'premium', 40),
  ('circulo_do_universo', 'Diário simbólico', 'Rituais e entradas pessoais em Meu Universo.', 'premium', 50);
delete from public.oracle_product_comparisons
where product_key in (
  'mensagem_do_dia',
  'carta_do_dia',
  'caminho_3_cartas',
  'sinais_do_amor',
  'energia_da_semana',
  'mapa_do_momento',
  'circulo_do_universo'
);
insert into public.oracle_product_comparisons (product_key, compared_to_key, better_when, worse_when)
values
  ('mensagem_do_dia', 'carta_do_dia', 'A pessoa quer só abrir o dia sem tirar carta.', 'A pessoa quer imagem, símbolo e sensação de sorteio.'),
  ('carta_do_dia', 'caminho_3_cartas', 'A pessoa quer uma orientação leve para hoje.', 'A pessoa tem uma pergunta específica e precisa de profundidade.'),
  ('caminho_3_cartas', 'circulo_do_universo', 'A pessoa quer resolver uma pergunta isolada agora.', 'A pessoa quer acompanhamento, histórico e ciclos.'),
  ('sinais_do_amor', 'caminho_3_cartas', 'A dúvida é afetiva e pede linguagem emocional cuidadosa.', 'A pergunta não é sobre vínculo, sentimento ou escolha amorosa.'),
  ('energia_da_semana', 'caminho_3_cartas', 'A pessoa quer organizar a semana e acompanhar um ciclo.', 'A pessoa precisa resolver uma pergunta urgente.'),
  ('mapa_do_momento', 'energia_da_semana', 'A pessoa quer entender a fase mais ampla da vida.', 'A pessoa quer um guia curto para os próximos dias.'),
  ('circulo_do_universo', 'caminho_3_cartas', 'A pessoa quer voltar, salvar, comparar padrões e criar ritual.', 'A pessoa quer só uma leitura avulsa e sem compromisso.');
create index if not exists oracle_products_sort_idx
  on public.oracle_products (sort_order, product_key);
create index if not exists oracle_product_features_product_sort_idx
  on public.oracle_product_features (product_key, sort_order);
create index if not exists oracle_product_comparisons_product_idx
  on public.oracle_product_comparisons (product_key);
alter table public.oracle_product_features enable row level security;
alter table public.oracle_product_comparisons enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'oracle_product_features' and policyname = 'oracle_product_features_select_public') then
    create policy oracle_product_features_select_public on public.oracle_product_features
      for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'oracle_product_comparisons' and policyname = 'oracle_product_comparisons_select_public') then
    create policy oracle_product_comparisons_select_public on public.oracle_product_comparisons
      for select
      using (true);
  end if;
end;
$$;
