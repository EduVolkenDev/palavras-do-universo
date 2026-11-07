import type { Lang } from "@/lib/numeros/copy";

export type CategoryId =
  | "abundancia"
  | "amor"
  | "vitalidade"
  | "protecao"
  | "clareza";

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
    category: "abundancia",
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
    category: "abundancia",
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
    category: "abundancia",
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
    category: "protecao",
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
    category: "clareza",
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
    category: "clareza",
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
