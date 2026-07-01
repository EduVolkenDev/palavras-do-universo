export type ProfessionalPricingModel = "fixed" | "social" | "free" | "quote";
export type ProfessionalAvailability = "available" | "limited" | "closed";
export type ProfessionalOfferStatus = "draft" | "published" | "paused";
export type InquiryStatus = "new" | "reviewing" | "accepted" | "declined" | "closed";

export type ProfessionalOfferDraft = {
  id?: string;
  title: string;
  description: string;
  category: string;
  pricingModel: ProfessionalPricingModel;
  priceCents: number | null;
  socialPriceCents: number | null;
  currency: string;
  durationMinutes: number | null;
  acceptsFree: boolean;
  acceptsSocial: boolean;
  status: ProfessionalOfferStatus;
  sortOrder: number;
};

export type ProfessionalProfileDraft = {
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  city: string;
  country: string;
  avatarUrl: string;
  specialties: string[];
  languages: string[];
  modalities: string[];
  availability: ProfessionalAvailability;
  isPublished: boolean;
  isVerified: boolean;
  responseTime: string;
};

export type PublicProfessionalOffer = {
  id: string;
  title: string;
  description: string;
  category: string;
  pricingModel: ProfessionalPricingModel;
  priceCents: number | null;
  socialPriceCents: number | null;
  currency: string;
  durationMinutes: number | null;
  acceptsFree: boolean;
  acceptsSocial: boolean;
  status: ProfessionalOfferStatus;
  sortOrder: number;
};

export type PublicProfessionalProfile = {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  city: string;
  country: string;
  avatarUrl: string;
  specialties: string[];
  languages: string[];
  modalities: string[];
  availability: ProfessionalAvailability;
  isPublished: boolean;
  isVerified: boolean;
  responseTime: string;
  createdAt: string;
  updatedAt: string;
  offers: PublicProfessionalOffer[];
  offerCount: number;
  pricingSignals: {
    paid: boolean;
    social: boolean;
    free: boolean;
  };
  priceSummary: string;
};

export type PublicProfessionalInquiry = {
  id: string;
  offerId: string;
  providerUserId: string;
  clientId: string | null;
  clientName: string;
  replyEmail: string;
  subject: string;
  brief: string;
  budget: string | null;
  timeline: string | null;
  status: InquiryStatus;
  createdAt: string;
};

export type ProfessionalMarketplaceResponse = {
  ok: true;
  professionals: PublicProfessionalProfile[];
  total: number;
  source: "database" | "seed";
};

export type ProfessionalMarketplaceFilters = {
  query?: string;
  specialty?: string;
  access?: string;
  availability?: string;
  limit?: number;
};

const SEED_AVATAR = "/assets/palavrasuniverso.webp";

