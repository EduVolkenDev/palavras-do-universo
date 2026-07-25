/**
 * Canonical visual inventory for the Palavras do Universo experience.
 *
 * Keeping these paths in one place prevents the homepage from drifting back
 * into a mix of legacy `/icons` and generic `/assets` references.
 */
export const PDU_ASSETS = {
  brand: {
    mark: "/assets/palavrasuniverso.webp",
  },
  icons: {
    book: "/assets/pdu-icon-book.webp",
    bookmark: "/assets/pdu-icon-bookmark.webp",
    readingCards: "/assets/cards.webp",
    heart: "/assets/pdu-icon-heart.webp",
    meditation: "/assets/pdu-icon-meditation.webp",
    moon: "/assets/pdu-icon-moon.webp",
    shield: "/assets/pdu-icon-shield.webp",
    sprout: "/assets/pdu-icon-sprout.webp",
  },
  editorial: {
    crystal: "/assets/CRYSTAL.webp",
    key: "/assets/key.webp",
    mirror: "/assets/mirror.webp",
    portal: "/assets/portal.webp",
  },
  ambient: {
    allConnected: "/assets/allconnected.webp",
    candle: "/assets/candle.webp",
    mandala: "/assets/mandalaspecial.webp",
  },
  products: {
    messageOfTheDay: "/assets/product-mensagem-do-dia.webp",
    cardOfTheDay: "/assets/product-carta-do-dia.webp",
    urgentClarity: "/assets/product-clareza-urgente.webp",
    threeCardPath: "/assets/product-caminho-das-3-cartas.webp",
    loveSignals: "/assets/product-sinais-do-amor.webp",
    weekEnergy: "/assets/product-energia-da-semana.webp",
    momentMap: "/assets/product-mapa-do-momento.webp",
  },
} as const;
