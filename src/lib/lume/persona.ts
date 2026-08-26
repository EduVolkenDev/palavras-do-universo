import type { Locale } from "@/lib/i18n/config";
import type { UserContext } from "@/lib/personalization/reading-context";

export const LUME_NAME = "Lume";

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
  | "account";

export type LumeAction = {
  label: string;
  href: string;
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
    account: {
      text: "Your account gives Lume a place to keep only the context you choose to share, protect your history, and continue your journey across devices.",
      action: { label: "Back to the beginning", href: "/" },
      suggestions: ["What gets saved?", "How do I create an account?"],
    },
  },
};

export function getLumeSurface(pathname: string): LumeSurface {
  if (pathname.startsWith("/meu-universo")) return "universe";
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
  if (!signals?.hasExplicitContext) return base;

  const focus = signals.focusAreas[0];
  const phase = signals.currentPhase;
  const name = userContext?.readingProfile.displayName;
  const anchor = [name, focus, phase].filter(Boolean).join(" · ");

  if (locale === "en") {
    return {
      ...base,
      text:
        surface === "universe"
          ? `Your map already has an axis${anchor ? ` — ${anchor}` : ""}. I can use what you chose to share to connect your next reading with this moment, without turning it into a fixed identity.`
          : `I can keep this moment in view${focus ? `, especially around ${focus.toLowerCase()}` : ""}. ${base.text}`,
    };
  }

  return {
    ...base,
    text:
      surface === "universe"
        ? `Seu mapa já tem um eixo${anchor ? ` — ${anchor}` : ""}. Posso usar o que você escolheu compartilhar para conectar a próxima leitura com este momento, sem transformar isso em uma identidade fixa.`
        : `Posso manter este momento em vista${focus ? `, especialmente em torno de ${focus.toLowerCase()}` : ""}. ${base.text}`,
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

  const fallback = copy[locale][surface];
  return {
    text: isEnglish
      ? `${fallback.text} If you tell me what you are trying to do, I can point you to the next step.`
      : `${fallback.text} Se você me disser o que está tentando fazer, eu aponto o próximo passo.`,
    action: fallback.action,
    suggestions: fallback.suggestions,
  };
}
