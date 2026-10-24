"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { requestLumeOpen } from "@/components/LumeGuide";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { LUME_VISUAL_ASSETS } from "@/lib/lume/assets";
import { appendMarketingAttribution, normalizeMarketingAttribution } from "@/lib/marketing/attribution";
import HomeFeedback from "./HomeFeedback";
import VoucherCodeEntry from "@/components/vouchers/VoucherCodeEntry";
import styles from "./HomePortal.module.css";

export default function HomePortal({ navigationParams }: { navigationParams: Record<string, string> }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const text = (pt: string, english: string) => en ? english : pt;
  const href = (path: string) => {
    const url = new URL(path, "https://palavrasdouniverso.com");
    url.searchParams.set("lang", en ? "en" : "pt");
    if (navigationParams.currency) url.searchParams.set("currency", navigationParams.currency);
    appendMarketingAttribution(url.searchParams, normalizeMarketingAttribution(navigationParams));
    return `${url.pathname}${url.search}${url.hash}`;
  };
  const areas = [
    {
      title: text("Tarot", "Tarot"),
      description: text("Abra uma carta para hoje ou escolha uma leitura para a sua pergunta.", "Open a card for today or choose a reading for your question."),
      action: text("Explorar o tarot", "Explore tarot"),
      href: "/tiradas",
      art: PDU_ASSETS.homepage.spreadsShowcase,
    },
    {
      title: text("Astrologia", "Astrology"),
      description: text("Conheça seu mapa de nascimento e acompanhe os trânsitos do seu céu.", "Explore your birth chart and follow your sky’s transits."),
      action: text("Explorar a astrologia", "Explore astrology"),
      href: "/astrologia",
      art: PDU_ASSETS.astrology.mapHero,
    },
    {
      title: text("Meu Universo", "My Universe"),
      description: text("Reencontre suas leituras e as cartas e práticas que você escolheu guardar.", "Revisit your readings and the cards and practices you chose to save."),
      action: text("Ver meus registros", "View my saved experiences"),
      href: "/meu-universo",
      art: PDU_ASSETS.homepage.savedMessagesBookmark,
    },
    {
      title: text("Rituais do Universo", "Universe rituals"),
      description: text("Faça uma pausa guiada e escolha uma ação de cuidado. Sem tiragem de cartas.", "Take a guided pause and choose a caring action. No card draw."),
      action: text("Escolher uma prática", "Choose a practice"),
      href: "/lab",
      art: PDU_ASSETS.homepage.completedActionsChecklist,
    },
  ];

  return (
    <div className={styles.portal}>
      <a className={styles.skip} href="#conteudo">{text("Pular para o conteúdo", "Skip to content")}</a>
      <header className={styles.header}>
        <Link href={href("/")} aria-label="Palavras do Universo" className={styles.wordmark}>
          <Image src={PDU_ASSETS.brand.headerWordmark} alt="Palavras do Universo" width={230} height={58} priority />
        </Link>
        <nav className={styles.navigation} aria-label={text("Navegação principal", "Main navigation")}>
          <details className={styles.explore}>
            <summary>{text("Explorar", "Explore")}<ChevronDown size={15} aria-hidden="true" /></summary>
            <div className={styles.exploreMenu}>
              <Link href={href("/tiradas")}>{text("Tarot e tiradas", "Tarot readings")}</Link>
              <Link href={href("/carta-do-dia")}>{text("Carta do Dia", "Card of the Day")}</Link>
              <Link href={href("/astrologia")}>{text("Astrologia", "Astrology")}</Link>
              <Link href={href("/lab")}>{text("Rituais do Universo", "Universe rituals")}</Link>
              <Link href={href("/significados/tarot")}>{text("Significados das cartas", "Card meanings")}</Link>
              <Link href={href("/meu-universo")}>{text("Meu Universo", "My Universe")}</Link>
            </div>
          </details>
          <Link className={styles.accountLink} href={href("/meu-universo")}>{text("Meu Universo", "My Universe")}</Link>
          <Link className={styles.headerCta} href={href("/leitura?product=clareza_urgente")}>
            {text("Quero clareza urgente", "I need clarity now")}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main id="conteudo">
        <section id="topo" className={styles.hero} aria-labelledby="portal-title">
          <div>
            <p className={styles.eyebrow}>{text("PALAVRAS DO UNIVERSO", "WORDS OF THE UNIVERSE")}</p>
            <h1 id="portal-title">{text("O que você quer olhar com mais calma hoje?", "What would you like to see more clearly today?")}</h1>
            <p className={styles.intro}>{text("Tarot, astrologia e práticas para refletir sobre o seu momento. Escolha por onde começar.", "Tarot, astrology and practices to reflect on your life right now. Choose where to begin.")}</p>
            <Link className={styles.primary} href={href("/carta-do-dia")}>
              {text("Abrir minha carta grátis", "Open my free card")}<ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className={styles.hint}>{text("Sem cadastro. Sem precisar escrever uma pergunta.", "No account. No need to write a question.")}</p>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <Image src={PDU_ASSETS.brand.markDesktop} alt="" width={560} height={560} priority sizes="(max-width: 700px) 180px, 36vw" />
          </div>
        </section>

        <section id="areas" className={styles.areas} aria-labelledby="areas-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{text("CADA ESPAÇO, UM PROPÓSITO", "A PURPOSE FOR EACH SPACE")}</p>
            <h2 id="areas-title">{text("Escolha o seu caminho.", "Choose your path.")}</h2>
          </div>
          <div className={styles.grid}>
            {areas.map((area) => (
              <Link key={area.href} href={href(area.href)} className={styles.area}>
                <Image src={area.art} alt="" width={160} height={160} className={styles.areaArt} sizes="(max-width: 600px) 96px, 140px" />
                <div>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <span className={styles.areaAction}>{area.action}<ArrowRight size={17} aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.lume} aria-labelledby="lume-title">
          <Image src={LUME_VISUAL_ASSETS.welcome.src} alt="" width={96} height={120} />
          <div>
            <p className={styles.eyebrow}>{text("ASSISTENTE DE INTELIGÊNCIA ARTIFICIAL", "ARTIFICIAL INTELLIGENCE ASSISTANT")}</p>
            <h2 id="lume-title">{text("Prazer, Lume.", "Meet Lume.")}</h2>
            <p>{text("Posso explicar as experiências e ajudar você a explorar os símbolos da sua leitura. Não leio pensamentos nem determino o futuro.", "I can explain the experiences and help you explore your reading’s symbols. I cannot read minds or determine the future.")}</p>
          </div>
          <button type="button" onClick={requestLumeOpen} className={styles.secondary}>{text("Conversar com a Lume", "Talk to Lume")}<ArrowRight size={17} aria-hidden="true" /></button>
        </section>

        <HomeFeedback />
      </main>

      <footer className={styles.footer}>
        <nav aria-label={text("Mais informações", "More information")}>
          <Link href={href("/significados/tarot")}>{text("Significados das cartas", "Card meanings")}</Link>
          <Link href={href("/tiradas")}>{text("Tiradas e valores", "Readings and prices")}</Link>
          <Link href={href("/#circulo")}>{text("Planos do Círculo", "Circle plans")}</Link>
          <Link href={href("/termos")}>{text("Termos de uso", "Terms of use")}</Link>
          <Link href={href("/privacidade")}>{text("Privacidade", "Privacy")}</Link>
          <Link href={href("/reembolsos")}>{text("Cancelamentos e reembolsos", "Cancellations and refunds")}</Link>
        </nav>
        <details className={styles.voucher} open={navigationParams.voucher !== undefined || navigationParams.codigo !== undefined ? true : undefined}>
          <summary>{text("Tenho um voucher ou convite", "I have a voucher or invitation")}</summary>
          <VoucherCodeEntry />
        </details>
        <p>{text("Orientação simbólica para reflexão e entretenimento. Não substitui acompanhamento médico, psicológico, jurídico ou financeiro.", "Symbolic guidance for reflection and entertainment. Not a substitute for medical, psychological, legal or financial advice.")}</p>
        <p>{text("© Palavras do Universo", "© Words of the Universe")}</p>
      </footer>
    </div>
  );
}
