"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { TAROT_CARD_CATALOG } from "@/lib/tarot/cardCatalog";
import { getLocalizedTarotCardPageData, getTarotCardGroup } from "@/lib/tarot/card-page";
import type { TarotCardEditorial } from "@/lib/tarot/editorial/types";
import styles from "./TarotCardMeaningContent.module.css";

type Props = { cardKey: string; editorial: TarotCardEditorial };

export function TarotCardMeaningContent({ cardKey, editorial }: Props) {
  const { locale } = useI18n();
  const english = locale === "en";
  const card = getLocalizedTarotCardPageData(cardKey, locale);
  if (!card) return null;
  const copy = english ? editorial.en : editorial.pt;
  const related = getLocalizedTarotCardPageData(editorial.relatedKey, locale);
  const index = TAROT_CARD_CATALOG.findIndex((item) => item.key === card.key);
  const previous = index > 0 ? getLocalizedTarotCardPageData(TAROT_CARD_CATALOG[index - 1].key, locale) : null;
  const next = index < TAROT_CARD_CATALOG.length - 1 ? getLocalizedTarotCardPageData(TAROT_CARD_CATALOG[index + 1].key, locale) : null;
  const headings = {
    artwork: english ? `Reading the artwork of ${card.name}` : `Os símbolos na arte: ${card.name}`,
    upright: english ? `${card.name} upright: how to interpret it` : `${card.name} na posição direta: como interpretar`,
    reversed: english ? `${card.name} reversed: tensions and possibilities` : `${card.name} na posição reversa: tensões e possibilidades`,
    example: english ? `${card.name} in an everyday situation` : `${card.name} em uma situação cotidiana`,
    comparison: english ? `${card.name} and ${related?.name}: different emphases` : `${card.name} e ${related?.name}: diferenças na leitura`,
  };

  return (
    <main className={`pdu-home ${styles.page}`} lang={locale} data-i18n-ignore>
      <article className={styles.article}>
        <div className="pdu-veil" aria-hidden="true" />
        <div className={styles.container}>
          <nav aria-label={english ? "Breadcrumb" : "Navegação estrutural"} className={styles.breadcrumb}>
            <Link href="/">Portal</Link><span aria-hidden="true">/</span>
            <Link href="/significados/tarot">{english ? "Tarot card meanings" : "Significados do tarot"}</Link>
            <span aria-hidden="true">/</span><span aria-current="page">{card.name}</span>
          </nav>
          <header className={styles.hero}>
            <div className={styles.art}>
              {/* These WebP files are already compressed; Vinext's image route only redirects to the same asset. */}
              <Image src={card.assetPath} alt={english ? `${card.name} tarot card artwork` : `Arte da carta ${card.name}`} width={700} height={980} priority unoptimized />
            </div>
            <div>
              <p className={styles.eyebrow}><Sparkles size={15} aria-hidden="true" />{getTarotCardGroup(card, locale)}</p>
              <h1 className={`brand-serif ${styles.title}`}>{card.name}</h1>
              <p className={styles.lead}>{card.detail.guide.core}</p>
              <ul className={styles.keywords} aria-label={english ? "Keywords" : "Palavras-chave"}>
                {card.detail.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}
              </ul>
              <p className={styles.byline}>{english ? "Editorial content: Palavras do Universo · AI-assisted writing" : "Conteúdo editorial: Palavras do Universo · elaboração assistida por IA"}</p>
            </div>
          </header>
          <nav className={styles.contents} aria-label={english ? "In this card guide" : "Neste guia da carta"}>
            <span>{english ? "Explore this guide" : "Explore este guia"}</span>
            <a href="#arte">{english ? "Artwork" : "Arte e símbolos"}</a>
            <a href="#direta">{english ? "Upright" : "Posição direta"}</a>
            <a href="#reversa">{english ? "Reversed" : "Posição reversa"}</a>
            <a href="#exemplo">{english ? "Everyday example" : "Exemplo cotidiano"}</a>
            <a href="#comparacao">{english ? "Compare cards" : "Compare as cartas"}</a>
          </nav>
          <div className={styles.reading}>
            <section id="arte" className={styles.section} aria-labelledby="arte-titulo">
              <p className={styles.eyebrow}>{english ? "Look before interpreting" : "Olhar antes de interpretar"}</p>
              <h2 id="arte-titulo" className="brand-serif">{headings.artwork}</h2>
              <p>{copy.artwork}</p>
              <p className={styles.caption}>{english ? "A symbolic reading of this deck's actual artwork, not a claim about the artist's intention or a literal prediction." : "Leitura simbólica da arte deste baralho, não uma afirmação sobre a intenção do artista nem uma previsão literal."}</p>
            </section>
            <div className={styles.positions}>
              <section id="direta" className={`${styles.section} ${styles.upright}`} aria-labelledby="direta-titulo">
                <p className={styles.eyebrow}>{english ? "Expression and movement" : "Expressão e movimento"}</p>
                <h2 id="direta-titulo" className="brand-serif">{headings.upright}</h2>
                <p>{copy.upright}</p>
              </section>
              <section id="reversa" className={`${styles.section} ${styles.reversed}`} aria-labelledby="reversa-titulo">
                <p className={styles.eyebrow}>{english ? "What deserves attention" : "O que merece atenção"}</p>
                <h2 id="reversa-titulo" className="brand-serif">{headings.reversed}</h2>
                <p>{copy.reversed}</p>
              </section>
            </div>
            <p className={styles.method}>{english ? "A reversed card is not automatically negative, nor does an upright card guarantee a favourable outcome. Read the position alongside the question, surrounding cards and actual circumstances; none gives access to someone else's private thoughts." : "Uma carta reversa não é automaticamente negativa, e uma carta direta não garante um resultado favorável. Considere a pergunta, as outras cartas e as circunstâncias reais; nenhuma posição dá acesso aos pensamentos privados de outra pessoa."}</p>
            <section id="exemplo" className={styles.section} aria-labelledby="exemplo-titulo">
              <p className={styles.eyebrow}>{english ? "From symbol to experience" : "Do símbolo à experiência"}</p>
              <h2 id="exemplo-titulo" className="brand-serif">{headings.example}</h2>
              <p>{copy.example}</p>
              <p className={styles.caption}>{english ? "An illustrative situation, not a personal reading or a recommended outcome for everyone." : "Situação ilustrativa, não uma leitura pessoal nem uma resposta indicada para todos."}</p>
            </section>
            {related && <section id="comparacao" className={styles.section} aria-labelledby="comparacao-titulo">
              <p className={styles.eyebrow}>{english ? "Similar themes, distinct questions" : "Temas próximos, perguntas diferentes"}</p>
              <h2 id="comparacao-titulo" className="brand-serif">{headings.comparison}</h2>
              <p>{copy.comparison}</p>
              <Link className={styles.textLink} href={`/significados/tarot/${related.key}`}>{english ? `Read the guide to ${related.name}` : `Leia o guia de ${related.name}`}<ArrowRight size={16} aria-hidden="true" /></Link>
            </section>}
            <section className={`${styles.section} ${styles.question}`} aria-labelledby="pergunta-titulo">
              <h2 id="pergunta-titulo">{english ? `A question to take from ${card.name}` : `Uma pergunta para levar de ${card.name}`}</h2>
              <p className="brand-serif">{card.detail.guide.question}</p>
              <p className={styles.caption}>{english ? "The meaning is a starting point for reflection, not a verdict on your future. Your decisions remain yours; a reading does not replace qualified health, legal or financial support." : "O significado é um ponto de partida para reflexão, não uma sentença sobre seu futuro. Suas decisões continuam sendo suas; uma leitura não substitui apoio qualificado de saúde, jurídico ou financeiro."}</p>
            </section>
            <aside className={styles.editorialNote} aria-labelledby="editorial-titulo">
              <h2 id="editorial-titulo">{english ? "Editorial responsibility and reading approach" : "Responsabilidade editorial e abordagem da leitura"}</h2>
              <p>{english ? "Content under the editorial identity of Palavras do Universo. This text was prepared with AI assistance, using the deck's displayed artwork as a visual reference. Human review of this version has not yet been recorded. Interpretations are reflective possibilities, not established facts about your life or claims to know the artist's intention." : "Conteúdo sob a identidade editorial do Palavras do Universo. Texto elaborado com assistência de IA, usando como referência visual a arte exibida neste baralho. A revisão humana desta versão ainda não foi registrada. As interpretações são possibilidades de reflexão, não fatos comprovados sobre sua vida nem afirmações sobre a intenção do artista."}</p>
            </aside>
          </div>
          <div className={styles.actions}>
            <Link href="/tiradas" className={styles.primaryLink}>{english ? "Try a free reading" : "Fazer uma leitura gratuita"}<ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href="/significados/tarot" className={styles.secondaryLink}>{english ? "Explore all 78 card guides" : "Explore os guias das 78 cartas"}<BookOpen size={16} aria-hidden="true" /></Link>
          </div>
          <nav aria-label={english ? "Previous and next card" : "Carta anterior e próxima"} className={styles.pagination}>
            {previous ? <Link href={`/significados/tarot/${previous.key}`}><ArrowLeft size={16} aria-hidden="true" />{previous.name}</Link> : <span />}
            {next ? <Link href={`/significados/tarot/${next.key}`}>{next.name}<ArrowRight size={16} aria-hidden="true" /></Link> : null}
          </nav>
        </div>
      </article>
    </main>
  );
}
