import type { Lang } from "@/lib/numeros/copy";

export type CategoryId =
  | "abundancia"
  | "amor"
  | "vitalidade"
  | "protecao"
  | "clareza"
  | "trabalho"
  | "desenvolvimento"
  | "equilibrio"
  | "espiritualidade";

export type Phrase = Record<Lang, string>;

export type CodeEntry = {
  slug: string;
  digits: string;
  title: Phrase;
  category: CategoryId;
  line: Phrase;
  note: Phrase;
};

function p(pt: string, en: string): Phrase {
  return { pt, en };
}

export const categories: { id: CategoryId; label: Phrase; hint: Phrase }[] = [
  {
    id: "abundancia",
    label: p("Abundância", "Abundance"),
    hint: p("Dinheiro, trabalho e o que circula", "Money, work, and what circulates"),
  },
  {
    id: "amor",
    label: p("Amor", "Love"),
    hint: p("Vínculo, romance e amor-próprio", "Bond, romance, and self-love"),
  },
  {
    id: "vitalidade",
    label: p("Vitalidade", "Vitality"),
    hint: p("Corpo, pausa e sensação de renovação", "Body, pause, and a sense of renewal"),
  },
  {
    id: "protecao",
    label: p("Proteção", "Protection"),
    hint: p("Quando o dia pede um contorno", "When the day asks for a contour"),
  },
  {
    id: "trabalho",
    label: p("Trabalho e carreira", "Work & career"),
    hint: p("Projetos, estudos profissionais e oportunidades", "Projects, career growth, and opportunities"),
  },
  {
    id: "desenvolvimento",
    label: p("Desenvolvimento pessoal", "Personal growth"),
    hint: p("Aprendizagem, confiança e realização", "Learning, confidence, and achievement"),
  },
  {
    id: "equilibrio",
    label: p("Equilíbrio emocional", "Emotional balance"),
    hint: p("Serenidade, emoções e presença", "Serenity, emotions, and presence"),
  },
  {
    id: "espiritualidade",
    label: p("Espiritualidade", "Spirituality"),
    hint: p("Consciência, intuição e conexão interior", "Consciousness, intuition, and inner connection"),
  },
  {
    id: "clareza",
    label: p("Clareza", "Clarity"),
    hint: p("Paz, abertura, alegria, sorte", "Peace, openness, joy, luck"),
  },
];

