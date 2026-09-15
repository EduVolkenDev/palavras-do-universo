import type { Locale } from "@/lib/i18n/config";
import {
  type ActiveReadingContext,
  type ActiveReadingCardContext,
  type UserContext,
} from "@/lib/personalization/reading-context";
import { LAB_PRACTICE_LABELS } from "@/lib/lab/practice";
import { localizeTarotCard } from "@/lib/i18n/oracle";
import { CARDS } from "@/lib/tarot/cards";

export const LUME_NAME = "Lume";
export const LUME_QUESTION_EVENT = "pdu-lume-question";

export const LUME_AI_INSTRUCTIONS = `
Você é Lume, a inteligência interpretativa de Palavras do Universo.
Sua função é conectar a pergunta, as cartas, o momento declarado pela pessoa e os padrões disponíveis para devolver clareza prática, presença e um próximo passo possível.

Identidade de Lume:
- acolhedora, observadora, elegante, concisa e humana;
- poética apenas quando isso aumentar a compreensão;
- clara o suficiente para qualquer pessoa, sem jargão esotérico;
- orientada por possibilidades, contexto e escolha — nunca por destino fixo.

Princípios inegociáveis:
- as cartas são uma lente simbólica, não uma prova nem uma previsão inevitável;
- não diga que sabe o que outra pessoa sente, fará ou pensa;
- não dê diagnóstico médico, aconselhamento jurídico ou certeza financeira;
- não alimente paranoia, dependência, ansiedade ou decisões impulsivas;
- reconheça limites e devolva autonomia à pessoa;
- use apenas o contexto fornecido; não invente memória, fatos ou recorrências;
- quando houver contexto salvo, trate-o como algo compartilhado conscientemente pela pessoa, não como vigilância.

Lume não se apresenta como uma consciência sobrenatural. Ela é a presença interpretativa e orientadora criada para este espaço.
`.trim();

export type LumeSurface =
  | "home"
  | "readings"
  | "spread"
  | "daily"
  | "universe"
  | "deck"
  | "professionals"
  | "account"
  | "lab";

export type LumeAction = {
  label: string;
  href: string;
  question?: string;
};

export type LumeReply = {
  text: string;
  action?: LumeAction;
  suggestions?: string[];
};

type LocalizedReply = Omit<LumeReply, "action"> & {
  action?: LumeAction;
};

