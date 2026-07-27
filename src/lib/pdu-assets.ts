/**
 * Canonical visual inventory for the Palavras do Universo experience.
 *
 * Keeping these paths in one place prevents the homepage from drifting back
 * into a mix of legacy `/icons` and generic `/assets` references.
 */
export const PDU_ASSETS = {
  brand: {
    symbol: "/assets/palavras-symbol.webp",
    mark: "/assets/palavrasuniverso-1600.webp",
    markDesktop: "/assets/palavrasuniverso-1600.webp",
    markMobile: "/assets/palavrasuniverso-mobile.webp",
  },
  icons: {
    book: "/assets/pdu-icon-book.webp",
    bookmark: "/assets/pdu-icon-bookmark.webp",
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
    loveSignals: "/assets/pdu-heart.webp",
    weekEnergy: "/assets/pdu-ciclos.webp",
    momentMap: "/assets/pdu-target.webp",
  },
  surfaces: {
    account: "/assets/palavras-symbol.webp",
    legalPrivacy: "/assets/pdu-icon-shield.webp",
    legalTerms: "/assets/pdu-icon-book.webp",
    legalRefunds: "/assets/pdu-icon-bookmark.webp",
    voucherInvite: "/assets/pdu-icon-sprout.webp",
    voucherDiscount: "/assets/pdu-icon-shield.webp",
    voucherAccess: "/assets/pdu-icon-moon.webp",
    action: "/assets/pdu-icon-sprout.webp",
    actionComplete: "/assets/pdu-icon-shield.webp",
    access: "/assets/pdu-icon-shield.webp",
    readings: "/assets/pdu-icon-book.webp",
    saved: "/assets/pdu-icon-bookmark.webp",
    movement: "/assets/pdu-icon-sprout.webp",
    profile: "/assets/pdu-icon-meditation.webp",
    map: "/assets/pdu-icon-moon.webp",
  },
} as const;