export const PROFESSIONAL_MARKETPLACE_SEED: PublicProfessionalProfile[] = [
  {
    id: "seed-1",
    userId: "seed-1",
    handle: "marina-luz",
    displayName: "Marina Luz",
    headline: "Tarologia terapêutica para clareza emocional e decisões limpas.",
    bio: "Atende pessoas que precisam respirar, entender o que pesa e olhar vínculos com mais honestidade. Trabalha com escuta, leitura simbólica e orientação prática.",
    city: "Lisboa",
    country: "PT",
    avatarUrl: SEED_AVATAR,
    specialties: ["Tarot", "Relacionamentos", "Clareza emocional"],
    languages: ["Português", "English"],
    modalities: ["Online"],
    availability: "available",
    isPublished: true,
    isVerified: true,
    responseTime: "Resposta em até 24h",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    offers: [
      {
        id: "seed-1-offer-1",
        title: "Sessão de clareza afetiva",
        description: "Leitura focada em vínculo, limites e próximo passo afetivo.",
        category: "Afeto",
        pricingModel: "fixed",
        priceCents: 12900,
        socialPriceCents: 7900,
        currency: "BRL",
        durationMinutes: 50,
        acceptsFree: false,
        acceptsSocial: true,
        status: "published",
        sortOrder: 10,
      },
      {
        id: "seed-1-offer-2",
        title: "Vagas sociais da semana",
        description: "Atendimentos com valor reduzido para pessoas que precisam de acesso possível.",
        category: "Acesso social",
        pricingModel: "social",
        priceCents: null,
        socialPriceCents: 4500,
        currency: "BRL",
        durationMinutes: 40,
        acceptsFree: false,
        acceptsSocial: true,
        status: "published",
        sortOrder: 20,
      },
    ],
    offerCount: 2,
    pricingSignals: { paid: true, social: true, free: false },
    priceSummary: "A partir de R$ 79 social",
  },
  {
    id: "seed-2",
    userId: "seed-2",
    handle: "andre-portal",
    displayName: "André Portal",
    headline: "Mentoria energética e estratégica para fases de transição.",
    bio: "Atua com presença, organização de processos internos e rituais práticos para quem está recomeçando ou atravessando mudanças importantes.",
    city: "São Paulo",
    country: "BR",
    avatarUrl: SEED_AVATAR,
    specialties: ["Mentoria", "Espiritualidade", "Transições"],
    languages: ["Português"],
    modalities: ["Online", "Presencial"],
    availability: "limited",
    isPublished: true,
    isVerified: false,
    responseTime: "Resposta em até 48h",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    offers: [
      {
        id: "seed-2-offer-1",
        title: "Acompanhamento de travessia",
        description: "Sessão para momentos de mudança, dúvida e reorganização pessoal.",
        category: "Acompanhamento",
        pricingModel: "fixed",
        priceCents: 15900,
        socialPriceCents: 9900,
        currency: "BRL",
        durationMinutes: 60,
        acceptsFree: false,
        acceptsSocial: true,
        status: "published",
        sortOrder: 10,
      },
    ],
    offerCount: 1,
    pricingSignals: { paid: true, social: true, free: false },
    priceSummary: "R$ 159 por sessão",
  },
  {
    id: "seed-3",
    userId: "seed-3",
    handle: "sofia-espiral",
    displayName: "Sofia Espiral",
    headline: "Escuta terapêutica com acolhimento e algumas vagas gratuitas.",
    bio: "Trabalha com acesso social e gratuito quando possível, priorizando acolhimento, presença e um processo claro para quem está sem margem financeira.",
    city: "Porto",
    country: "PT",
    avatarUrl: SEED_AVATAR,
    specialties: ["Terapia", "Acolhimento", "Valor social"],
    languages: ["Português", "Español"],
    modalities: ["Online"],
    availability: "available",
    isPublished: true,
    isVerified: true,
    responseTime: "Resposta em até 12h",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    offers: [
      {
        id: "seed-3-offer-1",
        title: "Sessões com valor social",
        description: "Atendimento com preço acessível para ampliar o cuidado.",
        category: "Acesso social",
        pricingModel: "social",
        priceCents: null,
        socialPriceCents: 5500,
        currency: "BRL",
        durationMinutes: 50,
        acceptsFree: false,
        acceptsSocial: true,
        status: "published",
        sortOrder: 10,
      },
      {
        id: "seed-3-offer-2",
        title: "Atendimento gratuito em agenda solidária",
        description: "Vagas gratuitas limitadas, abertas por escolha da profissional.",
        category: "Solidário",
        pricingModel: "free",
        priceCents: 0,
        socialPriceCents: 0,
        currency: "BRL",
        durationMinutes: 40,
        acceptsFree: true,
        acceptsSocial: false,
        status: "published",
        sortOrder: 20,
      },
    ],
    offerCount: 2,
    pricingSignals: { paid: false, social: true, free: true },
    priceSummary: "Vagas gratuitas e valor social",
  },
  {
    id: "seed-4",
    userId: "seed-4",
    handle: "lara-orbita",
    displayName: "Lara Órbita",
    headline: "Leituras simbólicas, rituais de fase e cuidado intuitivo.",
    bio: "Atende quem quer interpretar ciclos, reorganizar energia e transformar sensações difusas em gesto concreto. Mantém parte da agenda aberta para valor social.",
    city: "Belo Horizonte",
    country: "BR",
    avatarUrl: SEED_AVATAR,
    specialties: ["Ritual", "Tarot", "Ciclos"],
    languages: ["Português"],
    modalities: ["Online"],
    availability: "available",
    isVerified: false,
    isPublished: true,
    responseTime: "Resposta em até 24h",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    offers: [
      {
        id: "seed-4-offer-1",
        title: "Leitura de fase",
        description: "Uma leitura para nomear o ciclo atual e decidir o próximo passo.",
        category: "Leitura",
        pricingModel: "fixed",
        priceCents: 10900,
        socialPriceCents: 6900,
        currency: "BRL",
        durationMinutes: 45,
        acceptsFree: false,
        acceptsSocial: true,
        status: "published",
        sortOrder: 10,
      },
    ],
    offerCount: 1,
    pricingSignals: { paid: true, social: true, free: false },
    priceSummary: "R$ 109 por leitura",
  },
];