const copy: Record<Locale, Record<LumeSurface, LocalizedReply>> = {
  "pt-BR": {
    home: {
      text: "Estou aqui para abrir o primeiro caminho. Escolha um tema, escreva o que está pedindo atenção e comece por uma pergunta honesta.",
      action: { label: "Começar uma leitura", href: "#leitura" },
      suggestions: ["Como faço uma leitura?", "Qual experiência devo escolher?"],
    },
    readings: {
      text: "Cada experiência tem um propósito diferente. Se você ainda não sabe por onde começar, a leitura gratuita é uma entrada simples e sem compromisso.",
      action: { label: "Ver experiências", href: "/tiradas" },
      suggestions: ["Qual leitura é melhor para mim?", "Quero começar gratuitamente"],
    },
    spread: {
      text: "Você está diante de uma tirada especial. Primeiro observe a arquitetura das posições; depois prepare uma pergunta central e deixe que o conjunto, não uma carta isolada, conduza a leitura.",
      action: { label: "Preparar minha pergunta", href: "#preparar-pergunta" },
      suggestions: ["Como preparar minha pergunta?", "Como esta tirada funciona?"],
    },
    daily: {
      text: "A Mensagem do Dia é uma pausa curta para perceber o clima do agora. A Carta do Dia ilumina um símbolo; uma leitura completa aprofunda uma pergunta.",
      action: { label: "Abrir uma leitura", href: "/#leitura" },
      suggestions: ["Qual é a diferença entre as cartas?", "Onde encontro minhas leituras?"],
    },
    universe: {
      text: "Meu Universo reúne suas leituras, cartas, ações e o contexto que você escolheu compartilhar. O Mapa Inicial ajuda minhas respostas a ficarem menos genéricas.",
      action: { label: "Abrir o Mapa Inicial", href: "/meu-universo#mapa-inicial" },
      suggestions: ["Como Lume usa meu contexto?", "Como proteger meu histórico?"],
    },
    deck: {
      text: "O Baralho é um espaço de contemplação. Explore as cartas por imagem, nome e significado antes de levá-las para uma pergunta.",
      action: { label: "Explorar o Baralho", href: "/baralho" },
      suggestions: ["Como ler uma carta?", "Quero fazer uma pergunta"],
    },
    professionals: {
      text: "Quando uma questão pede escuta humana, você pode conhecer profissionais, modalidades e faixas de acesso. Lume ajuda a encontrar a próxima porta, não escolhe por você.",
      action: { label: "Conhecer profissionais", href: "/profissionais" },
      suggestions: ["Como escolher um profissional?", "Existem opções sociais?"],
    },
    lab: {
      text: "O Lab é uma pausa sem cartas para organizar o que está vivo e escolher um gesto possível. Se você já praticou, posso ajudar a retomar ou abrir outra porta.",
      action: { label: "Entrar no Lab", href: "/lab#pratica" },
      suggestions: ["Retomar minha prática", "Abrir uma próxima porta"],
    },
    account: {
      text: "Sua conta dá a Lume um lugar para guardar somente o contexto que você escolher compartilhar, proteger seu histórico e continuar sua jornada em outros acessos.",
      action: { label: "Voltar ao início", href: "/" },
      suggestions: ["O que fica salvo?", "Como criar minha conta?"],
    },
  },
  en: {
    home: {
      text: "I am here to open the first path. Choose a theme, write what is asking for attention, and begin with an honest question.",
      action: { label: "Start a reading", href: "#leitura" },
      suggestions: ["How do I get a reading?", "Which experience should I choose?"],
    },
    readings: {
      text: "Each experience has a different purpose. If you are unsure where to begin, the free reading is a simple, commitment-free entrance.",
      action: { label: "See experiences", href: "/tiradas" },
      suggestions: ["Which reading is right for me?", "I want to start for free"],
    },
    spread: {
      text: "You are inside a special spread. First observe the architecture of its positions; then prepare one central question and let the full map, rather than one isolated card, guide the reading.",
      action: { label: "Prepare my question", href: "#preparar-pergunta" },
      suggestions: ["How should I prepare my question?", "How does this spread work?"],
    },
    daily: {
      text: "The Daily Message is a short pause to notice the tone of now. The Card of the Day illuminates a symbol; a full reading deepens a question.",
      action: { label: "Open a reading", href: "/#leitura" },
      suggestions: ["What is the difference between the cards?", "Where are my readings?"],
    },
    universe: {
      text: "My Universe gathers your readings, cards, actions, and the context you choose to share. The Initial Map helps my answers feel less generic.",
      action: { label: "Open the Initial Map", href: "/meu-universo#mapa-inicial" },
      suggestions: ["How does Lume use my context?", "How do I protect my history?"],
    },
    deck: {
      text: "The Deck is a space for contemplation. Explore cards by image, name, and meaning before bringing them into a question.",
      action: { label: "Explore the Deck", href: "/baralho" },
      suggestions: ["How do I read a card?", "I want to ask a question"],
    },
    professionals: {
      text: "When a question calls for human listening, you can explore professionals, formats, and access ranges. Lume helps you find the next door; it does not choose for you.",
      action: { label: "Meet professionals", href: "/profissionais" },
      suggestions: ["How do I choose a professional?", "Are social options available?"],
    },
    lab: {
      text: "The Lab is a card-free pause to organize what is alive and choose one possible gesture. If you have practiced before, I can help you return or open another door.",
      action: { label: "Enter the Lab", href: "/lab#pratica" },
      suggestions: ["Resume my practice", "Open a next door"],
    },
    account: {
      text: "Your account gives Lume a place to keep only the context you choose to share, protect your history, and continue your journey across devices.",
      action: { label: "Back to the beginning", href: "/" },
      suggestions: ["What gets saved?", "How do I create an account?"],
    },
  },
};

export function getLumeSurface(pathname: string): LumeSurface {
  if (pathname.startsWith("/meu-universo")) return "universe";
  if (pathname.startsWith("/lab")) return "lab";
  if (pathname.startsWith("/tiradas/")) return "spread";
  if (pathname.startsWith("/tiradas")) return "readings";
  if (pathname.startsWith("/carta-do-dia")) return "daily";
  if (pathname.startsWith("/baralho")) return "deck";
  if (pathname.startsWith("/profissionais")) return "professionals";
  if (pathname.startsWith("/entrar")) return "account";
  return "home";
}

