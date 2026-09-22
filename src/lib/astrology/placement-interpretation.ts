import type { NatalAspect, NatalBody, NatalPosition } from "./natal-chart";
import {
  getAspectInterpretation,
  getBodyInterpretation,
  getHouseInterpretation,
  getSignInterpretation,
  type AstrologyLocale,
} from "./interpretations";

type BodyExpression = {
  subject: string;
  manifestation: string;
};

const bodyExpressions: Record<NatalBody, { pt: BodyExpression; en: BodyExpression }> = {
  Sun: {
    pt: { subject: "sua identidade, sua vontade e sua força vital", manifestation: "na maneira de assumir autoria, escolher uma direção e ocupar espaço com presença" },
    en: { subject: "your identity, will, and vitality", manifestation: "in how you claim authorship, choose a direction, and take up space with presence" },
  },
  Moon: {
    pt: { subject: "suas necessidades emocionais, seus instintos e sua memória", manifestation: "nas reações espontâneas, nos hábitos de cuidado e no que faz você se sentir em casa" },
    en: { subject: "your emotional needs, instincts, and memory", manifestation: "in spontaneous reactions, caring habits, and what makes you feel at home" },
  },
  Mercury: {
    pt: { subject: "seu pensamento, sua linguagem e sua curiosidade", manifestation: "na forma de aprender, organizar ideias, conversar e chegar a uma decisão" },
    en: { subject: "your thinking, language, and curiosity", manifestation: "in how you learn, organize ideas, communicate, and reach a decision" },
  },
  Venus: {
    pt: { subject: "sua forma de amar, escolher e reconhecer valor", manifestation: "no modo de criar vínculos, receber prazer, negociar e demonstrar afeto" },
    en: { subject: "your way of loving, choosing, and recognizing value", manifestation: "in how you bond, receive pleasure, negotiate, and show affection" },
  },
  Mars: {
    pt: { subject: "seu desejo, sua coragem e sua maneira de agir", manifestation: "na forma de começar, defender limites, enfrentar conflitos e sustentar esforço" },
    en: { subject: "your desire, courage, and way of acting", manifestation: "in how you begin, defend boundaries, face conflict, and sustain effort" },
  },
  Jupiter: {
    pt: { subject: "sua confiança, sua busca de sentido e sua expansão", manifestation: "nas oportunidades que procura, no conhecimento que compartilha e no horizonte que escolhe ampliar" },
    en: { subject: "your confidence, search for meaning, and expansion", manifestation: "in the opportunities you seek, the knowledge you share, and the horizon you choose to widen" },
  },
  Saturn: {
    pt: { subject: "sua relação com limites, responsabilidade e tempo", manifestation: "no que exige compromisso, prática, paciência e construção de autoridade interna" },
    en: { subject: "your relationship with limits, responsibility, and time", manifestation: "in what asks for commitment, practice, patience, and inner authority" },
  },
  Uranus: {
    pt: { subject: "sua necessidade de liberdade, mudança e originalidade", manifestation: "no que você questiona, reinventa e se recusa a viver de forma automática" },
    en: { subject: "your need for freedom, change, and originality", manifestation: "in what you question, reinvent, and refuse to live on autopilot" },
  },
  Neptune: {
    pt: { subject: "sua sensibilidade, imaginação e percepção do invisível", manifestation: "na arte, na empatia, nos sonhos e nas atmosferas que você percebe antes de explicar" },
    en: { subject: "your sensitivity, imagination, and perception of the unseen", manifestation: "in art, empathy, dreams, and atmospheres you perceive before you can explain them" },
  },
  Pluto: {
    pt: { subject: "sua relação com poder, verdade e transformação", manifestation: "nos processos de desapego, regeneração e encontro com o que não aceita mais mudanças superficiais" },
    en: { subject: "your relationship with power, truth, and transformation", manifestation: "in processes of release, regeneration, and meeting what no longer accepts superficial change" },
  },
};

export type DegreeInterpretation = {
  label: string;
  title: string;
  explanation: string;
};

const degreeMeanings = {
  pt: {
    opening: { title: "o primeiro terço do signo", explanation: "Essa faixa tende a expressar o signo de maneira mais direta, exploratória e ainda em construção." },
    middle: { title: "o terço central do signo", explanation: "Essa faixa tende a buscar consistência, prática e uma forma reconhecível para as qualidades do signo." },
    closing: { title: "o terço final do signo", explanation: "Essa faixa tende a acrescentar complexidade, maturidade e necessidade de integrar as qualidades do signo à experiência acumulada." },
  },
  en: {
    opening: { title: "the sign's opening third", explanation: "This range tends to express the sign in a more direct, exploratory, still-developing way." },
    middle: { title: "the sign's middle third", explanation: "This range tends to seek consistency, practice, and a recognizable form for the sign's qualities." },
    closing: { title: "the sign's closing third", explanation: "This range tends to add complexity, maturity, and a need to integrate the sign's qualities with wider experience." },
  },
} as const;

