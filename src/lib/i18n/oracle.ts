import type { DailyMessage } from "@/lib/daily/message";
import type { TarotCard } from "@/lib/tarot/cards";
import { normalizeLocale, type Locale } from "./config";

const majorNames: Record<string, string> = {
  "major-00-the-fool": "The Fool",
  "major-01-the-magician": "The Magician",
  "major-02-the-high-priestess": "The High Priestess",
  "major-03-the-empress": "The Empress",
  "major-04-the-emperor": "The Emperor",
  "major-05-the-hierophant": "The Hierophant",
  "major-06-the-lovers": "The Lovers",
  "major-07-the-chariot": "The Chariot",
  "major-08-strength": "Strength",
  "major-09-the-hermit": "The Hermit",
  "major-10-wheel-of-fortune": "Wheel of Fortune",
  "major-11-justice": "Justice",
  "major-12-the-hanged-man": "The Hanged Man",
  "major-13-death": "Death",
  "major-14-temperance": "Temperance",
  "major-15-the-devil": "The Devil",
  "major-16-the-tower": "The Tower",
  "major-17-the-star": "The Star",
  "major-18-the-moon": "The Moon",
  "major-19-the-sun": "The Sun",
  "major-20-judgement": "Judgement",
  "major-21-the-world": "The World",
};

const majorNamesByPortuguese: Record<string, string> = {
  "O Louco": "The Fool",
  "O Mago": "The Magician",
  "A Sacerdotisa": "The High Priestess",
  "A Imperatriz": "The Empress",
  "O Imperador": "The Emperor",
  "O Hierofante": "The Hierophant",
  "Os Enamorados": "The Lovers",
  "O Carro": "The Chariot",
  "A Força": "Strength",
  "O Eremita": "The Hermit",
  "A Roda da Fortuna": "Wheel of Fortune",
  "A Justiça": "Justice",
  "O Enforcado": "The Hanged Man",
  "A Morte": "Death",
  "A Temperança": "Temperance",
  "O Diabo": "The Devil",
  "A Torre": "The Tower",
  "A Estrela": "The Star",
  "A Lua": "The Moon",
  "O Sol": "The Sun",
  "O Julgamento": "Judgement",
  "O Mundo": "The World",
};

const rankNames: Record<string, string> = {
  ace: "Ace",
  two: "Two",
  three: "Three",
  four: "Four",
  five: "Five",
  six: "Six",
  seven: "Seven",
  eight: "Eight",
  nine: "Nine",
  ten: "Ten",
  page: "Page",
  knight: "Knight",
  queen: "Queen",
  king: "King",
};