export function trimText(value: unknown, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function toStringList(value: unknown, limit = 8) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => trimText(item, 80)).filter(Boolean).slice(0, limit);
}

export function toBool(value: unknown) {
  return Boolean(value);
}

export function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }
  return null;
}

export function normalizeHandle(value: unknown) {
  return trimText(value, 80)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizePricingModel(value: unknown): ProfessionalPricingModel {
  const normalized = trimText(value, 20).toLowerCase();
  if (normalized === "fixed" || normalized === "social" || normalized === "free" || normalized === "quote") {
    return normalized;
  }
  return "quote";
}

export function normalizeAvailability(value: unknown): ProfessionalAvailability {
  const normalized = trimText(value, 20).toLowerCase();
  if (normalized === "available" || normalized === "limited" || normalized === "closed") {
    return normalized;
  }
  return "available";
}

export function formatBRL(cents: number | null) {
  if (cents === null || cents === undefined) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getOfferPriceLabel(offer: PublicProfessionalOffer) {
  if (offer.pricingModel === "free") return "Gratuito";
  if (offer.pricingModel === "social") {
    return offer.socialPriceCents ? `Social · ${formatBRL(offer.socialPriceCents)}` : "Valor social";
  }
  if (offer.pricingModel === "quote") return "Sob consulta";
  return offer.priceCents ? formatBRL(offer.priceCents) : "Sob consulta";
}

export function getProfilePriceSummary(profile: {
  offers: PublicProfessionalOffer[];
}) {
  const firstPaid = profile.offers.find((offer) => offer.pricingModel === "fixed" && typeof offer.priceCents === "number");
  const firstSocial = profile.offers.find((offer) => offer.pricingModel === "social" && typeof offer.socialPriceCents === "number");
  const hasFree = profile.offers.some((offer) => offer.pricingModel === "free" || offer.acceptsFree);

  if (firstFreeMessage(hasFree, firstSocial, firstPaid)) {
    return firstFreeMessage(hasFree, firstSocial, firstPaid);
  }

  return "Sob consulta";
}

function firstFreeMessage(
  hasFree: boolean,
  firstSocial?: PublicProfessionalOffer,
  firstPaid?: PublicProfessionalOffer
) {
  if (hasFree) return "Inclui atendimento gratuito";
  if (firstSocial?.socialPriceCents) return `A partir de ${formatBRL(firstSocial.socialPriceCents)} social`;
  if (firstPaid?.priceCents) return `A partir de ${formatBRL(firstPaid.priceCents)}`;
  return "";
}

export function buildProfileSummary(profile: PublicProfessionalProfile) {
  const priceSummary = getProfilePriceSummary(profile);
  const paid = profile.offers.some((offer) => offer.pricingModel === "fixed" || offer.pricingModel === "quote");
  const social = profile.offers.some((offer) => offer.pricingModel === "social" || offer.acceptsSocial);
  const free = profile.offers.some((offer) => offer.pricingModel === "free" || offer.acceptsFree);

  return {
    ...profile,
    pricingSignals: {
      paid,
      social,
      free,
    },
    priceSummary,
  };
}

export function applyMarketplaceFilters(
  professionals: PublicProfessionalProfile[],
  filters: ProfessionalMarketplaceFilters
) {
  const query = trimText(filters.query, 120).toLowerCase();
  const specialty = trimText(filters.specialty, 60).toLowerCase();
  const access = trimText(filters.access, 20).toLowerCase();
  const availability = trimText(filters.availability, 20).toLowerCase();

  return professionals.filter((profile) => {
    const haystack = [
      profile.displayName,
      profile.headline,
      profile.bio,
      profile.city,
      profile.country,
      ...profile.specialties,
      ...profile.languages,
      ...profile.modalities,
      ...profile.offers.map((offer) => `${offer.title} ${offer.description} ${offer.category}`),
    ]
      .join(" ")
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (specialty && !profile.specialties.some((item) => item.toLowerCase().includes(specialty))) return false;
    if (availability && profile.availability !== availability) return false;

    if (access) {
      const hasPaid = profile.pricingSignals.paid;
      const hasSocial = profile.pricingSignals.social;
      const hasFree = profile.pricingSignals.free;
      if (access === "paid" && !hasPaid) return false;
      if (access === "social" && !hasSocial) return false;
      if (access === "free" && !hasFree) return false;
    }

    return true;
  });
}

export function clampMarketplaceLimit(value: unknown, fallback = 12) {
  const parsed = typeof value === "string" ? Number(value) : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), 24);
}