export function getDegreeInterpretation(degreesInSign: number, locale: AstrologyLocale): DegreeInterpretation {
  const exact = `${degreesInSign.toFixed(1)}°`;
  const third = degreesInSign < 10 ? "opening" : degreesInSign < 20 ? "middle" : "closing";
  return { label: exact, ...degreeMeanings[locale === "en" ? "en" : "pt"][third] };
}

export function getPlacementInterpretation(position: Pick<NatalPosition, "body" | "sign" | "degreesInSign" | "house">, locale: AstrologyLocale) {
  const body = getBodyInterpretation(position.body, locale);
  const sign = getSignInterpretation(position.sign, locale);
  const house = getHouseInterpretation(position.house, locale);
  const degree = getDegreeInterpretation(position.degreesInSign, locale);
  const expression = bodyExpressions[position.body][locale === "en" ? "en" : "pt"];

  if (locale === "en") {
    return {
      title: `${body.label} in ${sign.label}`,
      combination: `The expression of ${expression.subject} takes form through ${sign.tone}. This does not define your whole personality; it describes one recurring way this part of you may operate.`,
      manifestation: `It may become visible ${expression.manifestation}, especially in matters of ${house.area}.`,
      gifts: `When supported: ${sign.gifts}.`,
      tension: `When strained: ${sign.tension}.`,
      houseTitle: `${house.label} · ${house.area}`,
      houseMeaning: `${body.label} brings its themes into this area of life. ${house.explanation}`,
      degreeTitle: `${degree.label} · ${degree.title}`,
      degreeMeaning: `${degree.explanation} The degree refines the reading; it does not replace the sign, house, or aspects.`,
      synthesis: `${body.label} in ${sign.label}, in ${house.label}, connects ${body.archetype} with ${sign.tone}, giving special weight to ${house.area}.`,
      question: body.question,
    };
  }

  return {
    title: `${body.label} em ${sign.label}`,
    combination: `A expressão de ${expression.subject} ganha forma por meio de ${sign.tone}. Isso não resume a sua personalidade inteira; descreve uma maneira recorrente de essa parte de você funcionar.`,
    manifestation: `Pode aparecer ${expression.manifestation}, especialmente nos temas de ${house.area}.`,
    gifts: `Quando bem sustentado: ${sign.gifts}.`,
    tension: `Quando entra em tensão: ${sign.tension}.`,
    houseTitle: `${house.label} · ${house.area}`,
    houseMeaning: `${body.label} leva seus temas para essa área da vida. ${house.explanation}`,
    degreeTitle: `${degree.label} · ${degree.title}`,
    degreeMeaning: `${degree.explanation} O grau refina a leitura; não substitui o signo, a casa nem os aspectos.`,
    synthesis: `${body.label} em ${sign.label}, na ${house.label}, conecta ${body.archetype} a ${sign.tone}, dando peso especial a ${house.area}.`,
    question: body.question,
  };
}

export function getBodyAspectReadings(body: NatalBody, aspects: Array<Pick<NatalAspect, "firstBody" | "secondBody" | "type" | "orb">>, locale: AstrologyLocale) {
  const bodyCopy = getBodyInterpretation(body, locale);
  return aspects
    .filter((aspect) => aspect.firstBody === body || aspect.secondBody === body)
    .map((aspect) => {
      const otherBody = aspect.firstBody === body ? aspect.secondBody : aspect.firstBody;
      const otherCopy = getBodyInterpretation(otherBody, locale);
      const aspectCopy = getAspectInterpretation(aspect.type, locale);
      return {
        id: `${aspect.firstBody}-${aspect.type}-${aspect.secondBody}`,
        title: `${bodyCopy.label} ${aspectCopy.label.toLocaleLowerCase(locale === "en" ? "en" : "pt-BR")} ${otherCopy.label}`,
        orb: locale === "en" ? `${aspect.orb.toFixed(1)}° orb` : `orbe de ${aspect.orb.toFixed(1)}°`,
        explanation: locale === "en"
          ? `${aspectCopy.experience} In this chart, the aspect connects ${bodyCopy.archetype} with ${otherCopy.archetype}.`
          : `${aspectCopy.experience} Neste mapa, o aspecto conecta ${bodyCopy.archetype} a ${otherCopy.archetype}.`,
      };
    });
}
