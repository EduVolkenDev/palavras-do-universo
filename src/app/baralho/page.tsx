"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Layers3,
  MoonStar,
  Search,
  Sparkles,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TAROT_CARD_CATALOG,
  type TarotSuit,
} from "@/lib/tarot/cardCatalog";
import { CARDS } from "@/lib/tarot/cards";
import { usePduAtmosphere } from "@/lib/ui/usePduAtmosphere";
import { useI18n } from "@/components/I18nProvider";
import { localizeTarotCard } from "@/lib/i18n/oracle";

type FilterId = "all" | "major" | TarotSuit;
type DeckCard = (typeof TAROT_CARD_CATALOG)[number] & {
  detail: (typeof CARDS)[number];
};

const suitLabels: Record<TarotSuit, string> = {
  wands: "Paus",
  cups: "Copas",
  swords: "Espadas",
  pentacles: "Ouros",
};

const suitTones: Record<TarotSuit, string> = {
  wands: "border-[#f4d58d]/28 bg-[#f4d58d]/10 text-[#f5d896]",
  cups: "border-[#d2818b]/28 bg-[#d2818b]/10 text-[#f1b8bd]",
  swords: "border-[#8fb8e8]/28 bg-[#8fb8e8]/10 text-[#b7d7ff]",
  pentacles: "border-[#a7d7c5]/28 bg-[#a7d7c5]/10 text-[#bdebdc]",
};

const filterIcons: Record<FilterId, LucideIcon> = {
  all: Layers3,
  major: MoonStar,
  wands: Sparkles,
  cups: Wand2,
  swords: Search,
  pentacles: CheckCircle2,
};

