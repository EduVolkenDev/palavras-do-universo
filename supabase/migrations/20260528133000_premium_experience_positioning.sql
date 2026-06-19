create table if not exists public.experience_pillars (
  key text primary key,
  title text not null,
  description text not null,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.oracle_products
  add column if not exists experience_archetype text,
  add column if not exists transformation text,
  add column if not exists decision_support text,
  add column if not exists emotional_support text,
  add column if not exists ritual_design text,
  add column if not exists premium_summary text;
insert into public.experience_pillars (key, title, description, sort_order)
values
  (
    'clareza',
    'Clareza',
    'Separar ruído, desejo, medo e possibilidade real antes de agir.',
    10
  ),
  (
    'inteligencia_emocional',
    'Inteligência emocional',
    'Nomear o que está sendo sentido sem transformar emoção em sentença.',
    20
  ),
  (
    'decisao',
    'Firmeza nas decisões',
    'Ajudar a pessoa a escolher um próximo passo que seja bom para ela, sem prometer resultado externo.',
    30
  ),
  (
    'ritual',
    'Ritual significativo',
    'Transformar a leitura em uma ação pequena, íntima e memorável.',
    40
  ),
  (
    'jornada',
    'Jornada pessoal',
    'Guardar histórico, padrões e ciclos para que a experiência ganhe profundidade com o tempo.',
    50
  )
on conflict (key) do update
set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();
update public.oracle_products
set
  experience_archetype = 'ritual_de_entrada',
  transformation = 'De sensação solta para uma palavra de orientação do dia.',
  decision_support = 'Ajuda a escolher uma atitude pequena para atravessar o dia com mais presença.',
  emotional_support = 'Acolhe sem aprofundar demais; serve como respiração simbólica.',
  ritual_design = 'Uma mensagem curta, uma afirmação e uma pergunta de reflexão.',
  premium_summary = 'A porta de entrada: simples, bonita e memorável.',
  metadata = metadata || '{"pillars":["clareza","ritual"],"experience_level":"free_habit"}'::jsonb,
  updated_at = now()
where product_key = 'mensagem_do_dia';
update public.oracle_products
set
  experience_archetype = 'espelho_do_dia',
  transformation = 'De curiosidade para uma imagem simbólica que organiza as próximas horas.',
  decision_support = 'Orienta uma ação de baixo risco para hoje.',
  emotional_support = 'Dá linguagem para uma energia interna sem dramatizar.',
  ritual_design = 'Carta, palavra-chave, conselho, pergunta e ritual curto.',
  premium_summary = 'A primeira experiência mágica: visual, diária e fácil de salvar.',
  metadata = metadata || '{"pillars":["clareza","inteligencia_emocional","ritual"],"experience_level":"free_activation"}'::jsonb,
  updated_at = now()
where product_key = 'carta_do_dia';
update public.oracle_products
set
  experience_archetype = 'decisao_pontual',
  transformation = 'De pergunta confusa para situação, sombra e direção.',
  decision_support = 'Entrega um próximo passo claro, honesto e executável.',
  emotional_support = 'Mostra o que está travando sem culpar a pessoa.',
  ritual_design = 'Três cartas, leitura por posição, resumo direto e micro-ações.',
  premium_summary = 'A experiência paga mais objetiva: clareza prática para uma pergunta real.',
  metadata = metadata || '{"pillars":["clareza","decisao","inteligencia_emocional"],"experience_level":"paid_specific"}'::jsonb,
  updated_at = now()
where product_key = 'caminho_3_cartas';
update public.oracle_products
set
  experience_archetype = 'clareza_afetiva',
  transformation = 'De ansiedade afetiva para leitura madura do vínculo e do próprio desejo.',
  decision_support = 'Ajuda a decidir limite, aproximação, pausa ou conversa sem vender controle sobre o outro.',
  emotional_support = 'Nomeia medo, apego, expectativa e necessidade com delicadeza.',
  ritual_design = 'Leitura afetiva com espelho emocional, pergunta saudável e ação de cuidado.',
  premium_summary = 'A experiência emocional mais forte: amor com responsabilidade, não promessa.',
  metadata = metadata || '{"pillars":["inteligencia_emocional","clareza","decisao"],"experience_level":"paid_emotional"}'::jsonb,
  updated_at = now()
where product_key = 'sinais_do_amor';
update public.oracle_products
set
  experience_archetype = 'ciclo_semanal',
  transformation = 'De semana dispersa para foco emocional e direção de ciclo.',
  decision_support = 'Ajuda a escolher onde colocar energia e onde não gastar força.',
  emotional_support = 'Organiza alertas internos sem transformar a semana em previsão fixa.',
  ritual_design = 'Tema, alerta, direção, carta de apoio e ritual semanal.',
  premium_summary = 'Benefício premium de continuidade: acompanha o ritmo da vida.',
  metadata = metadata || '{"pillars":["ritual","decisao","jornada"],"experience_level":"premium_cycle"}'::jsonb,
  updated_at = now()
where product_key = 'energia_da_semana';
update public.oracle_products
set
  experience_archetype = 'mapa_de_fase',
  transformation = 'De sensação de estar perdido para leitura de fase, padrões e prioridade.',
  decision_support = 'Ajuda a decidir o que sustentar, soltar ou reorganizar.',
  emotional_support = 'Reconhece repetições emocionais e necessidades internas sem reduzir a pessoa a uma carta.',
  ritual_design = 'Retrato da fase, padrões recorrentes, direção principal e ritual de integração.',
  premium_summary = 'A experiência editorial mais profunda: um espelho simbólico do momento de vida.',
  metadata = metadata || '{"pillars":["jornada","clareza","inteligencia_emocional","decisao"],"experience_level":"premium_map"}'::jsonb,
  updated_at = now()
where product_key = 'mapa_do_momento';
update public.oracle_products
set
  experience_archetype = 'santuario_pessoal',
  transformation = 'De leituras soltas para uma jornada contínua de clareza, memória e ritual.',
  decision_support = 'Cria continuidade para decisões internas e externas com histórico, ciclos e padrões.',
  emotional_support = 'Oferece um lugar privado para voltar ao que foi sentido, escolhido e aprendido.',
  ritual_design = 'Leituras, energia da semana, mapa do momento, histórico vivo e diário simbólico.',
  premium_summary = 'A assinatura premium: não vende mais cartas; vende acompanhamento simbólico significativo.',
  metadata = metadata || '{"pillars":["jornada","clareza","inteligencia_emocional","decisao","ritual"],"experience_level":"premium_sanctuary"}'::jsonb,
  updated_at = now()
where product_key = 'circulo_do_universo';
alter table public.experience_pillars enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'experience_pillars' and policyname = 'experience_pillars_select_public') then
    create policy experience_pillars_select_public on public.experience_pillars
      for select
      using (true);
  end if;

  drop trigger if exists experience_pillars_set_updated_at on public.experience_pillars;
  create trigger experience_pillars_set_updated_at
    before update on public.experience_pillars
    for each row execute function public.set_updated_at();
end;
$$;