export function getLumeWelcome(
  surface: LumeSurface,
  locale: Locale,
  userContext?: UserContext | null
) {
  const base = copy[locale][surface];
  const signals = userContext?.personalizationSignals;
  const journey = userContext?.journey;
  const activeReading = userContext?.activeReading;
  if (
    !signals?.hasExplicitContext &&
    !journey?.hasHistory &&
    !journey?.actionCount &&
    !userContext?.practiceContinuity?.latest &&
    !activeReading
  ) {
    return base;
  }

  const focus = signals?.focusAreas[0];
  const phase = signals?.currentPhase;
  const name = userContext?.readingProfile.displayName;
  const anchor = [name, focus, phase].filter(Boolean).join(" · ");
  const recurringPattern = journey?.recurringThemes[0] ?? journey?.recurringCards[0];
  const recentTheme = journey?.recentThemes[0];
  const openActionCount = journey?.openActionCount ?? 0;
  const latestPractice = userContext?.practiceContinuity?.latest;
  const latestPracticeLabel = latestPractice
    ? LAB_PRACTICE_LABELS[latestPractice.practiceKey][locale === "en" ? "en" : "pt"]
    : "";
  const nextPracticeLabel = userContext?.practiceContinuity?.recommendedPracticeKey
    ? LAB_PRACTICE_LABELS[userContext.practiceContinuity.recommendedPracticeKey][locale === "en" ? "en" : "pt"]
    : "";
  const practiceNote = latestPractice
    ? locale === "en"
      ? ` Your latest Lab practice was “${latestPracticeLabel}”; its next gesture was “${latestPractice.nextStep}”.`
      : ` Sua última prática no Lab foi “${latestPracticeLabel}”; o próximo gesto foi “${latestPractice.nextStep}”.`
    : "";
  const readingNote = activeReading?.question
    ? locale === "en"
      ? " Your active reading is centred on “" + activeReading.question + "”."
      : " Sua leitura ativa está centrada em “" + activeReading.question + "”."
    : "";

  if (surface === "lab" && latestPractice) {
    return {
      ...base,
      text:
        locale === "en"
          ? `You have already moved through “${latestPracticeLabel}”. The gesture you kept was “${latestPractice.nextStep}”. I can help you return to it or open “${nextPracticeLabel}” as another angle.`
          : `Você já passou por “${latestPracticeLabel}”. O gesto que ficou foi “${latestPractice.nextStep}”. Posso ajudar você a retomá-lo ou abrir “${nextPracticeLabel}” como outro ângulo.`,
      action: {
        label: locale === "en" ? "Resume this practice" : "Retomar esta prática",
        href: "/lab?retomar=1#pratica",
      },
      suggestions: base.suggestions,
    };
  }

  if (locale === "en") {
    return {
      ...base,
      text:
        surface === "universe"
          ? `Your map already has an axis${anchor ? ` — ${anchor}` : ""}.${
              recurringPattern
                ? ` ${recurringPattern.label} has returned ${recurringPattern.count} times in what you saved.`
                : recentTheme
                  ? ` Your most recent thread is ${recentTheme}.`
                  : ""
            }${
              openActionCount
                ? ` You have ${openActionCount} open gesture${openActionCount === 1 ? "" : "s"} waiting to be revisited.`
                : ""
            }${practiceNote}${readingNote} I can use what you chose to share to connect your next reading with this moment, without turning it into a fixed identity.`
          : `I can keep this moment in view${focus ? `, especially around ${focus.toLowerCase()}` : ""}.${
              openActionCount
                ? ` You also have ${openActionCount} open gesture${openActionCount === 1 ? "" : "s"} to revisit.`
                : ""
            }${practiceNote}${readingNote} ${base.text}`,
    };
  }

  return {
    ...base,
    text:
      surface === "universe"
        ? `Seu mapa já tem um eixo${anchor ? ` — ${anchor}` : ""}.${
            recurringPattern
              ? ` “${recurringPattern.label}” voltou ${recurringPattern.count} vezes no que você guardou.`
              : recentTheme
                ? ` O fio mais recente é ${recentTheme}.`
                : ""
          }${
            openActionCount
              ? ` Você tem ${openActionCount} gesto${openActionCount === 1 ? "" : "s"} em aberto para revisitar.`
              : ""
          }${practiceNote}${readingNote} Posso usar o que você escolheu compartilhar para conectar a próxima leitura com este momento, sem transformar isso em uma identidade fixa.`
        : `Posso manter este momento em vista${focus ? `, especialmente em torno de ${focus.toLowerCase()}` : ""}.${
            openActionCount
              ? ` Você também tem ${openActionCount} gesto${openActionCount === 1 ? "" : "s"} em aberto para revisitar.`
              : ""
          }${practiceNote}${readingNote} ${base.text}`,
  };
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function localizeActiveReadingCard(
  card: ActiveReadingCardContext,
  locale: Locale
): ActiveReadingCardContext {
  const sourceCard = CARDS.find(
    (item) => item.key === card.cardKey || item.name === card.name
  );
  if (!sourceCard) return card;

  const localizedCard = localizeTarotCard(sourceCard, locale);
  return {
    ...card,
    name: localizedCard.name,
    keyword: localizedCard.keywords[0] ?? card.keyword,
    meaning: card.reversed ? localizedCard.reversed : localizedCard.upright,
    coreMeaning: localizedCard.guide.core,
    lifeQuestion: localizedCard.guide.question,
  };
}

function getActiveReadingCards(
  activeReading: ActiveReadingContext,
  locale: Locale
) {
  return activeReading.cards.map((card) => localizeActiveReadingCard(card, locale));
}

function getActiveReadingExcerpt(result: string) {
  const lines = result
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return "";

  const heading = /^(?:\d+[).]\s*)?(?:RESPOSTA DIRETA|DIRECT ANSWER|CARTAS|CARDS|CONSELHO|ADVICE|MANTRA|TR[IÍ]ADE|THE THREE THREADS)$/i;
  const directIndex = lines.findIndex((line) => /^(?:\d+[).]\s*)?(?:RESPOSTA DIRETA|DIRECT ANSWER)$/i.test(line));
  const source = directIndex >= 0 ? lines.slice(directIndex + 1) : lines;
  return source
    .filter((line) => !heading.test(line))
    .slice(0, 2)
    .join(" ")
    .slice(0, 460);
}

function findActiveReadingCard(cards: ActiveReadingCardContext[], text: string) {
  return cards.find((card) => {
    const candidates = [card.name, card.cardKey.replaceAll("-", " ")];
    return candidates.some((candidate) => {
      const normalizedCandidate = normalize(candidate);
      const bareCandidate = normalizedCandidate.replace(/^(a|o|as|os|the)\s+/, "");
      return [normalizedCandidate, bareCandidate].some(
        (value) => value.length > 2 && text.includes(value)
      );
    });
  });
}