const deck: DeckCard[] = TAROT_CARD_CATALOG.map((shell) => {
  const detail = CARDS.find((card) => card.key === shell.key);
  if (!detail) return null;
  return { ...shell, detail };
}).filter((card): card is DeckCard => card !== null);

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "major", label: "Maiores" },
  { id: "wands", label: "Paus" },
  { id: "cups", label: "Copas" },
  { id: "swords", label: "Espadas" },
  { id: "pentacles", label: "Ouros" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getFilterCount(filter: FilterId) {
  if (filter === "all") return deck.length;
  if (filter === "major") {
    return deck.filter((card) => card.arcana === "major").length;
  }

  return deck.filter((card) => card.suit === filter).length;
}

function getCardGroup(card: DeckCard) {
  if (card.arcana === "major") return "Arcano maior";
  return card.suit ? suitLabels[card.suit] : "Arcano menor";
}

const stats = [
  { label: "Cartas conectadas", value: deck.length },
  { label: "Arcanos maiores", value: getFilterCount("major") },
  { label: "Arcanos menores", value: deck.length - getFilterCount("major") },
];

function getCardTone(card: DeckCard) {
  if (card.arcana === "major") {
    return "border-[#f4d58d]/28 bg-[#f4d58d]/10 text-[#f5d896]";
  }

  return card.suit ? suitTones[card.suit] : suitTones.wands;
}

export default function BaralhoPage() {
  const { locale } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardOriginRef = useRef<{ x: number; y: number; scale: number } | null>(null);

  const openCard = useCallback((card: DeckCard, cardEl?: HTMLElement | null) => {
    if (cardEl) {
      const r = cardEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dialogW = Math.min(512, vw * 0.95);
      cardOriginRef.current = {
        x: r.left + r.width / 2 - vw / 2,
        y: r.top + r.height / 2 - vh / 2,
        scale: r.width / dialogW,
      };
    } else {
      cardOriginRef.current = null;
    }
    setSelectedCard(card);
  }, []);

  const closeCard = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Abre o dialog após React commitar o conteúdo (corrige mobile) e dá tempo
  // para a animação de invocação atingir o pico antes do hero transition.
  useEffect(() => {
    if (!selectedCard) return;
    const id = setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const o = cardOriginRef.current;
      if (o) {
        dialog.style.setProperty("--hero-x", `${o.x.toFixed(1)}px`);
        dialog.style.setProperty("--hero-y", `${o.y.toFixed(1)}px`);
        dialog.style.setProperty("--hero-scale", `${o.scale.toFixed(3)}`);
      }
      dialog.showModal();
    }, 220);
    return () => clearTimeout(id);
  }, [selectedCard]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCard();
    };
    const onClose = () => setSelectedCard(null);
    dialog.addEventListener("keydown", onKeyDown);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      dialog.removeEventListener("close", onClose);
    };
  }, [closeCard]);

  usePduAtmosphere();

  const localizedDeck = useMemo(
    () =>
      deck.map((card) => {
        const localized = localizeTarotCard(card.detail, locale);
        return { ...card, name: localized.name, detail: localized };
      }),
    [locale]
  );

  const filteredDeck = useMemo(() => {
    const term = normalize(query.trim());

    return localizedDeck.filter((card) => {
      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "major"
            ? card.arcana === "major"
            : card.suit === activeFilter;

      if (!matchesFilter) return false;
      if (!term) return true;

      const haystack = normalize(
        [
          card.name,
          card.key,
          getCardGroup(card),
          card.detail.keywords.join(" "),
          card.detail.upright,
          card.detail.reversed,
        ].join(" ")
      );

      return haystack.includes(term);
    });
  }, [activeFilter, localizedDeck, query]);

  return (
    <main className="pdu-home min-h-screen text-[#f8efe2]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09080d]/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-[#efe2d2] hover:border-[#f4d58d]/45"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>

          <div className="hidden items-center gap-2 text-sm text-[#cfc4b9] sm:flex">
            <Sparkles size={16} className="text-[#f5d896]" />
            Biblioteca do Baralho
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="pdu-veil" />
        <div className="pdu-reveal relative z-10 mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f4d58d]/25 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-normal text-[#f5d896] backdrop-blur">
                <MoonStar size={14} />
                biblioteca simbólica
              </p>
              <h1 className="brand-serif max-w-3xl text-5xl font-semibold leading-none text-[#fff7e8] sm:text-6xl">
                Baralho completo para consultar com calma.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#d8ccc0]">
                Explore as 78 cartas, seus símbolos, palavras-chave e leituras
                direta e reversa. Use esta biblioteca como um espelho antes ou
                depois de abrir uma leitura.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[8px] border border-white/12 bg-white/[0.06] p-4 backdrop-blur"
                >
                  <p className="text-3xl font-semibold text-[#fff7e8]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[#cfc4b9]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[8px] border border-white/12 bg-[#111019]/72 p-4 shadow-[0_34px_110px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <label className="relative block">
                <span className="sr-only">
                  Buscar por carta, naipe ou palavra-chave
                </span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8d837b]"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por carta, naipe, palavra-chave..."
                  enterKeyHint="search"
                  className="h-12 w-full rounded-full border border-white/12 bg-black/24 py-3 pl-11 pr-4 text-sm text-[#fff7e8] outline-none placeholder:text-[#8d837b] focus:border-[#f4d58d]/70 focus:ring-2 focus:ring-[#f4d58d]/10"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const Icon = filterIcons[filter.id];
                  const active = activeFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      aria-label={`Filtrar por ${filter.label}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${
                        active
                          ? "border-[#f4d58d] bg-[#f4d58d] text-[#1c1308]"
                          : "border-white/12 bg-white/[0.05] text-[#d8ccc0] hover:border-[#f4d58d]/45"
                      }`}
                    >
                      <Icon size={15} />
                      {filter.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                          active ? "bg-black/12" : "bg-white/10"
                        }`}
                      >
                        {getFilterCount(filter.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-20 sm:px-6 lg:px-8">
        <div className="pdu-deck-veil" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#cfc4b9]">
            <p>
              Mostrando{" "}
              <span className="font-semibold text-[#fff7e8]">
                {filteredDeck.length}
              </span>{" "}
              cartas
            </p>
            <p className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#a7d7c5]" />
              Artes e significados em harmonia
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDeck.map((card, index) => (
              <article
                key={card.key}
                data-suit={card.arcana === "major" ? "major" : (card.suit ?? "major")}
                style={{ "--pdu-stagger": index % 8 } as React.CSSProperties}
                className="pdu-deck-card pdu-scroll-reveal group relative overflow-hidden rounded-[8px] border border-white/12 bg-white/[0.055] shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur"
                onMouseMove={(e) => {
                  const el = e.currentTarget;
                  // Sem transition no transform durante rastreamento — evita o lag "chasing cursor"
                  el.style.transition = "border-color 280ms ease, box-shadow 280ms ease";
                  const r = el.getBoundingClientRect();
                  const cx = (e.clientX - r.left) / r.width - 0.5;
                  const cy = (e.clientY - r.top) / r.height - 0.5;
                  el.style.setProperty("--rx", `${(-cy * 11).toFixed(1)}deg`);
                  el.style.setProperty("--ry", `${(cx * 11).toFixed(1)}deg`);
                  el.style.setProperty("--mx", `${((cx + 0.5) * 100).toFixed(1)}%`);
                  el.style.setProperty("--my", `${((cy + 0.5) * 100).toFixed(1)}%`);
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  // Spring suave de retorno ao neutro
                  el.style.transition = "transform 650ms cubic-bezier(0.2, 0, 0.1, 1), border-color 280ms ease, box-shadow 280ms ease";
                  el.style.setProperty("--rx", "0deg");
                  el.style.setProperty("--ry", "0deg");
                }}
              >
                <button
                  type="button"
                  aria-label={`Ver detalhes de ${card.name}`}
                  onClick={(e) => {
                    const article = (e.currentTarget as HTMLElement).closest<HTMLElement>("article");
                    if (article) {
                      article.classList.add("pdu-deck-card--summoning");
                      setTimeout(() => article.classList.remove("pdu-deck-card--summoning"), 900);
                    }
                    openCard(card, article);
                  }}
                  className="absolute inset-0 z-10 cursor-pointer rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d58d]/60"
                />
                <div className="relative aspect-[5/8] bg-black/20">
                  <Image
                    src={card.assetPath}
                    alt={card.name}
                    width={520}
                    height={832}
                    priority={index < 8}
                    className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.025]"
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getCardTone(
                        card
                      )}`}
                    >
                      {getCardGroup(card)}
                    </span>
                    <span className="font-mono text-xs text-[#8d837b]">
                      {String(card.detail.id).padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="brand-serif text-2xl font-semibold text-[#fff7e8]">
                    {card.name}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {card.detail.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-[#d8ccc0]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-[#d8ccc0]">
                    <p>
                      <span className="font-semibold text-[#f5d896]">
                        Direta:
                      </span>{" "}
                      {card.detail.upright}
                    </p>
                    <p>
                      <span className="font-semibold text-[#f1b8bd]">
                        Reversa:
                      </span>{" "}
                      {card.detail.reversed}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredDeck.length === 0 ? (
            <div className="rounded-[8px] border border-white/12 bg-white/[0.055] p-8 text-center text-[#d8ccc0]">
              <p>Nenhuma carta encontrada para essa busca.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveFilter("all");
                }}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[#f4d58d]/35 px-4 py-2 text-sm font-semibold text-[#fff3df] hover:border-[#f4d58d]/70"
              >
                Limpar filtros
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Card detail modal */}
      <dialog
        ref={dialogRef}
        onClick={(e) => { if (e.target === dialogRef.current) closeCard(); }}
        className="pdu-card-dialog m-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[12px] border border-white/14 bg-[#0f0e19] p-0 text-[#f8efe2] shadow-[0_40px_140px_rgba(0,0,0,0.7)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {selectedCard ? (
          <div className="pdu-card-modal-content">
            <div className="relative aspect-[5/7] bg-black/30">
              <Image
                src={selectedCard.assetPath}
                alt={selectedCard.name}
                width={520}
                height={728}
                className="h-full w-full object-contain p-4"
              />
              <button
                type="button"
                onClick={closeCard}
                aria-label="Fechar"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/12 bg-black/50 text-[#d8ccc0] hover:border-[#f4d58d]/50 hover:text-[#f4d58d]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <div className="pdu-modal-meta flex items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getCardTone(selectedCard)}`}>
                    {getCardGroup(selectedCard)}
                  </span>
                  <h2 className="brand-serif mt-3 text-3xl font-semibold text-[#fff7e8]">
                    {selectedCard.name}
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#8d837b]">
                  {String(selectedCard.detail.id).padStart(2, "0")}
                </span>
              </div>
              <div className="pdu-modal-keywords mt-4 flex flex-wrap gap-1.5">
                {selectedCard.detail.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-[#d8ccc0]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="pdu-modal-meanings mt-5 space-y-4 text-sm leading-7 text-[#d8ccc0]">
                <div className="rounded-[8px] border border-[#f4d58d]/20 bg-[#f4d58d]/[0.06] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#f5d896]">Direta</p>
                  <p>{selectedCard.detail.upright}</p>
                </div>
                <div className="rounded-[8px] border border-[#d2818b]/20 bg-[#d2818b]/[0.06] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#f1b8bd]">Reversa</p>
                  <p>{selectedCard.detail.reversed}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </main>
  );
}