const suitNames: Record<string, string> = {
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

const rankNamesByPortuguese: Record<string, string> = {
  Ás: "Ace",
  Dois: "Two",
  Três: "Three",
  Quatro: "Four",
  Cinco: "Five",
  Seis: "Six",
  Sete: "Seven",
  Oito: "Eight",
  Nove: "Nine",
  Dez: "Ten",
  Pajem: "Page",
  Cavaleiro: "Knight",
  Rainha: "Queen",
  Rei: "King",
};

const suitNamesByPortuguese: Record<string, string> = {
  Paus: "Wands",
  Copas: "Cups",
  Espadas: "Swords",
  Ouros: "Pentacles",
};

const keywordTranslations: Record<string, string> = {
  abertura: "openness",
  adaptação: "adaptation",
  ação: "action",
  afeto: "affection",
  ajuste: "adjustment",
  alegria: "joy",
  alinhamento: "alignment",
  alívio: "relief",
  amizade: "friendship",
  aprendizado: "learning",
  apego: "attachment",
  aperfeiçoamento: "improvement",
  apoio: "support",
  atenção: "attention",
  autonomia: "autonomy",
  autoridade: "authority",
  avaliação: "assessment",
  avanço: "progress",
  aventura: "adventure",
  base: "foundation",
  busca: "search",
  calma: "calm",
  celebração: "celebration",
  chamado: "calling",
  ciclo: "cycle",
  clareza: "clarity",
  colaboração: "collaboration",
  colheita: "harvest",
  começo: "beginning",
  compaixão: "compassion",
  conclusão: "completion",
  confiança: "trust",
  conflito: "conflict",
  consciência: "awareness",
  consequência: "consequence",
  construção: "building",
  constância: "consistency",
  continuidade: "continuity",
  controle: "control",
  convite: "invitation",
  coragem: "courage",
  corpo: "body awareness",
  cuidado: "care",
  culpa: "guilt",
  cultivo: "cultivation",
  cura: "healing",
  curiosidade: "curiosity",
  custo: "cost",
  decisão: "decision",
  dedicação: "dedication",
  defesa: "protection",
  desapego: "release",
  descanso: "rest",
  desejo: "desire",
  despertar: "awakening",
  direção: "direction",
  discernimento: "discernment",
  disciplina: "discipline",
  discrição: "discretion",
  domínio: "self-mastery",
  dor: "pain",
  doçura: "gentleness",
  encontro: "connection",
  equilíbrio: "balance",
  escassez: "scarcity",
  escolha: "choice",
  espera: "patience",
  esperança: "hope",
  estabilidade: "stability",
  estratégia: "strategy",
  estrutura: "structure",
  estudo: "study",
  expansão: "expansion",
  experimento: "experimentation",
  expressão: "expression",
  família: "family",
  faísca: "spark",
  fertilidade: "growth",
  fim: "completion",
  foco: "focus",
  generosidade: "generosity",
  harmonia: "harmony",
  horizonte: "horizon",
  imaginação: "imagination",
  impasse: "impasse",
  impulso: "impulse",
  insatisfação: "dissatisfaction",
  insônia: "restlessness",
  integração: "integration",
  intuição: "intuition",
  início: "beginning",
  legado: "legacy",
  liberação: "release",
  liberdade: "freedom",
  libertação: "liberation",
  liderança: "leadership",
  limitação: "limitation",
  limite: "boundaries",
  limpeza: "clearing",
  lucidez: "clear sight",
  luto: "grief",
  magnetismo: "magnetism",
  manifestação: "manifestation",
  maturidade: "maturity",
  medo: "fear",
  memória: "memory",
  mensagem: "message",
  merecimento: "worthiness",
  mistério: "mystery",
  movimento: "movement",
  mudança: "change",
  notícia: "news",
  observação: "observation",
  ofício: "craft",
  oportunidade: "opportunity",
  orgulho: "pride",
  paciência: "patience",
  partida: "departure",
  pausa: "pause",
  perda: "loss",
  perspectiva: "perspective",
  pertencimento: "belonging",
  peso: "burden",
  planejamento: "planning",
  plenitude: "fulfillment",
  posição: "position",
  posse: "possession",
  possibilidades: "possibilities",
  prazer: "pleasure",
  preocupação: "worry",
  presença: "presence",
  pressa: "haste",
  prioridade: "priority",
  profundidade: "depth",
  prosperidade: "prosperity",
  proteção: "protection",
  prática: "practice",
  rapidez: "speed",
  razão: "reason",
  realização: "achievement",
  receber: "receiving",
  reciprocidade: "reciprocity",
  recolhimento: "retreat",
  recomeço: "renewal",
  reconhecimento: "recognition",
  recuperação: "recovery",
  renascimento: "renewal",
  rendição: "surrender",
  reorganização: "reorganization",
  reparo: "repair",
  resiliência: "resilience",
  responsabilidade: "responsibility",
  retorno: "return",
  revisão: "review",
  ritmo: "rhythm",
  romance: "romance",
  ruptura: "breakthrough",
  sabedoria: "wisdom",
  satisfação: "satisfaction",
  segurança: "security",
  semente: "seed",
  sensibilidade: "sensitivity",
  silêncio: "silence",
  tensão: "tension",
  ternura: "tenderness",
  tradição: "tradition",
  travessia: "transition",
  troca: "exchange",
  valor: "value",
  verdade: "truth",
  vigilância: "awareness",
  virada: "turning point",
  visão: "vision",
  vínculo: "connection",
  vitalidade: "vitality",
  vitória: "victory",
  vulnerabilidade: "vulnerability",
  ímpeto: "drive",
};

const positionTranslations: Record<string, string> = {
  SITUAÇÃO: "SITUATION",
  OBSTÁCULO: "OBSTACLE",
  DIREÇÃO: "DIRECTION",
};

const energyTranslations: Record<string, string> = {
  "Recomeço silencioso": "Quiet renewal",
  "Clareza em movimento": "Clarity in motion",
  "Cuidado com o próprio centro": "Care for your center",
  "Limite luminoso": "A clear boundary",
  "Sinal no detalhe": "A sign in the details",
  "Coragem serena": "Quiet courage",
  Integração: "Integration",
  "Presença fértil": "Fruitful presence",
  "Desapego gentil": "Gentle release",
  "Escuta profunda": "Deep listening",
  "Alegria possível": "Possible joy",
  "Escolha consciente": "Conscious choice",
  "Confiança em construção": "Building trust",
  "Expansão com raiz": "Rooted expansion",
};

export function getCardEnglishName(key: string, fallback: string) {
  if (majorNames[key]) return majorNames[key];
  const [suit, rank] = key.split("-");
  if (suitNames[suit] && rankNames[rank]) {
    return `${rankNames[rank]} of ${suitNames[suit]}`;
  }
  return fallback;
}

export function getCardEnglishNameFromPortuguese(name: string) {
  if (majorNamesByPortuguese[name]) return majorNamesByPortuguese[name];
  const [rank, suit] = name.split(" de ");
  if (rankNamesByPortuguese[rank] && suitNamesByPortuguese[suit]) {
    return `${rankNamesByPortuguese[rank]} of ${suitNamesByPortuguese[suit]}`;
  }
  return name;
}

export function translateOracleKeyword(keyword: string) {
  return keywordTranslations[keyword.toLowerCase()] ?? keyword;
}

export function translateOraclePosition(position: string, locale: Locale) {
  return locale === "en" ? positionTranslations[position] ?? position : position;
}

const cardMeanings: Record<string, { upright: string; reversed: string }> = {
  // ── Major Arcana ──────────────────────────────────────────────
  "major-00-the-fool": {
    upright: "A clean start is asking for your trust. You move better when you release the need to control what comes next.",
    reversed: "Momentum without direction. You may be mistaking escape for courage right now.",
  },
  "major-01-the-magician": {
    upright: "You already have what you need to begin. The real work now is channelling your energy into one clear action.",
    reversed: "Scattered intention. The will is there, but it loses shape when everything feels equally urgent.",
  },
  "major-02-the-high-priestess": {
    upright: "The answer already lives within you — it just needs silence to emerge. Stop filling the space.",
    reversed: "Inner noise. You are trying to feel with a mind that is running too fast to hear anything.",
  },
  "major-03-the-empress": {
    upright: "Something flourishes when given consistency, beauty, and simple care. Tend to what is quietly growing.",
    reversed: "Giving too much. You may be nurturing everything around you while neglecting your own centre.",
  },
  "major-04-the-emperor": {
    upright: "Bringing structure to your situation will bring more peace than trying to control every outcome.",
    reversed: "Rigidity. A necessary boundary may have become a wall that keeps life out as much as harm.",
  },
  "major-05-the-hierophant": {
    upright: "Seek trustworthy guidance and let lived experience become wisdom you can actually use.",
    reversed: "You may be following an old rule that no longer speaks to who you are now.",
  },
  "major-06-the-lovers": {
    upright: "The right choice asks for alignment between what you desire, what you value, and what you can truly sustain.",
    reversed: "Doubt grows when you try to please a path that never quite fit who you are.",
  },
  "major-07-the-chariot": {
    upright: "Direction becomes clear the moment you stop negotiating with your own hesitation.",
    reversed: "Speed without an axis. Moving forward right now calls for less force and more direction.",
  },
  "major-08-strength": {
    upright: "Your strength today lives in firm gentleness, not in force or imposition.",
    reversed: "The exhaustion of holding everything together. Breathe before your defences turn into aggression.",
  },
  "major-09-the-hermit": {
    upright: "An important answer is forming within you. It needs you to lower the noise around you first.",
    reversed: "Too much withdrawal. Your solitude may be protecting you from pain and from life in equal measure.",
  },
  "major-10-wheel-of-fortune": {
    upright: "The cycle is already moving. Adjust your stance before you try to hold on to what is changing.",
    reversed: "Resistance to the current. Something wants to shift, but you are still negotiating with what was.",
  },
  "major-11-justice": {
    upright: "Clarity, honest agreements, and consequence. What is fair needs to be said with steadiness, not heat.",
    reversed: "Self-deception or imbalance. You may be negotiating a boundary that was never really up for debate.",
  },
  "major-12-the-hanged-man": {
    upright: "Seeing from a different angle will change more than insisting on the same answer.",
    reversed: "Stagnation. The pause has already taught you what it could — now it asks to become a conscious choice.",
  },
  "major-13-death": {
    upright: "Something is ending to free up energy. Not every ending is a loss — some return life to where it belongs.",
    reversed: "Holding on to what has already ended. Transitions hurt longer when you try to return to an old version of yourself.",
  },
  "major-14-temperance": {
    upright: "Blend patience with movement. The path today asks for measure, not intensity.",
    reversed: "Imbalance through excess or lack. Your body is already signalling where you have crossed the line.",
  },
  "major-15-the-devil": {
    upright: "Naming the attachment weakens its hold. What you can see clearly, you can begin to release.",
    reversed: "A seductive pattern may be charging a high price for the illusion of control.",
  },
  "major-16-the-tower": {
    upright: "What falls apart reveals what never had a solid foundation. Rebuild around what is actually true.",
    reversed: "Avoiding the truth only extends the instability. The disruption can be smaller if you stop holding up what is already false.",
  },
  "major-17-the-star": {
    upright: "A quiet light is pointing the way. Trust whatever genuinely restores your sense of calm.",
    reversed: "Discouragement. You may be mistaking a delay for the absence of possibility.",
  },
  "major-18-the-moon": {
    upright: "Not everything that frightens you is a real threat. Observe before you draw conclusions.",
    reversed: "Emotional confusion. Wait for the tide to settle before making decisions from a place of fear.",
  },
  "major-19-the-sun": {
    upright: "Clarity returns when you choose the simple, the alive, and the honest.",
    reversed: "You may be dimming your own light to avoid unsettling people who have grown comfortable with your shadow.",
  },
  "major-20-judgement": {
    upright: "An inner calling is asking for maturity. Answer from what you already know to be true today.",
    reversed: "Old guilt may be occupying the space where present accountability should live.",
  },
  "major-21-the-world": {
    upright: "A cycle finds meaning when you take time to recognise how far you have actually come.",
    reversed: "Something is asking to be properly closed before you expand. Without completion, growth loses its grounding.",
  },
  // ── Wands ────────────────────────────────────────────────────
  "wands-ace": {
    upright: "A spark is asking to be moved. Start small before the inspiration cools into just another idea.",
    reversed: "Trapped energy. The desire is real, but it needs a concrete gesture to become anything.",
  },
  "wands-two": {
    upright: "You have already left the starting point. Now choose where to direct the energy you have built.",
    reversed: "Over-planning may be delaying the first real step. The map is ready — begin.",
  },
  "wands-three": {
    upright: "What you set in motion is beginning to show signs of return. Watch the horizon without abandoning the present.",
    reversed: "Impatience is narrowing your view. The result is coming — it still needs to cross some distance.",
  },
  "wands-four": {
    upright: "Acknowledge a small victory. Security is also built by celebrating what holds steady.",
    reversed: "Difficulty receiving. You may be moving past something too quickly that deserved to be honoured.",
  },
  "wands-five": {
    upright: "The friction shows where energies are misaligned. Not every conflict needs to become a battle.",
    reversed: "Pointless struggle. Choose more carefully where your energy deserves to enter.",
  },
  "wands-six": {
    upright: "Accept recognition without shrinking from it. You arrived here through merit and persistence.",
    reversed: "Fear of being seen. Your humility may be quietly becoming invisibility.",
  },
  "wands-seven": {
    upright: "Defend what matters without explaining yourself to everyone. Some positions require quiet firmness.",
    reversed: "Defensive exhaustion. Check whether you are protecting something real or fighting purely out of habit.",
  },
  "wands-eight": {
    upright: "Something is accelerating. Respond with presence so opportunity does not become chaos.",
    reversed: "Mental haste. Messages and signals become noise when you stop filtering what matters most.",
  },
  "wands-nine": {
    upright: "You are closer to the end of this cycle than you realise. Guard your energy to finish well.",
    reversed: "Defensive exhaustion. Not every approaching person or situation is a threat.",
  },
  "wands-ten": {
    upright: "Carrying everything alone is not a measure of strength. Redistribute the weight before it redistributes you.",
    reversed: "Overload. If you do not let something go willingly, your body will eventually demand the rest.",
  },
  "wands-page": {
    upright: "Allow yourself to experiment before mastering. Curiosity is opening a door worth walking through.",
    reversed: "Anxiety for validation. The idea needs room to breathe before it becomes a demand on yourself.",
  },
  "wands-knight": {
    upright: "The energy to move forward is here. Use speed with intention, not as a way to outrun yourself.",
    reversed: "Impulsivity. Fire is useful when it illuminates; it becomes dangerous when it burns everything.",
  },
  "wands-queen": {
    upright: "Your presence carries power when you take up space without apologising for existing.",
    reversed: "Insecurity wearing the mask of control. Return to your centre before reacting.",
  },
  "wands-king": {
    upright: "Lead by vision, not urgency. A firm decision made from clarity can organise everything around it.",
    reversed: "Impatient authority. Guiding others requires both direction and the ability to genuinely listen.",
  },
  // ── Cups ─────────────────────────────────────────────────────
  "cups-ace": {
    upright: "A new feeling is asking for space. Receive what is being born without demanding it take an immediate shape.",
    reversed: "An over-guarded heart. The emotion is real but may be held back by fear of truly opening.",
  },
  "cups-two": {
    upright: "A bond grows stronger when there is genuine listening on both sides.",
    reversed: "Imbalance in the exchange. See whether you are trying to sustain alone something that was meant to be shared.",
  },
  "cups-three": {
    upright: "Joy expands when it is shared. Seek out those who remind you how to breathe with ease.",
    reversed: "Too much dispersal. Not every social connection feeds what you are trying to protect.",
  },
  "cups-four": {
    upright: "Not every answer arrives with immediate appeal. Look at what you have not yet been willing to receive.",
    reversed: "Emotional withdrawal. An opportunity may be passing unnoticed because it arrived too quietly.",
  },
  "cups-five": {
    upright: "Honour what hurt, but do not let the loss obscure what still remains standing.",
    reversed: "Attention fixed on what was lost. The heart needs time — but it also needs a horizon to face.",
  },
  "cups-six": {
    upright: "A memory can bring healing when you look at it with both tenderness and the distance of maturity.",
    reversed: "Too much nostalgia. The past may seem safer than it actually was.",
  },
  "cups-seven": {
    upright: "Many visions are floating before you. Choose by what sustains your peace, not only by what enchants you.",
    reversed: "Fantasy without grounding. Too many desires become fog when none of them receives real direction.",
  },
  "cups-eight": {
    upright: "Walking away can also be an act of honesty with your own soul.",
    reversed: "Fear of leaving. You may be staying somewhere that no longer genuinely nourishes you.",
  },
  "cups-nine": {
    upright: "Allow yourself to acknowledge an achievement without immediately searching for the next gap to fill.",
    reversed: "Pleasure without depth. Something may look sufficient on the surface while quietly asking for more presence.",
  },
  "cups-ten": {
    upright: "A scene of peace is built from available affection, consistent presence, and small honest choices.",
    reversed: "Idealising happiness. Be careful not to demand perfection from bonds that are, by nature, human.",
  },
  "cups-page": {
    upright: "A delicate emotion wants to be heard. Meet it with gentleness, not with a rush to explain it away.",
    reversed: "Immature sensitivity. A small reaction may be carrying the weight of an older, unresolved feeling.",
  },
  "cups-knight": {
    upright: "Speaking what you feel can open a path, as long as it comes with presence and truth.",
    reversed: "Beautiful promises without follow-through. Charm needs to walk alongside action to be real.",
  },
  "cups-queen": {
    upright: "Your sensitivity is a compass. Care for what you feel without absorbing everything around you.",
    reversed: "Boundless empathy. Holding space for others does not mean carrying pain that is not yours.",
  },
  "cups-king": {
    upright: "Feel deeply and respond with calm. Emotional maturity has a way of organising everything around it.",
    reversed: "Rigid emotional control. Shutting down feeling in order to appear strong is also a way of distancing yourself from life.",
  },
  // ── Swords ───────────────────────────────────────────────────
  "swords-ace": {
    upright: "A simple truth cuts through the confusion. Name what needs to be seen.",
    reversed: "Thinking that has become too sharp. Clarity without care can harden into cruelty.",
  },
  "swords-two": {
    upright: "The decision asks for silence and honesty. Looking away from both options does not make the choice disappear.",
    reversed: "Blockage. You may be confusing neutrality with the fear of taking a position.",
  },
  "swords-three": {
    upright: "A pain that is acknowledged begins to lose its power. Be gentle with what you are crossing through.",
    reversed: "A wound reopened. Replaying the scene in your mind may be the very thing delaying relief.",
  },
  "swords-four": {
    upright: "The mind needs retreat in order to see clearly again. Rest is not avoidance — it is preparation.",
    reversed: "Accumulated fatigue. Ignoring the need for stillness turns ordinary noise into real exhaustion.",
  },
  "swords-five": {
    upright: "Before winning an argument, ask yourself what that victory would actually cost you.",
    reversed: "Conflict without real gain. The need to be right may be pushing away the peace you actually want.",
  },
  "swords-six": {
    upright: "The way out may be quiet, but it is still a way out. Allow yourself to cross to calmer waters.",
    reversed: "Resistance to moving on. Staying in the familiar may be costing you more than the change ever would.",
  },
  "swords-seven": {
    upright: "Not everything needs to be announced. Choose strategy without abandoning your integrity.",
    reversed: "Avoidance. Part of the truth may be hidden — including from yourself.",
  },
  "swords-eight": {
    upright: "The most confining prison may be the story you keep telling yourself. Look for the small opening.",
    reversed: "Mental paralysis. You likely have more choice available than anxiety is allowing you to see.",
  },
  "swords-nine": {
    upright: "Your mind is trying to protect you through excess. Bring the fear into the present moment and breathe.",
    reversed: "Spiralling thoughts. Not every worry is a signal — some are simply exhaustion asking to be cared for.",
  },
  "swords-ten": {
    upright: "A limit has been reached. The end of a prolonged struggle can be the beginning of real relief.",
    reversed: "Attachment to the low point. Replaying the fall keeps delaying the rebuilding.",
  },
  "swords-page": {
    upright: "Investigate with calm curiosity. A small piece of information can organise a much larger decision.",
    reversed: "Anxious vigilance. Gathering more information does not always lead to better understanding.",
  },
  "swords-knight": {
    upright: "The mental force to move forward is here. Choose your direction carefully before accelerating.",
    reversed: "Acting on impulse. Words spoken too quickly can open wounds that take a long time to close.",
  },
  "swords-queen": {
    upright: "Speak the truth with elegance. A clear boundary, delivered well, can be an act of deep care.",
    reversed: "Defensive coldness. Clear sight loses its power when it becomes distance from everything you feel.",
  },
  "swords-king": {
    upright: "Decide with broad vision and precise words. A steady mind leads better than a reactive one.",
    reversed: "Rational control. You may be using logic as a way of avoiding an emotion that deserves real attention.",
  },
  // ── Pentacles ─────────────────────────────────────────────────
  "pentacles-ace": {
    upright: "A concrete possibility begins small. Plant it with patience and consistent attention.",
    reversed: "A seed without tending. The opportunity is real, but it needs routine care to take root.",
  },
  "pentacles-two": {
    upright: "Adjust your pace. Not everything needs to be carried at the same intensity right now.",
    reversed: "Excessive juggling. Flexibility should not become the abandonment of your own needs.",
  },
  "pentacles-three": {
    upright: "The path gains quality when you combine real skill, genuine listening, and good partnership.",
    reversed: "Misalignment. Building together requires aligning expectations before moving forward.",
  },
  "pentacles-four": {
    upright: "Protect what matters, but leave room for life to flow through.",
    reversed: "Attachment to control. The fear of losing may be blocking what could otherwise be received.",
  },
  "pentacles-five": {
    upright: "You do not need to cross through this outside and alone. Look for support that is real and available.",
    reversed: "Isolation through shame. Asking for help can itself be an act of genuine strength.",
  },
  "pentacles-six": {
    upright: "Giving and receiving need to find measure. Notice where the balance is asking to be adjusted.",
    reversed: "Imbalance in helping. Generosity without boundaries can quietly become emotional debt.",
  },
  "pentacles-seven": {
    upright: "What you have planted needs time and honest assessment. Not everything blooms at the pace of desire.",
    reversed: "Impatience with the process. Cutting too early may prevent the fruit from appearing at all.",
  },
  "pentacles-eight": {
    upright: "Careful repetition transforms intention into mastery. Keep refining — the work is worth it.",
    reversed: "Perfectionism. Improving is useful; punishing yourself for every detail steals energy from the work itself.",
  },
  "pentacles-nine": {
    upright: "Recognise the value of what you have built. Autonomy also deserves to be genuinely enjoyed.",
    reversed: "Rigid self-sufficiency. Needing no one can quietly become its own form of loneliness.",
  },
  "pentacles-ten": {
    upright: "Think about what endures. A mature choice today may sustain many tomorrows beyond your own.",
    reversed: "Security without soul. Stability loses its meaning when it becomes only an inherited obligation.",
  },
  "pentacles-page": {
    upright: "Learn with humility and consistency. A practical beginning is worth more than a perfect idea.",
    reversed: "Material distraction. The plan needs to leave the imagination and gain a concrete method.",
  },
  "pentacles-knight": {
    upright: "Move at the pace that sustains. Quiet progress is still movement — and often far more durable.",
    reversed: "Slowness from fear. Be careful not to name as prudence what has actually become stagnation.",
  },
  "pentacles-queen": {
    upright: "Tend to the concrete world with tenderness. Your body and your home are also speaking to you.",
    reversed: "Excess care directed outward. Nurturing everything around you is not a substitute for returning to yourself.",
  },
  "pentacles-king": {
    upright: "Build with calm, ethics, and long-term vision. What is truly solid grows from consistency.",
    reversed: "Attachment to outcomes. True security does not require hardening the heart.",
  },
};

export function localizeTarotCard<T extends TarotCard>(card: T, localeInput: string): T {
  const locale = normalizeLocale(localeInput);
  if (locale !== "en") return card;

  const keywords = card.keywords.map(translateOracleKeyword);
  const meanings = cardMeanings[card.key];
  const lead = keywords[0] ?? "clarity";

  return {
    ...card,
    name: getCardEnglishName(card.key, card.name),
    keywords,
    upright: meanings?.upright ?? `This card invites you to bring ${lead} into the situation with honesty and presence.`,
    reversed: meanings?.reversed ?? `Reversed, examine where ${lead} may be blocked, rushed, or shaped by fear.`,
  };
}

export function localizeDailyMessage(message: DailyMessage, localeInput: string): DailyMessage {
  const locale = normalizeLocale(localeInput);
  if (locale !== "en") return message;

  const spread = message.spread.map((item) => {
    const keyword = translateOracleKeyword(item.keyword);
    return {
      ...item,
      position: translateOraclePosition(item.position, locale) as DailyMessage["spread"][number]["position"],
      name: getCardEnglishNameFromPortuguese(item.name),
      keyword,
      meaning: item.reversed
        ? `Notice where ${keyword} may be blocked or driven by fear. Give yourself time before reacting.`
        : `Let ${keyword} guide one honest and grounded choice today.`,
    };
  });
  const focus = spread[2]?.keyword ?? spread[0]?.keyword ?? "clarity";

  return {
    ...message,
    energy: energyTranslations[message.energy] ?? "A moment of clarity",
    message:
      "Something within you is asking for attention without urgency. Let this message be a pause to notice what is true before choosing what comes next.",
    advice: `Choose one small action that brings more ${focus} into your day.`,
    affirmation: "I can listen to myself with honesty and move with calm.",
    reflection: `What would change if I allowed ${focus} to guide my next step?`,
    ritual:
      "Take three slow breaths, write down one honest sentence, and choose one action you can complete today.",
    spread,
  };
}
