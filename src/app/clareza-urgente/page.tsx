import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { normalizeLocale, LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/config";
import ClarezaUrgenteCampaign from "@/components/marketing/ClarezaUrgenteCampaign";
import {
  formatProductPrice,
  normalizeProductCurrency,
  PRODUCT_CURRENCY_COOKIE_NAME,
  resolveProductCurrency,
} from "@/lib/product/pricing";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const COPY: Record<Locale, React.ComponentProps<typeof ClarezaUrgenteCampaign>["copy"]> = {
  "pt-BR": {
    navBack: "Voltar ao portal",
    navLabel: "Palavras do Universo · uma leitura para o agora",
    eyebrow: "Clareza Urgente",
    title: "Quando o ruído aperta, volte ao seu eixo.",
    lead: "Uma leitura simbólica, profunda e prática para separar o que você sente, o que está sob seu cuidado e qual pode ser o próximo passo possível.",
    primaryCta: "Quero minha leitura",
    secondaryCta: "Começar gratuitamente",
    priceNote: "pagamento único · acesso imediato",
    trustLine: "Sem fatalismo. Sem promessas sobre terceiros. A leitura oferece linguagem e perspectiva para você escolher com mais consciência.",
    imageAlt: "Composição simbólica azul e dourada que representa a leitura Clareza Urgente.",
    freeEyebrow: "Antes de decidir",
    freeTitle: "Você pode sentir a linguagem do PDU sem pagar nada.",
    freeCopy: "Abra uma leitura gratuita no portal e perceba como uma pergunta bem colocada pode mudar o jeito de olhar para o dia.",
    freeCta: "Abrir leitura gratuita",
    stepsEyebrow: "Como a experiência acontece",
    stepsTitle: "Menos ruído. Mais presença para escolher.",
    steps: [
      { number: "01", title: "Nomeie o que está vivo", copy: "Você chega com a questão que está ocupando espaço — sem precisar transformá-la em uma pergunta perfeita." },
      { number: "02", title: "Observe as camadas", copy: "A leitura organiza símbolos, tensão, recurso e contexto para que sensação não seja confundida com destino." },
      { number: "03", title: "Volte para a sua escolha", copy: "O encerramento traduz a reflexão em uma pergunta melhor ou em um gesto pequeno que cabe na sua vida real." },
    ],
    boundaryEyebrow: "Uma experiência com contorno",
    boundaryTitle: "A profundidade está em devolver você a si.",
    boundaryCopy: "Clareza Urgente é feita para momentos em que você precisa de perspectiva, não de uma sentença pronta. Ela respeita sua autonomia e seus limites.",
    forYou: "Pode ser para você se",
    forYouItems: ["uma decisão está ocupando sua energia", "você quer compreender um padrão sem se reduzir a ele", "precisa de um próximo passo que seja seu"],
    notForYou: "Não é a proposta se",
    notForYouItems: ["você procura controlar a vontade de outra pessoa", "quer uma garantia sobre o futuro", "precisa substituir apoio médico, psicológico ou jurídico"],
    careEyebrow: "Quando a leitura pede presença humana",
    careTitle: "Você também pode continuar a conversa com alguém qualificado.",
    careCopy: "O PDU oferece um espaço de profissionais com ética, idioma e faixa de acesso clara para quando escuta e acompanhamento humano fizerem sentido.",
    careCta: "Conhecer profissionais",
    faqEyebrow: "Perguntas honestas",
    faqTitle: "Antes de abrir",
    faq: [
      { question: "Isso é uma previsão?", answer: "Não. A leitura usa símbolos como instrumento de reflexão. Ela não apresenta o futuro como algo fixo nem decide por você." },
      { question: "Posso começar sem comprar?", answer: "Sim. O portal tem leituras gratuitas para você conhecer a experiência antes de escolher uma leitura avulsa." },
      { question: "O que recebo ao comprar?", answer: "Você recebe a experiência completa da Clareza Urgente no portal, com a leitura organizada para retornar a ela e continuar sua reflexão." },
    ],
    footerNote: "Uma pausa para escutar melhor o que já pede nome.",
    footerTerms: "Termos",
    footerPrivacy: "Privacidade",
  },
  en: {
    navBack: "Back to the portal",
    navLabel: "Palavras do Universo · a reading for right now",
    eyebrow: "Urgent Clarity",
    title: "When the noise gets loud, return to your centre.",
    lead: "A symbolic, deep and practical reading to separate what you feel, what is yours to care for and what the next possible step might be.",
    primaryCta: "I want my reading",
    secondaryCta: "Start for free",
    priceNote: "one-time payment · immediate access",
    trustLine: "No fatalism. No promises about other people. The reading offers language and perspective so you can choose with more awareness.",
    imageAlt: "Blue and gold symbolic composition representing the Urgent Clarity reading.",
    freeEyebrow: "Before you decide",
    freeTitle: "You can feel the PDU language without paying anything.",
    freeCopy: "Open a free reading in the portal and notice how a well-placed question can change the way you see the day.",
    freeCta: "Open a free reading",
    stepsEyebrow: "How the experience unfolds",
    stepsTitle: "Less noise. More presence for choosing.",
    steps: [
      { number: "01", title: "Name what is alive", copy: "You arrive with the question taking up space — it does not need to be perfectly phrased." },
      { number: "02", title: "Notice the layers", copy: "The reading brings symbol, tension, resource and context together so feeling is not confused with fate." },
      { number: "03", title: "Return to your choice", copy: "The close turns reflection into a better question or a small gesture that can fit your real life." },
    ],
    boundaryEyebrow: "An experience with boundaries",
    boundaryTitle: "Depth begins by returning you to yourself.",
    boundaryCopy: "Urgent Clarity is for moments when you need perspective, not a sentence handed down. It respects your autonomy and your limits.",
    forYou: "It may be for you if",
    forYouItems: ["a decision is taking up your energy", "you want to understand a pattern without becoming it", "you need a next step that belongs to you"],
    notForYou: "It is not the promise if",
    notForYouItems: ["you want to control another person's will", "you are looking for a guarantee about the future", "you need to replace medical, psychological or legal support"],
    careEyebrow: "When a reading calls for human presence",
    careTitle: "You can continue the conversation with someone qualified.",
    careCopy: "PDU offers a space for professionals with clear ethics, language and access range when human listening and support make sense.",
    careCta: "Meet the professionals",
    faqEyebrow: "Honest questions",
    faqTitle: "Before you open",
    faq: [
      { question: "Is this a prediction?", answer: "No. The reading uses symbols as a reflection tool. It does not present the future as fixed or decide for you." },
      { question: "Can I start without buying?", answer: "Yes. The portal has free readings so you can experience it before choosing a one-off reading." },
      { question: "What do I receive when I buy?", answer: "You receive the complete Urgent Clarity experience in the portal, organised so you can return to it and continue your reflection." },
    ],
    footerNote: "A pause to listen more closely to what is already asking for a name.",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
  },
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getCampaignAttribution(params: Record<string, string | string[] | undefined>) {
  const attribution: Record<string, string> = {};

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = firstParam(params[key])?.trim();
    if (value) attribution[key] = value.slice(0, 120);
  }

  return attribution;
}

async function getCampaignContext(searchParams: SearchParams) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(
    firstParam(params.lang) ?? cookieStore.get(LOCALE_COOKIE_NAME)?.value
  );
  const currency = resolveProductCurrency({
    currency:
      firstParam(params.currency) ??
      normalizeProductCurrency(cookieStore.get(PRODUCT_CURRENCY_COOKIE_NAME)?.value),
    country: requestHeaders.get("x-vercel-ip-country"),
    locale,
  });

  return { locale, currency, attribution: getCampaignAttribution(params) };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { locale } = await getCampaignContext(searchParams);
  const copy = COPY[locale];

  return {
    title: `${copy.eyebrow} | Palavras do Universo`,
    description: copy.lead,
    alternates: { canonical: "/clareza-urgente" },
    openGraph: {
      title: `${copy.eyebrow} | Palavras do Universo`,
      description: copy.lead,
      type: "website",
      url: "https://palavrasdouniverso.com/clareza-urgente",
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.eyebrow} | Palavras do Universo`,
      description: copy.lead,
    },
  };
}

export default async function ClarezaUrgentePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { locale, currency, attribution } = await getCampaignContext(searchParams);
  const price = formatProductPrice("clareza_urgente", currency);

  return (
    <ClarezaUrgenteCampaign
      copy={COPY[locale]}
      locale={locale}
      currency={currency}
      price={price}
      attribution={attribution}
    />
  );
}