function asksAboutActiveReading(text: string) {
  if (/(como faco uma leitura|how do i get a reading|abrir carta do dia|open card of the day)/.test(text)) {
    return false;
  }

  return /(signific|represent|interpret|explic|explain|resum|summary|entend|understand|resultado|result|esta leitura|essa leitura|this reading|current reading|carta|card|arcano|tirada|spread)/.test(text);
}

type LumeQuestionIntent =
  | "relationship"
  | "work"
  | "decision"
  | "emotional"
  | "future"
  | "card"
  | "humanSupport"
  | "lab"
  | "openQuestion";

function stableVariantIndex(value: string, size: number) {
  if (size <= 1) return 0;

  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return Math.abs(hash) % size;
}

function classifyLumeQuestion(text: string): LumeQuestionIntent {
  // Do not classify generic "atendimento" or "sessão" language as human
  // support: those words also describe using a reading. Require an explicit
  // professional/therapy signal before sending someone to the marketplace.
  if (/(terapeut|terapia|psicolog|profission|escuta humana|apoio humano|acompanhamento humano|falar com alguem|talk to someone|therapist|therapy|human support)/.test(text)) {
    return "humanSupport";
  }

  if (/(carta|arcano|tarot|baralho|significad|morte|mago|sacerdotisa|card|deck|meaning)/.test(text)) {
    return "card";
  }

  if (/(lab|pratic|exercicio|exercise|organizar o que|organize what)/.test(text)) {
    return "lab";
  }

  if (/(amor|relacion|namor|marid|espos|ex |vinculo|afeto|love|relationship|partner)/.test(text)) {
    return "relationship";
  }

  if (/(trabalh|empreg|carreir|chefe|projet|dinheir|salari|negoci|negocio|vend|financ|career|job|money|work)/.test(text)) {
    return "work";
  }

  if (/(futur|acontec|vai dar|destin|previs|quando|will |future|happen|destiny)/.test(text)) {
    return "future";
  }

  if (/(decid|escolh|devo|vale a pena|termin|aceit|comec|mudar|sair|ficar|o que faco|should i|decide|choice)/.test(text)) {
    return "decision";
  }

  if (/(ansio|ansied|medo|confus|perdid|trist|cansad|sobrecar|angusti|solidao|bloque|nao sei|afraid|anxious|confused|lost|overwhelm|sad)/.test(text)) {
    return "emotional";
  }

  return "openQuestion";
}

function getContextCue(userContext: UserContext | null | undefined, isEnglish: boolean) {
  const signals = userContext?.personalizationSignals;
  if (!signals?.hasExplicitContext) return "";

  const focus = signals.focusAreas[0];
  const phase = signals.currentPhase;
  if (isEnglish) {
    if (focus) return ` Since you chose to keep ${focus.toLowerCase()} in view, we can use that as a lens without turning it into a label.`;
    if (phase) return ` You told me you are in ${phase.toLowerCase()}; we can let that context shape the next step without treating it as a fixed identity.`;
    return " I can also use the context you chose to share, without treating it as a fixed identity.";
  }

  if (focus) return ` Como você escolheu manter ${focus.toLowerCase()} em vista, podemos usar isso como lente sem transformar o tema em rótulo.`;
  if (phase) return ` Você me contou que está em ${phase.toLowerCase()}; podemos deixar esse contexto orientar o próximo passo sem transformá-lo em identidade fixa.`;
  return " Também posso usar o contexto que você escolheu compartilhar, sem transformá-lo em identidade fixa.";
}

function getQuestionAction(input: string, isEnglish: boolean): LumeAction {
  return {
    label: isEnglish
      ? "Open this question in a reading"
      : "Levar esta pergunta para uma leitura",
    href: "/#leitura",
    question: input.trim(),
  };
}