export const codes: CodeEntry[] = [
  {
    slug: "dinheiro-inesperado",
    digits: "520 741 8",
    title: p("Dinheiro inesperado", "Unexpected money"),
    category: "abundancia",
    line: p(
      "Para olhar o que pode chegar fora do plano já escrito.",
      "For looking at what may arrive outside the plan already written.",
    ),
    note: p(
      "É a sequência mais repetida nas listas quando o assunto é dinheiro inesperado ou uma solução rápida. Serve de lembrete de atenção, não de um valor combinado.",
      "This is the sequence most often repeated when the subject is unexpected money or a quick solution. It is a reminder to pay attention, not an agreed amount.",
    ),
  },
  {
    slug: "abundancia",
    digits: "318 798",
    title: p("Abundância", "Abundance"),
    category: "abundancia",
    line: p(
      "Uma intenção larga: o bastante, circulando, sem pressa de um número exato.",
      "A wide intention: enough, circulating, with no rush toward an exact figure.",
    ),
    note: p(
      "Nas tabelas populares, 318 798 acompanha abundância financeira. Aqui entra como foco no que já pode ser reconhecido e no que ainda pode circular.",
      "In popular tables, 318 798 accompanies financial abundance. Here it is a focus on what can already be recognized, and on what may still circulate.",
    ),
  },
  {
    slug: "prosperidade",
    digits: "714 273 218 93",
    title: p("Prosperidade", "Prosperity"),
    category: "abundancia",
    line: p(
      "Para quem quer nomear prosperidade sem transformar isso numa cobrança.",
      "For naming prosperity without turning it into a demand.",
    ),
    note: p(
      "Aparece associada a prosperidade e a ganhos que não estavam no roteiro. A prática pede uma frase sua antes do número.",
      "It appears linked to prosperity and to gains that were not in the script. The practice asks for a sentence of yours before the number.",
    ),
  },
  {
    slug: "vendas-em-movimento",
    digits: "541 213 819 48",
    title: p("Trabalho em movimento", "Work in motion"),
    category: "trabalho",
    line: p(
      "Quando a intenção é destravar troca, oferta ou venda.",
      "When the intention is to loosen an exchange, an offer, or a sale.",
    ),
    note: p(
      "Listas de praticantes ligam esta sequência ao aumento de vendas. Use junto de um passo concreto: uma mensagem, um preço, uma entrega.",
      "Practitioners’ lists link this sequence to increasing sales. Use it with a concrete step: a message, a price, a delivery.",
    ),
  },
  {
    slug: "compensacao-justa",
    digits: "414 818 88",
    title: p("Compensação justa", "Fair compensation"),
    category: "trabalho",
    line: p(
      "Para reconhecer o próprio tempo e o que ele vale.",
      "For recognizing your own time, and what it is worth.",
    ),
    note: p(
      "Circula como código de compensação justa pelo tempo. Não substitui conversa, contrato ou conta. Segura a frase enquanto você olha o que precisa ser dito.",
      "It circulates as a code for fair pay for time. It does not replace a conversation, a contract, or the books. It holds the sentence while you look at what needs to be said.",
    ),
  },
  {
    slug: "reconhecimento",
    digits: "914 481",
    title: p("Reconhecimento", "Recognition"),
    category: "trabalho",
    line: p(
      "Um foco curto para o trabalho que quer ser visto.",
      "A short focus for work that wants to be seen.",
    ),
    note: p(
      "Associado, nas listas, a sucesso e reconhecimento. Cabe antes de uma conversa, uma entrega ou um pedido que você já sabe que precisa fazer.",
      "In the lists it is tied to success and recognition. It fits before a conversation, a delivery, or a request you already know you need to make.",
    ),
  },
  {
    slug: "amor",
    digits: "888 412 1289018",
    title: p("Amor", "Love"),
    category: "amor",
    line: p(
      "A sequência mais conhecida para quem quer olhar o amor sem escolher o destino de outra pessoa.",
      "The best-known sequence for looking at love without choosing another person’s fate.",
    ),
    note: p(
      "888 412 1289018 é o código de amor mais repetido. Aqui não serve para convencer alguém. Serve para clarear que tipo de encontro, cuidado ou presença você está pedindo.",
      "888 412 1289018 is the most repeated love code. Here it is not for convincing someone. It is for clarifying what kind of meeting, care, or presence you are asking for.",
    ),
  },
  {
    slug: "amor-proprio",
    digits: "396815",
    title: p("Amor-próprio", "Self-love"),
    category: "amor",
    line: p(
      "Um número pequeno para uma intenção que costuma ficar por último.",
      "A small number for an intention that usually comes last.",
    ),
    note: p(
      "Nas listas, 396815 acompanha amor-próprio. A prática fica melhor se a frase for específica: um limite, um descanso, um gesto seu.",
      "In the lists, 396815 accompanies self-love. The practice works better if the sentence is specific: a boundary, a rest, a gesture of your own.",
    ),
  },
  {
    slug: "vinculo",
    digits: "888 912 818848",
    title: p("Vínculo duradouro", "A lasting bond"),
    category: "amor",
    line: p(
      "Para quem já está num laço e quer olhá-lo com mais cuidado.",
      "For someone already in a bond who wants to look at it with more care.",
    ),
    note: p(
      "Aparece como amor duradouro. O número não segura ninguém. Pode acompanhar uma conversa honesta ou um gesto que você escolhe fazer.",
      "It appears as lasting love. The number holds no one. It can sit beside an honest conversation, or a gesture you choose to make.",
    ),
  },
  {
    slug: "romance",
    digits: "973594066",
    title: p("Romance", "Romance"),
    category: "amor",
    line: p(
      "Leveza, encontro, um pouco de jogo — sem roteiro fechado.",
      "Lightness, a meeting, a little play — without a closed script.",
    ),
    note: p(
      "Usado em tabelas de romance. Combine com uma intenção que deixe o outro livre. O foco é o seu modo de chegar, não o sim de alguém.",
      "Used in romance tables. Pair it with an intention that leaves the other person free. The focus is how you arrive, not someone else’s yes.",
    ),
  },
  {
    slug: "cuidado-com-a-saude",
    digits: "80845700",
    title: p("Cuidado com a saúde", "Care for health"),
    category: "vitalidade",
    line: p(
      "Uma sintonia vibracional para o dia em que o corpo pede atenção.",
      "A vibrational tuning for the day the body asks for attention.",
    ),
    note: p(
      "É o código mais citado para saúde no dia a dia. Não diagnostica e não trata. Pode sentar ao lado de um cuidado real: água, consulta, remédio, descanso.",
      "It is the code most often cited for everyday health. It does not diagnose and it does not treat. It can sit beside real care: water, an appointment, medicine, rest.",
    ),
  },
  {
    slug: "vitalidade",
    digits: "1814321",
    title: p("Vitalidade", "Vitality"),
    category: "vitalidade",
    line: p(
      "Equilíbrio do corpo, no tom de quem acompanha, não de quem promete.",
      "Balance of the body, in the tone of someone accompanying, not someone promising.",
    ),
    note: p(
      "Praticantes associam 1814321 à saúde de um modo geral. Trate como símbolo de presença com o corpo, nunca como substituto de acompanhamento.",
      "Practitioners associate 1814321 with health in a general way. Treat it as a symbol of presence with the body, never as a substitute for care.",
    ),
  },
  {
    slug: "recuperacao",
    digits: "9187948181",
    title: p("Acompanhar uma recuperação", "Accompanying a recovery"),
    category: "vitalidade",
    line: p(
      "Para quem já está num processo e quer um ponto de foco calmo.",
      "For someone already in a process who wants a calm point of focus.",
    ),
    note: p(
      "Nas listas, esta sequência aparece ligada à recuperação do corpo. O lugar dela é ao lado do cuidado profissional, não no lugar dele.",
      "In the lists, this sequence appears linked to recovery of the body. Its place is beside professional care, not instead of it.",
    ),
  },
  {
    slug: "renovacao",
    digits: "2145432",
    title: p("Renovação", "Renewal"),
    category: "vitalidade",
    line: p(
      "Uma intenção de recomeço pequeno, não de milagre.",
      "An intention of a small beginning again, not of a miracle.",
    ),
    note: p(
      "Circula como código de rejuvenescimento ou renovação. Aqui a frase cabe melhor assim: o que, hoje, pode ficar um pouco mais leve.",
      "It circulates as a code of rejuvenation or renewal. Here the sentence fits better like this: what, today, could feel a little lighter.",
    ),
  },
  {
    slug: "protecao",
    digits: "9187756981818",
    title: p("Proteção", "Protection"),
    category: "protecao",
    line: p(
      "Um contorno de proteção vibracional para quando o mundo está alto demais.",
      "A vibrational protection contour for when the world is too loud.",
    ),
    note: p(
      "9187756981818 é a sequência de proteção mais repetida. Use para nomear o que você quer preservar — tempo, casa, calma — e o limite que isso pede.",
      "9187756981818 is the most repeated protection sequence. Use it to name what you want to preserve — time, home, calm — and the limit that asks for.",
    ),
  },
  {
    slug: "silencio",
    digits: "47 481 321 48",
    title: p("Menos ruído", "Less noise"),
    category: "equilibrio",
    line: p(
      "Para dias barulhentos, por fora ou por dentro.",
      "For noisy days, outside or inside.",
    ),
    note: p(
      "Algumas listas chamam esta sequência de cancelamento do negativo. Preferimos um nome mais honesto: menos ruído. Não apaga fato nenhum. Ajuda a escolher o que não alimentar agora.",
      "Some lists call this sequence a cancellation of the negative. We prefer a more honest name: less noise. It erases no fact. It helps you choose what not to feed right now.",
    ),
  },
  {
    slug: "paz",
    digits: "1001105010",
    title: p("Paz", "Peace"),
    category: "equilibrio",
    line: p(
      "Tranquilidade como intenção, não como obrigação de estar bem.",
      "Quiet as an intention, not as an obligation to be fine.",
    ),
    note: p(
      "Associado a paz e tranquilidade. Combina com a prática antes de dormir ou no intervalo curto do meio do dia.",
      "Associated with peace and quiet. It fits the practice before sleep, or in a short pause in the middle of the day.",
    ),
  },
  {
    slug: "abertura",
    digits: "519 7148",
    title: p("Abertura", "Openness"),
    category: "clareza",
    line: p(
      "A frase popular desta sequência é simples: tudo é possível. Aqui ela fica menor: algo ainda pode se mover.",
      "The popular sentence for this sequence is simple: everything is possible. Here it stays smaller: something can still move.",
    ),
    note: p(
      "519 7148 aparece quando as listas falam de possibilidade. Serve melhor depois de uma pergunta concreta do que como frase solta.",
      "519 7148 appears when the lists speak of possibility. It serves better after a concrete question than as a loose sentence.",
    ),
  },
  {
    slug: "alegria",
    digits: "5148123",
    title: p("Alegria", "Joy"),
    category: "equilibrio",
    line: p(
      "Um foco leve, para quem quer notar o que ainda tem gosto.",
      "A light focus, for anyone who wants to notice what still has taste.",
    ),
    note: p(
      "Nas tabelas, 5148123 acompanha felicidade e alegria. A prática pode ser só isto: três minutos e uma coisa pequena que você não quer atravessar no automático.",
      "In the tables, 5148123 accompanies happiness and joy. The practice can be only this: three minutes, and one small thing you don’t want to pass through on automatic.",
    ),
  },
  {
    slug: "sorte",
    digits: "2017133",
    title: p("Sorte", "Luck"),
    category: "clareza",
    line: p(
      "Boa sorte como atenção ao acaso, não como bilhete premiado.",
      "Good luck as attention to chance, not as a winning ticket.",
    ),
    note: p(
      "2017133 circula como código de boa sorte. O convite é perceber uma abertura e dar um passo, não esperar que o número escolha por você.",
      "2017133 circulates as a code of good luck. The invitation is to notice an opening and take a step, not to wait for the number to choose for you.",
    ),
  },
  {
    slug: "fluxo-financeiro",
    digits: "318 612 518 714",
    title: p("Fluxo financeiro", "Financial flow"),
    category: "abundancia",
    line: p("Para olhar receitas e despesas com mais continuidade.", "To consider income and expenses with greater continuity."),
    note: p("Associada ao movimento dos recursos, à circulação financeira e à prosperidade.", "Associated with the movement of resources, financial flow, and prosperity."),
  },
  {
    slug: "renda-estavel",
    digits: "9213140",
    title: p("Renda estável", "Steady income"),
    category: "abundancia",
    line: p("Uma intenção ligada à constância e ao planejamento.", "An intention linked to consistency and planning."),
    note: p("Associada à estabilidade financeira, à constância e à segurança material.", "Associated with financial stability, consistency, and material security."),
  },
  {
    slug: "caminho-profissional",
    digits: "890 1048",
    title: p("Caminho profissional", "Career path"),
    category: "trabalho",
    line: p("Para pensar no próximo movimento do trabalho.", "For considering the next move in your working life."),
    note: p("Associada à evolução profissional, a novos caminhos e ao reconhecimento.", "Associated with career growth, new paths, and recognition."),
  },
  {
    slug: "oportunidades",
    digits: "426499",
    title: p("Oportunidades", "Opportunities"),
    category: "abundancia",
    line: p("Um lembrete para perceber caminhos e escolhas disponíveis.", "A reminder to notice available paths and choices."),
    note: p("Associada à abertura de oportunidades e a novas possibilidades financeiras.", "Associated with opportunities and new financial possibilities."),
  },
  {
    slug: "encontro-afetivo",
    digits: "571",
    title: p("Encontro afetivo", "A meaningful connection"),
    category: "amor",
    line: p("Uma intenção de abertura ao encontro, com respeito.", "An intention of openness to connection, with respect."),
    note: p("Associada ao encontro amoroso e à abertura para novas conexões afetivas.", "Associated with romantic encounters and new emotional connections."),
  },
  {
    slug: "perdao",
    digits: "706",
    title: p("Perdão", "Forgiveness"),
    category: "amor",
    line: p("Para pensar no que pode ser acolhido ou deixado para trás.", "For reflecting on what can be acknowledged or released."),
    note: p("Associada ao perdão, à reconciliação interior e à leveza emocional.", "Associated with forgiveness, inner reconciliation, and emotional lightness."),
  },
  {
    slug: "autoconfianca",
    digits: "517 489719 841",
    title: p("Autoconfiança", "Self-confidence"),
    category: "desenvolvimento",
    line: p("Para recordar capacidades sem deixar de reconhecer dúvidas.", "For remembering your abilities while still acknowledging doubts."),
    note: p("Associada à segurança interior, à coragem e à confiança nas próprias capacidades.", "Associated with inner confidence, courage, and trust in one's abilities."),
  },
  {
    slug: "foco-nos-estudos",
    digits: "212585212",
    title: p("Foco nos estudos", "Study focus"),
    category: "desenvolvimento",
    line: p("Uma pausa antes de começar uma tarefa que pede atenção.", "A pause before starting a task that requires attention."),
    note: p("Associada à dedicação, à concentração e ao desenvolvimento nos estudos.", "Associated with dedication, focus, and learning progress."),
  },
  {
    slug: "memoria-aprendizagem",
    digits: "5893240",
    title: p("Memória e aprendizagem", "Memory and learning"),
    category: "desenvolvimento",
    line: p("Para organizar o que você quer compreender e lembrar.", "For organizing what you want to understand and remember."),
    note: p("Associada à memória, à assimilação de conhecimentos e à aprendizagem.", "Associated with memory, absorbing knowledge, and learning."),
  },
  {
    slug: "permanecer-centrado",
    digits: "71381921",
    title: p("Permanecer centrado", "Staying centered"),
    category: "equilibrio",
    line: p("Para recuperar a atenção quando tudo parece pedir resposta.", "For returning to your attention when everything demands a response."),
    note: p("Associada ao equilíbrio interior, à presença e à serenidade.", "Associated with inner balance, presence, and serenity."),
  },
  {
    slug: "reorientar-pensamentos",
    digits: "1888948",
    title: p("Reorientar pensamentos", "Reframing thoughts"),
    category: "equilibrio",
    line: p("Para observar uma ideia difícil por outro ângulo.", "For looking at a difficult thought from another angle."),
    note: p("Associada à transformação de padrões de pensamento e à renovação da perspectiva.", "Associated with reframing thought patterns and renewing perspective."),
  },
  {
    slug: "harmonia",
    digits: "213",
    title: p("Harmonia", "Harmony"),
    category: "espiritualidade",
    line: p("Um símbolo breve para criar espaço entre estímulo e reação.", "A brief symbol for making room between stimulus and reaction."),
    note: p("Associada à harmonia, ao alinhamento interior e ao equilíbrio.", "Associated with harmony, inner alignment, and balance."),
  },
  {
    slug: "solucao-pratica",
    digits: "741",
    title: p("Próximo passo", "Next step"),
    category: "clareza",
    line: p("Para parar, definir o problema e escolher uma ação possível.", "For pausing, defining a problem and choosing an actionable step."),
    note: p("Associada à resolução de desafios e à clareza diante das decisões.", "Associated with overcoming challenges and clarity in decision-making."),
  },
  {
    slug: "boa-sorte",
    digits: "817219738",
    title: p("Boa sorte", "Good fortune"),
    category: "clareza",
    line: p("Para perceber oportunidades sem depender do acaso.", "For noticing opportunities without relying on chance."),
    note: p("Associada à boa sorte, a circunstâncias favoráveis e a novas oportunidades.", "Associated with good fortune, favorable circumstances, and opportunities."),
  },
  {
    slug: "realizacao-de-metas",
    digits: "724891",
    title: p("Realização de metas", "Working toward goals"),
    category: "desenvolvimento",
    line: p("Uma intenção a serviço de um objetivo bem definido.", "An intention in service of a clearly defined goal."),
    note: p("Associada à realização de objetivos, à determinação e à conquista de metas.", "Associated with achieving goals, determination, and accomplishment."),
  },
  {
    slug: "empreendedorismo",
    digits: "71974131981",
    title: p("Empreendedorismo", "Entrepreneurship"),
    category: "trabalho",
    line: p("Uma intenção de iniciativa e realização profissional.", "An intention of initiative and professional achievement."),
    note: p("Associada à liderança, ao empreendedorismo e ao desenvolvimento de projetos.", "Associated with leadership, entrepreneurship, and project development."),
  },
  {
    slug: "trabalho-desejado",
    digits: "4931518641491",
    title: p("Trabalho desejado", "Desired job"),
    category: "trabalho",
    line: p("Para visualizar uma nova etapa da vida profissional.", "To envision a new stage in professional life."),
    note: p("Associada à conquista de oportunidades de emprego e à realização profissional.", "Associated with job opportunities and professional fulfilment."),
  },
  {
    slug: "progresso-na-carreira",
    digits: "212 309 99 14",
    title: p("Progresso na carreira", "Career progress"),
    category: "trabalho",
    line: p("Uma intenção de crescimento e novos horizontes.", "An intention of growth and new horizons."),
    note: p("Associada ao sucesso profissional e à expansão na carreira.", "Associated with career success and professional development."),
  },
  {
    slug: "conhecimento-financeiro",
    digits: "964986583",
    title: p("Conhecimento financeiro", "Financial knowledge"),
    category: "abundancia",
    line: p("Para cultivar compreensão e sabedoria sobre recursos.", "For cultivating understanding and wisdom about resources."),
    note: p("Associada ao conhecimento financeiro e ao amadurecimento das decisões.", "Associated with financial knowledge and more mature decisions."),
  },
  {
    slug: "romance-renovado",
    digits: "401543512",
    title: p("Romance renovado", "Renewed romance"),
    category: "amor",
    line: p("Uma intenção de leveza, encanto e novas experiências afetivas.", "An intention of lightness, affection, and new emotional experiences."),
    note: p("Associada ao romance, à aproximação e à abertura amorosa.", "Associated with romance, connection, and openness to love."),
  },
  {
    slug: "compreensao-no-amor",
    digits: "39 119 488 061",
    title: p("Compreensão no amor", "Understanding in love"),
    category: "amor",
    line: p("Para acolher perspectivas e fortalecer o diálogo.", "For welcoming different perspectives and strengthening dialogue."),
    note: p("Associada à compreensão, à empatia e à harmonia nos relacionamentos.", "Associated with understanding, empathy, and harmony in relationships."),
  },
  {
    slug: "harmonia-familiar",
    digits: "285555901",
    title: p("Harmonia familiar", "Family harmony"),
    category: "amor",
    line: p("Uma intenção de convivência mais tranquila e acolhedora.", "An intention of calmer and more supportive relationships."),
    note: p("Associada à resolução de conflitos e à harmonia familiar.", "Associated with conflict resolution and family harmony."),
  },
  {
    slug: "abertura-para-o-amor",
    digits: "197 023",
    title: p("Abertura para o amor", "Openness to love"),
    category: "amor",
    line: p("Uma intenção de disponibilidade para novas conexões.", "An intention of being open to new connections."),
    note: p("Associada à chegada de um relacionamento e à abertura afetiva.", "Associated with welcoming a relationship and emotional openness."),
  },
  {
    slug: "criatividade",
    digits: "489 712 819 48",
    title: p("Criatividade", "Creativity"),
    category: "desenvolvimento",
    line: p("Para permitir que ideias novas ganhem forma.", "For allowing new ideas to take shape."),
    note: p("Associada à criatividade, à inspiração e à expressão pessoal.", "Associated with creativity, inspiration, and self-expression."),
  },
  {
    slug: "intuicao",
    digits: "35986",
    title: p("Intuição", "Intuition"),
    category: "espiritualidade",
    line: p("Uma intenção de escuta interior e percepção.", "An intention of inner listening and perception."),
    note: p("Associada à intuição, à sensibilidade e à percepção sutil.", "Associated with intuition, sensitivity, and subtle perception."),
  },
  {
    slug: "decisoes",
    digits: "619 714 21841",
    title: p("Tomada de decisões", "Decision-making"),
    category: "clareza",
    line: p("Para perceber alternativas e escolher um caminho.", "For considering alternatives and choosing a path."),
    note: p("Associada à clareza mental e à tomada de decisões.", "Associated with mental clarity and decision-making."),
  },
  {
    slug: "concentracao",
    digits: "45 88 623",
    title: p("Concentração", "Concentration"),
    category: "desenvolvimento",
    line: p("Uma intenção de atenção e presença no momento.", "An intention of attention and presence in the moment."),
    note: p("Associada ao foco, à concentração e à continuidade das tarefas.", "Associated with focus, concentration, and sustained attention."),
  },
  {
    slug: "forca-de-vontade",
    digits: "35 42 888",
    title: p("Força de vontade", "Willpower"),
    category: "desenvolvimento",
    line: p("Para sustentar escolhas e seguir em frente.", "For sustaining choices and moving forward."),
    note: p("Associada à determinação, à perseverança e à força de vontade.", "Associated with determination, perseverance, and willpower."),
  },
  {
    slug: "gestao-do-tempo",
    digits: "17981",
    title: p("Gestão do tempo", "Time management"),
    category: "desenvolvimento",
    line: p("Uma intenção de organização e equilíbrio das prioridades.", "An intention of organization and balanced priorities."),
    note: p("Associada à gestão do tempo e à organização pessoal.", "Associated with time management and personal organization."),
  },
  {
    slug: "equilibrio-emocional",
    digits: "58 963 8114",
    title: p("Equilíbrio emocional", "Emotional balance"),
    category: "equilibrio",
    line: p("Para cultivar estabilidade interior e suavidade.", "For cultivating inner steadiness and ease."),
    note: p("Associada à harmonia das emoções e ao equilíbrio emocional.", "Associated with emotional harmony and balance."),
  },
  {
    slug: "bem-estar-no-trabalho",
    digits: "591 718 9181419",
    title: p("Equilíbrio entre vida e trabalho", "Work-life balance"),
    category: "equilibrio",
    line: p("Uma intenção de conciliar responsabilidades e descanso.", "An intention of balancing responsibilities and rest."),
    note: p("Associada ao equilíbrio entre a vida profissional e a vida pessoal.", "Associated with balance between professional and personal life."),
  },
  {
    slug: "aterramento",
    digits: "51 86 923",
    title: p("Enraizamento", "Grounding"),
    category: "equilibrio",
    line: p("Para reencontrar presença e conexão com o agora.", "For reconnecting with presence and the here and now."),
    note: p("Associada ao enraizamento, à estabilidade e à presença.", "Associated with grounding, stability, and presence."),
  },
  {
    slug: "resiliencia",
    digits: "814 418 719",
    title: p("Resiliência", "Resilience"),
    category: "equilibrio",
    line: p("Uma intenção de firmeza diante das mudanças.", "An intention of steadiness through change."),
    note: p("Associada à resiliência, à fortaleza interior e à recuperação do ânimo.", "Associated with resilience, inner strength, and renewed motivation."),
  },
  {
    slug: "libertar-o-medo",
    digits: "42 58 735",
    title: p("Libertar o medo", "Releasing fear"),
    category: "equilibrio",
    line: p("Para acolher a coragem e recuperar a tranquilidade.", "For welcoming courage and returning to calm."),
    note: p("Associada à superação do medo e à coragem interior.", "Associated with moving through fear and finding inner courage."),
  },
  {
    slug: "harmonia-geral",
    digits: "14111963",
    title: p("Harmonia interior", "Inner harmony"),
    category: "equilibrio",
    line: p("Uma intenção de serenidade e alinhamento pessoal.", "An intention of serenity and personal alignment."),
    note: p("Associada à harmonia geral, à paz interior e ao equilíbrio.", "Associated with overall harmony, inner peace, and balance."),
  },
  {
    slug: "gestao-do-estresse",
    digits: "819 471",
    title: p("Gestão do estresse", "Stress management"),
    category: "equilibrio",
    line: p("Um momento de pausa e reconexão com a tranquilidade.", "A moment of pause and reconnection with calm."),
    note: p("Associada ao alívio da tensão e à serenidade.", "Associated with releasing tension and finding calm."),
  },
  {
    slug: "clareza-mental",
    digits: "212 888 197",
    title: p("Clareza mental", "Mental clarity"),
    category: "clareza",
    line: p("Para organizar pensamentos e ampliar a percepção.", "For organizing thoughts and expanding awareness."),
    note: p("Associada à lucidez, à clareza e à organização das ideias.", "Associated with clarity and organized thinking."),
  },
  {
    slug: "otimismo",
    digits: "25 67 993",
    title: p("Otimismo", "Optimism"),
    category: "equilibrio",
    line: p("Uma intenção de leveza e alegria no cotidiano.", "An intention of lightness and joy in everyday life."),
    note: p("Associada ao pensamento positivo e ao bom humor.", "Associated with a positive outlook and good spirits."),
  },
  {
    slug: "libertar-a-raiva",
    digits: "66 82 121",
    title: p("Liberar a raiva", "Releasing anger"),
    category: "equilibrio",
    line: p("Para acolher emoções e abrir espaço à serenidade.", "For acknowledging emotions and making room for serenity."),
    note: p("Associada à liberação da raiva e ao equilíbrio emocional.", "Associated with releasing anger and emotional balance."),
  },
  {
    slug: "futuro-ideal",
    digits: "813 791",
    title: p("Futuro ideal", "Ideal future"),
    category: "desenvolvimento",
    line: p("Uma intenção de visualização e novos caminhos.", "An intention of visualization and new possibilities."),
    note: p("Associada à construção de um futuro desejado.", "Associated with envisioning a desired future."),
  },
  {
    slug: "potencial-pessoal",
    digits: "823 494 7815 72954",
    title: p("Potencial pessoal", "Personal potential"),
    category: "desenvolvimento",
    line: p("Para reconhecer talentos e possibilidades de crescimento.", "For recognizing talents and opportunities for growth."),
    note: p("Associada à expansão do potencial e ao desenvolvimento pessoal.", "Associated with personal potential and growth."),
  },
  {
    slug: "bem-estar-geral",
    digits: "189 1014",
    title: p("Bem-estar geral", "Overall wellbeing"),
    category: "vitalidade",
    line: p("Uma intenção de vitalidade e cuidado pessoal.", "An intention of vitality and personal care."),
    note: p("Associada à saúde geral e à sensação de bem-estar.", "Associated with overall health and wellbeing."),
  },
  {
    slug: "conexao-com-a-luz",
    digits: "12370744",
    title: p("Conexão com a luz", "Connection with light"),
    category: "espiritualidade",
    line: p("Uma intenção de conexão espiritual e contemplação.", "An intention of spiritual connection and contemplation."),
    note: p("Associada à luz do Criador e à conexão espiritual.", "Associated with the light of the Creator and spiritual connection."),
  },
  {
    slug: "expansao-da-consciencia",
    digits: "548 917 818",
    title: p("Expansão da consciência", "Expanding consciousness"),
    category: "espiritualidade",
    line: p("Para aprofundar presença, percepção e autoconhecimento.", "For deepening presence, perception, and self-awareness."),
    note: p("Associada à consciência e ao despertar interior.", "Associated with consciousness and inner awakening."),
  },
  {
    slug: "terceiro-olho",
    digits: "881881881",
    title: p("Terceiro olho", "Third eye"),
    category: "espiritualidade",
    line: p("Uma intenção de percepção intuitiva e visão interior.", "An intention of intuitive perception and inner vision."),
    note: p("Associada à abertura simbólica do terceiro olho.", "Associated with the symbolic opening of the third eye."),
  },
  {
    slug: "sucesso-nos-estudos",
    digits: "398 117 918",
    title: p("Sucesso nos estudos", "Study success"),
    category: "desenvolvimento",
    line: p("Uma intenção de dedicação e realização acadêmica.", "An intention of dedication and academic achievement."),
    note: p("Associada ao progresso nos estudos e à aprendizagem.", "Associated with progress in studies and learning."),
  },
  {
    slug: "boa-fortuna",
    digits: "817 992 18",
    title: p("Boa fortuna", "Good fortune"),
    category: "clareza",
    line: p("Uma intenção de abertura a circunstâncias favoráveis.", "An intention of openness to favorable circumstances."),
    note: p("Associada à sorte e à boa fortuna.", "Associated with luck and good fortune."),
  },
];

export function say(lang: Lang, phrase: Phrase): string {
  return phrase[lang];
}

export function getCode(slug: string): CodeEntry | undefined {
  return codes.find((code) => code.slug === slug);
}

export function categoryLabel(id: CategoryId, lang: Lang): string {
  return categories.find((category) => category.id === id)?.label[lang] ?? id;
}

export function codeForDay(day: Date, list: CodeEntry[] = codes): CodeEntry {
  const key =
    day.getFullYear() * 1000 + (day.getMonth() + 1) * 40 + day.getDate();
  return list[key % list.length] ?? list[0]!;
}
