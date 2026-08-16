import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizeLocale } from "@/lib/i18n/config";
import { translations } from "@/lib/i18n/translations";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { productCards } from "@/lib/product/catalog";
import { SPREADS, type SpreadType } from "@/lib/tarot/spreads";

const PREMIUM_SPREAD_TYPES = [
  "diamond",
  "flying_bird",
  "the_key",
  "mirror",
  "celtic_cross",
  "relating",
  "paradox",
] as const satisfies readonly SpreadType[];

type PremiumSpreadType = (typeof PREMIUM_SPREAD_TYPES)[number];

type PageDetail = {
  accent: string;
  glow: string;
  asset: string;
  eyebrow: string;
  opening: string;
  passage: string;
  ritual: string;
  signature: string;
};

const PAGE_DETAILS: Record<PremiumSpreadType, PageDetail> = {
  diamond: {
    accent: "#bde8ff",
    glow: "rgba(123, 102, 255, 0.34)",
    asset: PDU_ASSETS.spreads.diamond,
    eyebrow: "Clareza prismática",
    opening: "Uma pergunta, observada por cinco ângulos até que o excesso perca força.",
    passage: "O Diamante não corre para responder. Ele separa o que nasce dentro, o que chega de fora e o ponto em que a questão pode finalmente ser integrada.",
    ritual: "Escreva uma única pergunta. Retire dela qualquer tentativa de controlar outra pessoa e preserve apenas aquilo que está realmente em suas mãos.",
    signature: "A clareza aparece quando as camadas deixam de competir.",
  },
  flying_bird: {
    accent: "#8ff7e8",
    glow: "rgba(65, 216, 207, 0.31)",
    asset: PDU_ASSETS.spreads.flyingBird,
    eyebrow: "Movimento com altitude",
    opening: "Sete posições para reconhecer o medo sem entregar a ele o comando do voo.",
    passage: "O Pássaro Voando diferencia impulso, receptividade e ação. A leitura cresce como duas asas: uma escuta o campo; a outra sustenta o movimento.",
    ritual: "Antes de abrir as cartas, solte os ombros e complete: eu estaria pronta ou pronto para avançar se não precisasse provar nada a ninguém.",
    signature: "Voar não é negar o medo; é mudar a relação com ele.",
  },
  the_key: {
    accent: "#f8d878",
    glow: "rgba(255, 188, 79, 0.3)",
    asset: PDU_ASSETS.spreads.key,
    eyebrow: "Abertura interior",
    opening: "Oito camadas para dar linguagem ao que atua em silêncio e encontrar uma abertura real.",
    passage: "A Chave percorre superfície, raiz, consciência e recurso sem transformar hipótese simbólica em diagnóstico. O objetivo é destrancar escolha.",
    ritual: "Traga um padrão que se repete. Em vez de perguntar por que ele existe, pergunte o que você precisa reconhecer para responder de outro modo.",
    signature: "Nem toda porta pede força. Algumas pedem nome.",
  },
  mirror: {
    accent: "#e8d9ff",
    glow: "rgba(190, 142, 255, 0.31)",
    asset: PDU_ASSETS.spreads.mirror,
    eyebrow: "Reflexo relacional",
    opening: "Doze cartas diante de um vínculo: o que é encontro, o que é projeção e o que é escolha sua.",
    passage: "O Espelho preserva a complexidade das relações sem alegar saber o que o outro pensa. Ele devolve necessidade, limite, conversa e responsabilidade ao centro.",
    ritual: "Nomeie a relação sem escrever o nome da outra pessoa. Depois pergunte: que parte deste encontro pertence à minha consciência e à minha ação?",
    signature: "O reflexo mais útil não invade o outro; devolve você a si.",
  },
  celtic_cross: {
    accent: "#c9d5ff",
    glow: "rgba(85, 116, 224, 0.3)",
    asset: PDU_ASSETS.spreads.celticCross,
    eyebrow: "Mapa de grande amplitude",
    opening: "Dez cartas para uma questão que não cabe em uma resposta curta.",
    passage: "A Cruz Celta organiza presente, tensão, raízes, campo e horizonte. A leitura agrupa as forças do mapa para que profundidade não vire ruído.",
    ritual: "Escolha uma questão de fase, não cinco perguntas ao mesmo tempo. Escreva o que já sabe, o que teme e o que ainda não consegue nomear.",
    signature: "Quando o mapa se amplia, a prioridade precisa ficar mais simples.",
  },
  relating: {
    accent: "#ffbad9",
    glow: "rgba(255, 102, 170, 0.27)",
    asset: PDU_ASSETS.spreads.relationship,
    eyebrow: "Vínculo consciente",
    opening: "Quatro posições para olhar duas presenças e o campo que nasce entre elas.",
    passage: "Relacionar é uma experiência de reciprocidade e limite. Ela observa como você participa do vínculo e qual consciência pode tornar o encontro mais íntegro.",
    ritual: "Respire e formule uma pergunta que comece com como eu posso. Isso mantém a leitura no território da maturidade, não do controle.",
    signature: "Entre duas pessoas existe um terceiro campo: a relação.",
  },
  paradox: {
    accent: "#ffcb91",
    glow: "rgba(205, 85, 255, 0.3)",
    asset: PDU_ASSETS.spreads.paradox,
    eyebrow: "Integração de contrários",
    opening: "Cinco cartas para quando duas verdades parecem incompatíveis, mas ambas pedem escuta.",
    passage: "O Paradoxo não decide qual lado merece existir. Ele encontra a tensão, cria um ponto de silêncio e abre um terceiro olhar que antes não estava disponível.",
    ritual: "Escreva as duas frases que disputam espaço em você. Não tente conciliá-las. Apenas reconheça o que cada uma tenta proteger.",
    signature: "Algumas respostas só aparecem quando a contradição pode respirar.",
  },
};