function replyToOpenQuestion(
  input: string,
  text: string,
  locale: Locale,
  userContext?: UserContext | null
): LumeReply {
  const isEnglish = locale === "en";
  const intent = classifyLumeQuestion(text);
  const contextCue = getContextCue(userContext, isEnglish);

  if (intent === "humanSupport") {
    return isEnglish
      ? {
          text: "This sounds like a moment where human listening may help. I cannot choose someone for you, but I can take you to professionals so you can compare approach, language, and access before reaching out.",
          action: { label: "Meet professionals", href: "/profissionais" },
          suggestions: ["Are there reduced-fee options?", "I want a reading first"],
        }
      : {
          text: "Isso parece pedir escuta humana. Eu não escolho alguém por você, mas posso levar você aos profissionais para comparar abordagem, idioma e faixa de acesso antes de entrar em contato.",
          action: { label: "Conhecer profissionais", href: "/profissionais" },
          suggestions: ["Existem opções sociais?", "Quero fazer uma leitura primeiro"],
        };
  }

  if (intent === "card") {
    return isEnglish
      ? {
          text: "If you are trying to understand a card, start with its image, central movement, and life question — not a single good-or-bad label. The Deck gives you that context before you bring the card back to your own question.",
          action: { label: "Explore the Deck", href: "/baralho" },
          suggestions: ["I want to ask a personal question", "What does this card invite?"],
        }
      : {
          text: "Se você está tentando entender uma carta, comece pela imagem, pelo movimento central e pela pergunta que ela provoca — não por um rótulo de boa ou ruim. O Baralho oferece esse contexto antes de você levar a carta para a sua própria pergunta.",
          action: { label: "Explorar o Baralho", href: "/baralho" },
          suggestions: ["Quero fazer uma pergunta pessoal", "O que esta carta me convida a olhar?"],
        };
  }

  if (intent === "lab") {
    return isEnglish
      ? {
          text: "You do not need to solve everything before beginning. The Lab helps you name what is alive and turn it into one possible gesture, without requiring a card or a perfect question.",
          action: { label: "Enter the Lab", href: "/lab#pratica" },
          suggestions: ["I want to open a reading", "Help me choose a small gesture"],
        }
      : {
          text: "Você não precisa resolver tudo antes de começar. O Lab ajuda a nomear o que está vivo e transformar isso em um gesto possível, sem exigir carta nem pergunta perfeita.",
          action: { label: "Entrar no Lab", href: "/lab#pratica" },
          suggestions: ["Quero abrir uma leitura", "Ajude-me a escolher um gesto pequeno"],
        };
  }

  const variants: Record<Exclude<LumeQuestionIntent, "humanSupport" | "card" | "lab">, string[]> = isEnglish
    ? {
        relationship: [
          "There is a living bond at the centre of your question. A reading can help you look at reciprocity, boundaries, and what you need to say — without inventing what the other person thinks.",
          "Your question asks for emotional clarity, not a sentence about someone else. We can separate what was said, what you felt, and what you are accepting to keep this bond alive.",
          "When another person is involved, I will not promise control over them. I can help you look at your position, your limits, and the next honest gesture.",
        ],
        work: [
          "There is a practical choice inside your question. A reading can help separate opportunity, fear, cost, and the resource you already have before you choose.",
          "This question asks for a criterion, not more urgency. We can look at what deserves your energy, what needs checking, and what first step fits real life.",
          "Work and money can make every option feel definitive. Let us turn this into a clear question about priorities and the next move you can actually test.",
        ],
        decision: [
          "Your question already contains a choice. A reading can help separate fear, desire, facts, and the part that is still yours to decide.",
          "Instead of forcing a yes-or-no answer, let us look at what each direction asks of you and which small sign would make the next step clearer.",
          "This is a good question for a spread because there is movement underneath it. The cards can organise the tension without taking your choice away.",
        ],
        emotional: [
          "Before looking for a ready-made answer, it may help to name what is pressing on you now. The Lab can organise the feeling, and a reading can deepen the question when it has a shape.",
          "I can hear that this is not only about information. It is also about finding a steadier place to choose from. We can begin with one honest question and one possible next step.",
          "When the mind is loud, clarity begins by making the question smaller. Let us bring it to what you can observe, choose, or care for today.",
        ],
        future: [
          "I cannot promise what the future will do, but I can help you look at the forces, choices, and signals shaping this moment. A reading is a useful place to begin.",
          "Rather than turn uncertainty into a fixed prediction, we can ask what is asking for attention now and what remains within your reach.",
          "The future is not a verdict waiting to be discovered. Let us use the cards as a lens for preparing your next choice with more presence.",
        ],
        openQuestion: [
          "There is something real behind this question, even if it is not fully named yet. Bring it exactly as it is to a reading and let the cards help organise the next layer.",
          "You do not need a perfect formulation. I can take this question as a starting point and help you look for the part that is observable, possible, and yours to choose.",
          "Let us give this question a useful shape: what is happening, what matters most, and what could become one small next step? A reading can hold that with you.",
        ],
      }
    : {
        relationship: [
          "Há um vínculo vivo no centro da sua pergunta. Uma leitura pode ajudar a observar reciprocidade, limites e o que você precisa dizer — sem inventar o que a outra pessoa pensa.",
          "Sua pergunta pede clareza afetiva, não uma sentença sobre alguém. Podemos separar o que foi dito, o que você sentiu e o que está aceitando para manter esse vínculo.",
          "Quando existe outra pessoa envolvida, eu não vou prometer controle sobre ela. Posso ajudar você a olhar sua posição, seus limites e o próximo gesto honesto.",
        ],
        work: [
          "Há uma escolha prática dentro da sua pergunta. Uma leitura pode ajudar a separar oportunidade, medo, custo e o recurso que você já tem antes de escolher.",
          "Essa pergunta pede critério, não mais pressa. Podemos olhar o que merece sua energia, o que precisa ser verificado e qual primeiro passo cabe na vida real.",
          "Trabalho e dinheiro podem fazer toda opção parecer definitiva. Vamos transformar isso em uma pergunta clara sobre prioridades e sobre o próximo movimento que você consegue testar.",
        ],
        decision: [
          "Sua pergunta já contém uma escolha. Uma leitura pode ajudar a separar medo, desejo, fatos e aquilo que ainda cabe a você decidir.",
          "Em vez de forçar uma resposta de sim ou não, podemos olhar o que cada direção pede de você e qual pequeno sinal deixaria o próximo passo mais claro.",
          "Essa é uma boa pergunta para uma tirada porque existe movimento por baixo dela. As cartas podem organizar a tensão sem tirar sua escolha.",
        ],
        emotional: [
          "Antes de procurar uma resposta pronta, talvez seja importante nomear o que está apertando agora. O Lab organiza o sentimento; uma leitura aprofunda a pergunta quando ela ganha forma.",
          "Percebo que isso não é apenas uma busca por informação. É também uma busca por um lugar mais firme para escolher. Podemos começar com uma pergunta honesta e um próximo passo possível.",
          "Quando a mente faz barulho, a clareza começa diminuindo a pergunta. Vamos trazê-la para o que você pode observar, escolher ou cuidar hoje.",
        ],
        future: [
          "Eu não posso prometer o que o futuro fará, mas posso ajudar você a olhar forças, escolhas e sinais que estão moldando este momento. Uma leitura é um bom lugar para começar.",
          "Em vez de transformar incerteza em previsão fixa, podemos perguntar o que pede atenção agora e o que ainda está ao seu alcance.",
          "O futuro não é uma sentença escondida esperando ser descoberta. Vamos usar as cartas como lente para preparar sua próxima escolha com mais presença.",
        ],
        openQuestion: [
          "Existe algo real por trás dessa pergunta, mesmo que ainda não esteja totalmente nomeado. Leve-a exatamente assim para uma leitura e deixe as cartas organizarem a próxima camada.",
          "Você não precisa encontrar a formulação perfeita. Posso tomar essa pergunta como começo e ajudar a olhar para a parte observável, possível e que cabe a você escolher.",
          "Vamos dar uma forma útil a essa pergunta: o que está acontecendo, o que importa mais e o que pode virar um pequeno próximo passo? Uma leitura pode sustentar esse processo.",
        ],
      };

  const variant = variants[intent][stableVariantIndex(text, variants[intent].length)];
  return {
    text: `${variant}${contextCue}`,
    action: getQuestionAction(input, isEnglish),
    suggestions: isEnglish
      ? ["Open the question in a reading", "Help me make this question clearer"]
      : ["Levar esta pergunta para uma leitura", "Ajude-me a deixar a pergunta mais clara"],
  };
}