function isPremiumSpreadType(value: SpreadType): value is PremiumSpreadType {
  return PREMIUM_SPREAD_TYPES.includes(value as PremiumSpreadType);
}

function translateMetadataText(value: string, localeInput: string) {
  return normalizeLocale(localeInput) === "en" ? translations.en[value] ?? value : value;
}

export function generateStaticParams() {
  return PREMIUM_SPREAD_TYPES.map((type) => ({ slug: SPREADS[type].slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = normalizeLocale((await searchParams)?.lang);
  const spread = Object.values(SPREADS).find((item) => item.slug === slug);

  if (!spread || !isPremiumSpreadType(spread.type)) return {};

  const title = `${translateMetadataText(spread.label, locale)} | Palavras do Universo`;
  const description = translateMetadataText(spread.promise, locale);

  return {
    title,
    description,
    alternates: { canonical: `/tiradas/${spread.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function SpreadExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spread = Object.values(SPREADS).find((item) => item.slug === slug);

  if (!spread || !isPremiumSpreadType(spread.type)) notFound();

  const detail = PAGE_DETAILS[spread.type];
  const product = productCards.find((item) => item.productKey === spread.productKey);
  if (!product) notFound();

  const visualStyle = {
    "--pdu-spread-accent": detail.accent,
    "--pdu-spread-glow": detail.glow,
  } as CSSProperties;

  return (
    <main
      className={`pdu-spread-experience ${spread.visualClass}`}
      style={visualStyle}
    >
      <div className="pdu-spread-experience__grain" aria-hidden="true" />
      <header className="pdu-spread-experience__nav">
        <Link href="/tiradas" className="pdu-spread-experience__back">
          <ArrowLeft size={16} />
          Todas as tiradas
        </Link>
        <Link href="/" className="pdu-spread-experience__brand">
          <Image src={PDU_ASSETS.brand.symbol} alt="" width={36} height={36} />
          <span>Palavras do Universo</span>
        </Link>
        <span className="pdu-spread-experience__access">Incluída no Círculo</span>
      </header>

      <section className="pdu-spread-experience__hero">
        <div className="pdu-spread-experience__copy">
          <p className="pdu-spread-experience__eyebrow">
            <Sparkles size={14} />
            {detail.eyebrow}
          </p>
          <h1>{spread.label}</h1>
          <p className="pdu-spread-experience__opening">{detail.opening}</p>
          <p className="pdu-spread-experience__passage">{detail.passage}</p>

          <div className="pdu-spread-experience__actions">
            <Link
              href={`/?product=${encodeURIComponent(spread.productKey)}#leitura`}
              className="pdu-spread-experience__primary"
            >
              Abrir esta tirada
              <ArrowRight size={17} />
            </Link>
            <Link href="/#circulo" className="pdu-spread-experience__secondary">
              Conhecer o Círculo
            </Link>
          </div>

          <div className="pdu-spread-experience__facts">
            <span><strong>{spread.positions.length}</strong> posições</span>
            <span><strong>1</strong> pergunta central</span>
            <span><strong>∞</strong> nuances possíveis</span>
          </div>
        </div>

        <div className="pdu-spread-experience__stage" aria-label={`Mapa visual de ${spread.label}`}>
          <div className="pdu-spread-experience__halo" aria-hidden="true" />
          <Image
            src={detail.asset}
            alt=""
            width={900}
            height={900}
            priority
            className="pdu-spread-experience__artifact"
          />
          <ol className="pdu-spread-experience__constellation">
            {spread.positions.map((position, index) => (
              <li
                key={position.key}
                className="pdu-spread-experience__position"
                style={{
                  "--pdu-position-delay": `${160 + index * 70}ms`,
                  "--pdu-sheen-delay": `${1000 + index * 260}ms`,
                } as CSSProperties}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{position.label}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pdu-spread-experience__positions-section">
        <div className="pdu-spread-experience__section-copy">
          <p>Arquitetura da leitura</p>
          <h2>Cada posição existe por uma razão.</h2>
          <blockquote>{detail.signature}</blockquote>
        </div>
        <ol className="pdu-spread-experience__position-list">
          {spread.positions.map((position, index) => (
            <li key={position.key}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{position.label}</strong>
                <p>{position.hint}</p>
              </div>
              <CircleCheck size={17} aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      <section id="preparar-pergunta" className="pdu-spread-experience__ritual">
        <div>
          <p>Antes de abrir</p>
          <h2>Prepare a pergunta, não a resposta.</h2>
        </div>
        <p>{detail.ritual}</p>
        <Link href={`/?product=${encodeURIComponent(spread.productKey)}#leitura`}>
          Entrar na experiência
          <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="pdu-spread-experience__footer">
        <span>Palavras do Universo · leitura simbólica sem fatalismo</span>
        <Link href="/tiradas">Explorar outras tiradas</Link>
      </footer>
    </main>
  );
}