export function replyToLume(
  input: string,
  surface: LumeSurface,
  locale: Locale,
  userContext?: UserContext | null
): LumeReply {
  const text = normalize(input);
  const isEnglish = locale === "en";
  const signals = userContext?.personalizationSignals;
  const focus = signals?.focusAreas[0];
  const phase = signals?.currentPhase;
  const journey = userContext?.journey;
  const practiceContinuity = userContext?.practiceContinuity;
  const latestPractice = practiceContinuity?.latest;
  const latestPracticeLabel = latestPractice
    ? LAB_PRACTICE_LABELS[latestPractice.practiceKey][isEnglish ? "en" : "pt"]
    : "";
  const nextPracticeKey = practiceContinuity?.recommendedPracticeKey;
  const nextPracticeLabel = nextPracticeKey
    ? LAB_PRACTICE_LABELS[nextPracticeKey][isEnglish ? "en" : "pt"]
    : "";
  const activeReading = userContext?.activeReading;
  const activeReadingCards = activeReading
    ? getActiveReadingCards(activeReading, locale)
    : [];
  const activeReadingExcerpt =
    activeReading && activeReading.locale === locale
      ? getActiveReadingExcerpt(activeReading.result)
      : "";

  if (activeReading && asksAboutActiveReading(text)) {
    const mentionedCard = findActiveReadingCard(activeReadingCards, text);
    if (mentionedCard) {
      const orientation = mentionedCard.reversed
        ? isEnglish
          ? "as a point of resistance or revision"
          : "como um ponto de resistência ou revisão"
        : isEnglish
          ? "as a resource you can use now"
          : "como um recurso que você pode usar agora";
      const coreMeaning =
        mentionedCard.coreMeaning ||
        (isEnglish
          ? "a symbol that invites an honest look at your present situation"
          : "um símbolo que convida a olhar com honestidade para o seu momento");
      const representation = /represent(a|s)\b/i.test(coreMeaning)
        ? coreMeaning
        : isEnglish
          ? mentionedCard.name + " represents " + coreMeaning + "."
          : mentionedCard.name + " representa " + coreMeaning + ".";
      const directMeaning =
        mentionedCard.meaning && mentionedCard.meaning !== mentionedCard.coreMeaning
          ? mentionedCard.meaning
          : "";
      const cardText = isEnglish
        ? [
            representation,
            activeReading.question
              ? "In your question — “" + activeReading.question + "” — it appears " + orientation + "."
              : "In this spread, it appears " + orientation + ".",
            directMeaning,
          ]
        : [
            representation,
            activeReading.question
              ? "Na sua pergunta — “" + activeReading.question + "” — ela aparece " + orientation + "."
              : "Nesta tirada, ela aparece " + orientation + ".",
            directMeaning,
          ];
      return isEnglish
        ? {
            text: cardText.filter(Boolean).join(" "),
            action: { label: "Return to this reading", href: "/#leitura" },
            suggestions: ["What does this ask of me?", "Show the cards again"],
          }
        : {
            text: cardText.filter(Boolean).join(" "),
            action: { label: "Voltar à leitura", href: "/#leitura" },
            suggestions: ["O que isso pede de mim?", "Mostrar as cartas novamente"],
          };
    }

    const cardNames = activeReadingCards.map((card) => card.name).join(", ");
    const readingParts = isEnglish
      ? [
          activeReading.question ? "Your question is “" + activeReading.question + "”." : "",
          cardNames ? "The cards in this spread are: " + cardNames + "." : "",
          activeReadingExcerpt ? "The direct thread of the interpretation is: " + activeReadingExcerpt : "",
          "Read the cards together as a lens for choice, not as a fixed answer.",
        ]
      : [
          activeReading.question ? "Sua pergunta é “" + activeReading.question + "”." : "",
          cardNames ? "As cartas desta tirada são: " + cardNames + "." : "",
          activeReadingExcerpt ? "O fio direto da interpretação é: " + activeReadingExcerpt : "",
          "Leia as cartas juntas como uma lente para escolher, não como uma resposta fixa.",
        ];
    return isEnglish
      ? {
          text: readingParts.filter(Boolean).join(" "),
          action: { label: "Return to this reading", href: "/#leitura" },
          suggestions: ["What does this ask of me?", "What should I revisit?"],
        }
      : {
          text: readingParts.filter(Boolean).join(" "),
          action: { label: "Voltar à leitura", href: "/#leitura" },
          suggestions: ["O que isso pede de mim?", "O que devo revisitar?"],
        };
  }

  if (/(lab|pratic|practice|retom|resume|next door|proxima porta|outra porta|another door)/.test(text)) {
    const asksNext = /(proxim|next|outra|another|nova|new)/.test(text);
    if (latestPractice && asksNext && nextPracticeKey) {
      return isEnglish
        ? {
            text: `The next door I would suggest is “${nextPracticeLabel}”. It gives you another angle while keeping what you already noticed.`,
            action: {
              label: "Open next door",
              href: `/lab?porta=${encodeURIComponent(nextPracticeKey)}#pratica`,
            },
          }
        : {
            text: `A próxima porta que eu sugeriria é “${nextPracticeLabel}”. Ela oferece outro ângulo sem apagar o que você já percebeu.`,
            action: {
              label: "Abrir próxima porta",
              href: `/lab?porta=${encodeURIComponent(nextPracticeKey)}#pratica`,
            },
          };
    }

    if (latestPractice) {
      return isEnglish
        ? {
            text: `Your last Lab practice was “${latestPracticeLabel}”. You kept this gesture: “${latestPractice.nextStep}”. You can return to it and revise what changed.`,
            action: { label: "Resume this practice", href: "/lab?retomar=1#pratica" },
          }
        : {
            text: `Sua última prática no Lab foi “${latestPracticeLabel}”. Você guardou este gesto: “${latestPractice.nextStep}”. Dá para voltar a ele e perceber o que mudou.`,
            action: { label: "Retomar esta prática", href: "/lab?retomar=1#pratica" },
          };
    }

    return isEnglish
      ? {
          text: "The Lab gives you a card-free pause to name what is alive and choose one possible gesture.",
          action: { label: "Enter the Lab", href: "/lab#pratica" },
        }
      : {
          text: "O Lab oferece uma pausa sem cartas para nomear o que está vivo e escolher um gesto possível.",
          action: { label: "Entrar no Lab", href: "/lab#pratica" },
        };
  }

  if (/(acao|acoes|gesto|concluir|complete|action|gesture|reflex|reflection)/.test(text)) {
    if (journey?.openActionCount) {
      return isEnglish
        ? {
            text: `You have ${journey.openActionCount} open gesture${journey.openActionCount === 1 ? "" : "s"}. Return to what you chose, mark what happened, and let the reflection be enough — it does not need to be perfect.`,
            action: {
              label: "Open actions in My Universe",
              href: "/meu-universo#acoes-vivas",
            },
          }
        : {
            text: `Você tem ${journey.openActionCount} gesto${journey.openActionCount === 1 ? "" : "s"} em aberto. Volte ao que escolheu, registre o que aconteceu e deixe a reflexão ser suficiente — ela não precisa ser perfeita.`,
            action: {
              label: "Abrir ações no Meu Universo",
              href: "/meu-universo#acoes-vivas",
            },
          };
    }

    if (journey?.completedActionCount) {
      return isEnglish
        ? {
            text: `You have already recorded ${journey.completedActionCount} completed gesture${journey.completedActionCount === 1 ? "" : "s"}. A new action only needs to be small enough to become real today.`,
            action: { label: "Choose a new action", href: "/#acao" },
          }
        : {
            text: `Você já registrou ${journey.completedActionCount} gesto${journey.completedActionCount === 1 ? "" : "s"} concluído${journey.completedActionCount === 1 ? "" : "s"}. Uma nova ação só precisa ser pequena o bastante para virar realidade hoje.`,
            action: { label: "Escolher nova ação", href: "/#acao" },
          };
    }

    return isEnglish
      ? {
          text: "An action becomes part of your journey when you choose one small, concrete gesture and return to record what changed.",
          action: { label: "Choose an action", href: "/#acao" },
        }
      : {
          text: "Uma ação entra na sua jornada quando você escolhe um gesto pequeno e concreto e depois volta para registrar o que mudou.",
          action: { label: "Escolher uma ação", href: "/#acao" },
        };
  }

  if (
    /(histor|history|padr|pattern|recorr|repeat|repet)/.test(text) &&
    journey?.hasHistory
  ) {
    const recurringPattern =
      journey.recurringThemes[0] ?? journey.recurringCards[0];
    if (isEnglish) {
      return {
        text: recurringPattern
          ? `In what you chose to save, ${recurringPattern.label} has appeared ${recurringPattern.count} times. Treat that as a question worth revisiting, not as a fixed message.`
          : `I can see ${journey.totalSignals} saved signals so far, but there is not enough repetition to call a pattern yet. We can keep observing together.`,
        action: { label: "Open My Universe", href: "/meu-universo#historico-vivo" },
      };
    }
    return {
      text: recurringPattern
        ? `No que você escolheu guardar, “${recurringPattern.label}” apareceu ${recurringPattern.count} vezes. Tome isso como uma pergunta para revisitar, não como uma mensagem fixa.`
        : `Consigo ver ${journey.totalSignals} sinais guardados até agora, mas ainda não há repetição suficiente para chamar isso de padrão. Podemos continuar observando juntos.`,
      action: { label: "Abrir Meu Universo", href: "/meu-universo#historico-vivo" },
    };
  }

  if (/(momento|fase|context|contexto|perfil|profile)/.test(text) && signals?.hasExplicitContext) {
    if (isEnglish) {
      return {
        text: `You told me that you are${phase ? ` ${phase.toLowerCase()}` : " in a specific moment"}${focus ? `, with attention on ${focus.toLowerCase()}` : ""}. I use that as a lens for the next question — not as a prediction or a label.`,
        action: { label: "Open My Universe", href: "/meu-universo#mapa-inicial" },
      };
    }
    return {
      text: `Você me contou que está${phase ? ` ${phase.toLowerCase()}` : " atravessando um momento específico"}${focus ? `, com atenção em ${focus.toLowerCase()}` : ""}. Eu uso isso como lente para a próxima pergunta — não como previsão nem como rótulo.`,
      action: { label: "Abrir meu Mapa Inicial", href: "/meu-universo#mapa-inicial" },
    };
  }

  if (/(como|how).*(leitura|reading)|fazer.*leitura|get.*reading|pergunta|question/.test(text)) {
    return isEnglish
      ? {
          text: "Choose the experience that matches what you need, write one concrete question, and press Open my reading. The cards will appear only after your question is sent.",
          action: { label: "Open a reading", href: "/#leitura" },
        }
      : {
          text: "Escolha a experiência que combina com o que você precisa, escreva uma pergunta concreta e toque em Fazer minha leitura. As cartas só aparecem depois que sua pergunta é enviada.",
          action: { label: "Abrir uma leitura", href: "/#leitura" },
        };
  }

  if (/(qual|which|melhor|right).*(experien|leitura|reading)|comec|start|free|gratuit/.test(text)) {
    return isEnglish
      ? {
          text: "Start with the free daily reading if you want a gentle first step. Choose a one-time experience when you already know the question you want to explore.",
          action: { label: "See experiences", href: "/tiradas" },
        }
      : {
          text: "Comece pela leitura gratuita se quiser uma primeira experiência leve. Escolha uma leitura avulsa quando você já souber qual pergunta quer explorar.",
          action: { label: "Ver experiências", href: "/tiradas" },
        };
  }

  if (/(salv|save|histor|history|context|contexto|mapa|map)/.test(text)) {
    return isEnglish
      ? {
          text: "Your account protects your history. The Initial Map keeps only the context you choose to share, and you can return to edit it in My Universe.",
          action: { label: "Open My Universe", href: "/meu-universo" },
        }
      : {
          text: "Sua conta protege seu histórico. O Mapa Inicial guarda apenas o contexto que você escolheu compartilhar, e você pode voltar para editá-lo no Meu Universo.",
          action: { label: "Abrir Meu Universo", href: "/meu-universo" },
        };
  }

  if (/(pag|pay|checkout|compra|buy|preco|price)/.test(text)) {
    return isEnglish
      ? {
          text: "Choose an experience first. When payment is needed, the checkout explains the product, amount, and access before you confirm.",
          action: { label: "See experiences", href: "/tiradas" },
        }
      : {
          text: "Escolha primeiro uma experiência. Quando houver pagamento, o checkout mostra o produto, o valor e o acesso antes da confirmação.",
          action: { label: "Ver experiências", href: "/tiradas" },
        };
  }

  if (/(menu|naveg|where|onde|encontr|find)/.test(text)) {
    return isEnglish
      ? {
          text: "Use the menu to move between the daily ritual, readings, Deck, My Universe, and professionals. I can also take you directly to the next step.",
          action: { label: "Open the beginning", href: "/" },
        }
      : {
          text: "Use o menu para circular entre o ritual diário, as leituras, o Baralho, o Meu Universo e os profissionais. Eu também posso levar você direto ao próximo passo.",
          action: { label: "Voltar ao início", href: "/" },
        };
  }

  return replyToOpenQuestion(input, text, locale, userContext);
}
