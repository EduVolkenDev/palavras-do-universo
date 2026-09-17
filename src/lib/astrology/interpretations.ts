import type { NatalAspectType, NatalBody, ZodiacSign } from "./natal-chart";

export type AstrologyLocale = "pt-BR" | "en";

type Localized<T> = { pt: T; en: T };

export type BodyInterpretation = {
  label: string;
  archetype: string;
  explanation: string;
  inLife: string;
  question: string;
};

export type SignInterpretation = {
  label: string;
  element: string;
  mode: string;
  tone: string;
  gifts: string;
  tension: string;
  question: string;
};

export type HouseInterpretation = {
  label: string;
  area: string;
  explanation: string;
  question: string;
};

export type AspectInterpretation = {
  label: string;
  explanation: string;
  experience: string;
  question: string;
};

const bodyInterpretations: Record<NatalBody, Localized<BodyInterpretation>> = {
  Sun: {
    pt: {
      label: "Sol",
      archetype: "identidade, vitalidade e direção",
      explanation: "O Sol fala da parte de você que quer se tornar consciente, autora da própria vida e reconhecida pelo que tem de singular. Ele não é apenas o seu signo de nascimento: é a fonte de presença, vontade e coerência que você vai construindo ao longo do tempo.",
      inLife: "No cotidiano, ele aparece na maneira como você assume espaço, escolhe um caminho e sente que está vivendo de acordo com quem é. O signo mostra o estilo dessa expressão; a casa mostra onde ela precisa ganhar forma.",
      question: "Onde eu posso agir com mais presença, sem precisar representar um papel?",
    },
    en: {
      label: "Sun",
      archetype: "identity, vitality, and direction",
      explanation: "The Sun speaks about the part of you that wants to become conscious, author its own life, and be recognized for what is singular. It is not only a birth sign: it is the source of presence, will, and coherence you build over time.",
      inLife: "In daily life, it appears in the way you take up space, choose a path, and feel aligned with who you are. The sign shows the style of that expression; the house shows where it needs to take shape.",
      question: "Where can I act with more presence without performing a role?",
    },
  },
  Moon: {
    pt: {
      label: "Lua",
      archetype: "necessidades emocionais, memória e pertencimento",
      explanation: "A Lua descreve o que o seu corpo e a sua vida emocional precisam para se sentir seguros. Ela fala dos ritmos que você absorveu cedo, da forma como reage antes de pensar e do tipo de cuidado que permite que você relaxe e se reorganize.",
      inLife: "No cotidiano, ela aparece nos hábitos que restauram você, na forma de receber intimidade e naquilo que pode ser sentido como casa. O signo mostra como você procura acolhimento; a casa mostra em que área essa necessidade se torna mais viva.",
      question: "Que tipo de cuidado me devolve para mim quando o mundo fica barulhento?",
    },
    en: {
      label: "Moon",
      archetype: "emotional needs, memory, and belonging",
      explanation: "The Moon describes what your body and emotional life need in order to feel safe. It speaks about early rhythms you absorbed, how you react before thinking, and the kind of care that lets you soften and reorganize.",
      inLife: "In daily life, it appears in the habits that restore you, how you receive intimacy, and what can feel like home. The sign shows how you seek comfort; the house shows where that need becomes most alive.",
      question: "What kind of care brings me back to myself when the world gets loud?",
    },
  },
  Mercury: {
    pt: {
      label: "Mercúrio",
      archetype: "pensamento, linguagem e aprendizagem",
      explanation: "Mercúrio mostra como você organiza informações, dá nome ao que percebe e cria pontes com outras pessoas. Ele não descreve apenas inteligência: fala do seu ritmo mental, da sua curiosidade e do modo como uma ideia vira conversa ou decisão.",
      inLife: "No cotidiano, ele aparece na maneira como você pergunta, escreve, escuta e muda de perspectiva. O signo indica o tom do pensamento; a casa mostra os assuntos que mais ocupam a sua mente.",
      question: "Que palavra mais precisa poderia tornar o que sinto mais compreensível?",
    },
    en: {
      label: "Mercury",
      archetype: "thought, language, and learning",
      explanation: "Mercury shows how you organize information, name what you perceive, and build bridges with other people. It is not only about intelligence: it describes your mental pace, curiosity, and the way an idea becomes conversation or decision.",
      inLife: "In daily life, it appears in how you ask, write, listen, and change perspective. The sign indicates the tone of thought; the house shows the subjects that occupy your mind most.",
      question: "What more precise word could make what I feel easier to understand?",
    },
  },
  Venus: {
    pt: {
      label: "Vênus",
      archetype: "afeto, prazer, valores e vínculo",
      explanation: "Vênus fala do que você reconhece como bonito, valioso e digno de aproximação. Ela descreve a sua linguagem de afeto, mas também o modo como escolhe, aprecia, negocia e cria reciprocidade sem abandonar o próprio valor.",
      inLife: "No cotidiano, aparece no que desperta desejo, no tipo de presença que você oferece e nos acordos que fazem uma relação florescer. O signo mostra o seu gosto afetivo; a casa revela onde você quer cultivar beleza e troca.",
      question: "O que eu valorizo o suficiente para cuidar com constância?",
    },
    en: {
      label: "Venus",
      archetype: "affection, pleasure, values, and bond",
      explanation: "Venus speaks about what you recognize as beautiful, valuable, and worth approaching. It describes your language of affection, but also how you choose, appreciate, negotiate, and create reciprocity without abandoning your own value.",
      inLife: "In daily life, it appears in what awakens desire, the presence you offer, and the agreements that let a relationship flourish. The sign shows your affectionate taste; the house reveals where you want to cultivate beauty and exchange.",
      question: "What do I value enough to care for consistently?",
    },
  },
  Mars: {
    pt: {
      label: "Marte",
      archetype: "desejo, impulso, ação e coragem",
      explanation: "Marte mostra como você se move quando algo importa. Ele fala da força que corta a indecisão, do modo de defender limites e da relação que você constrói com raiva, iniciativa e desejo — não como violência, mas como energia para agir.",
      inLife: "No cotidiano, aparece no jeito de começar, competir, proteger e sustentar esforço. O signo dá estilo ao seu impulso; a casa aponta onde essa energia pede movimento consciente.",
      question: "Qual ação pequena poderia transformar minha energia em direção?",
    },
    en: {
      label: "Mars",
      archetype: "desire, impulse, action, and courage",
      explanation: "Mars shows how you move when something matters. It speaks about the force that cuts through indecision, how you defend boundaries, and your relationship with anger, initiative, and desire — not as violence, but as energy for action.",
      inLife: "In daily life, it appears in how you begin, compete, protect, and sustain effort. The sign gives style to your impulse; the house points to where this energy asks for conscious movement.",
      question: "What small action could turn my energy into direction?",
    },
  },
  Jupiter: {
    pt: {
      label: "Júpiter",
      archetype: "expansão, confiança, sentido e horizonte",
      explanation: "Júpiter mostra onde a vida parece abrir uma janela para crescer. Ele fala de fé, estudo, generosidade e da narrativa que ajuda você a encontrar significado — lembrando que expansão também precisa de medida para não virar excesso.",
      inLife: "No cotidiano, aparece nas oportunidades que você procura, nas experiências que ampliam sua visão e no modo como compartilha conhecimento. O signo mostra como você cresce; a casa mostra onde busca horizonte.",
      question: "Que horizonte me convida a crescer sem perder contato com a realidade?",
    },
    en: {
      label: "Jupiter",
      archetype: "expansion, trust, meaning, and horizon",
      explanation: "Jupiter shows where life seems to open a window for growth. It speaks about faith, study, generosity, and the story that helps you find meaning — while reminding us that expansion also needs measure so it does not become excess.",
      inLife: "In daily life, it appears in the opportunities you seek, experiences that widen your view, and how you share knowledge. The sign shows how you grow; the house shows where you seek a horizon.",
      question: "What horizon invites me to grow without losing contact with reality?",
    },
  },
  Saturn: {
    pt: {
      label: "Saturno",
      archetype: "limites, tempo, compromisso e maturidade",
      explanation: "Saturno mostra o lugar onde a vida pede estrutura em vez de pressa. Ele pode apontar medos e cobranças, mas também oferece a possibilidade de construir algo confiável com repetição, responsabilidade e um ritmo que respeite o tempo real.",
      inLife: "No cotidiano, aparece no que exige prática, paciência e limites claros. O signo mostra como você aprende responsabilidade; a casa indica o território em que sua maturidade se torna visível.",
      question: "Que estrutura simples poderia proteger o que realmente importa para mim?",
    },
    en: {
      label: "Saturn",
      archetype: "limits, time, commitment, and maturity",
      explanation: "Saturn shows where life asks for structure instead of haste. It can point to fears and pressure, but also offers the possibility of building something reliable through repetition, responsibility, and a rhythm that respects real time.",
      inLife: "In daily life, it appears in what requires practice, patience, and clear boundaries. The sign shows how you learn responsibility; the house indicates where your maturity becomes visible.",
      question: "What simple structure could protect what truly matters to me?",
    },
  },
  Uranus: {
    pt: {
      label: "Urano",
      archetype: "liberdade, ruptura, originalidade e futuro",
      explanation: "Urano mostra onde você não consegue permanecer em uma forma que já ficou pequena. Ele movimenta a necessidade de experimentar, questionar e inventar saídas diferentes — às vezes com rupturas rápidas, às vezes como uma mudança silenciosa de consciência.",
      inLife: "No cotidiano, aparece no que você faz de um jeito próprio, nos despertares inesperados e no desconforto com regras sem sentido. O signo mostra a linguagem da inovação; a casa revela onde você precisa respirar liberdade.",
      question: "Onde a minha diferença pode abrir espaço para uma forma mais verdadeira de viver?",
    },
    en: {
      label: "Uranus",
      archetype: "freedom, disruption, originality, and future",
      explanation: "Uranus shows where you cannot remain in a form that has become too small. It moves the need to experiment, question, and invent different exits — sometimes through sudden breaks, sometimes as a quiet change in consciousness.",
      inLife: "In daily life, it appears in what you do in your own way, unexpected awakenings, and discomfort with meaningless rules. The sign shows the language of innovation; the house reveals where you need to breathe freedom.",
      question: "Where can my difference make room for a truer way of living?",
    },
  },
  Neptune: {
    pt: {
      label: "Netuno",
      archetype: "imaginação, sensibilidade, sonho e dissolução",
      explanation: "Netuno fala do que você sente antes de conseguir explicar. Ele amplia imaginação, compaixão e percepção simbólica, mas pede discernimento para que empatia não vire confusão e que sonho não seja usado para fugir do que precisa ser cuidado.",
      inLife: "No cotidiano, aparece na arte, na intuição e nas atmosferas que você capta. O signo mostra a textura da sua sensibilidade; a casa indica onde os limites ficam mais porosos e o sentido mais sutil.",
      question: "Como acolher a minha sensibilidade sem abandonar a clareza?",
    },
    en: {
      label: "Neptune",
      archetype: "imagination, sensitivity, dream, and dissolution",
      explanation: "Neptune speaks about what you feel before you can explain it. It expands imagination, compassion, and symbolic perception, but asks for discernment so empathy does not become confusion and dreams are not used to escape what needs care.",
      inLife: "In daily life, it appears in art, intuition, and the atmospheres you pick up. The sign shows the texture of your sensitivity; the house indicates where boundaries become porous and meaning more subtle.",
      question: "How can I welcome my sensitivity without abandoning clarity?",
    },
  },
  Pluto: {
    pt: {
      label: "Plutão",
      archetype: "transformação, poder, verdade e renascimento",
      explanation: "Plutão mostra onde a vida não aceita mudanças superficiais. Ele aponta processos de desapego, intensidade e regeneração, convidando você a reconhecer o que perdeu vitalidade e a devolver poder ao que estava sendo vivido no automático.",
      inLife: "No cotidiano, aparece em temas que transformam a sua relação com controle, intimidade e confiança. O signo dá uma linguagem à mudança; a casa mostra onde você é chamado a atravessar camadas mais profundas.",
      question: "O que precisa mudar de forma para que a minha vida volte a ter verdade?",
    },
    en: {
      label: "Pluto",
      archetype: "transformation, power, truth, and rebirth",
      explanation: "Pluto shows where life does not accept superficial change. It points to processes of release, intensity, and regeneration, inviting you to notice what has lost vitality and return power to what was being lived on autopilot.",
      inLife: "In daily life, it appears in themes that transform your relationship with control, intimacy, and trust. The sign gives language to change; the house shows where you are asked to move through deeper layers.",
      question: "What needs to change form so my life can feel truthful again?",
    },
  },
};

const ascendantInterpretation: Localized<BodyInterpretation> = {
  pt: {
    label: "Ascendente",
    archetype: "presença, primeira resposta e modo de começar",
    explanation: "O Ascendente é o signo que estava surgindo no horizonte no momento do nascimento. Ele descreve a forma como você entra nas situações, o corpo através do qual encontra o mundo e a primeira camada que as pessoas costumam perceber.",
    inLife: "No cotidiano, ele aparece antes de qualquer explicação: no ritmo, no gesto, na postura e na maneira como você abre ou protege uma conversa. Ele não é uma máscara; é uma porta de entrada para o mapa inteiro.",
    question: "Que presença eu escolho levar comigo quando começo algo novo?",
  },
  en: {
    label: "Rising sign",
    archetype: "presence, first response, and how you begin",
    explanation: "The rising sign is the sign appearing on the horizon at the time of birth. It describes how you enter situations, the body through which you meet the world, and the first layer people tend to notice.",
    inLife: "In daily life, it appears before any explanation: in your pace, gesture, posture, and the way you open or protect a conversation. It is not a mask; it is a doorway into the whole chart.",
    question: "What presence do I choose to bring when I begin something new?",
  },
};

const signInterpretations: Record<ZodiacSign, Localized<SignInterpretation>> = {
  aries: { pt: { label: "Áries", element: "Fogo", mode: "Cardinal", tone: "iniciativa direta e coragem para começar", gifts: "franqueza, impulso e capacidade de abrir caminhos", tension: "pressa, reatividade e dificuldade de esperar o próprio tempo", question: "O que pede um primeiro passo, sem precisar estar perfeito?" }, en: { label: "Aries", element: "Fire", mode: "Cardinal", tone: "direct initiative and courage to begin", gifts: "frankness, momentum, and the ability to open paths", tension: "haste, reactivity, and difficulty waiting for your own timing", question: "What asks for a first step without needing to be perfect?" } },
  taurus: { pt: { label: "Touro", element: "Terra", mode: "Fixo", tone: "presença, constância e vínculo com o sensorial", gifts: "lealdade, paciência e capacidade de fazer algo durar", tension: "apego, resistência a mudanças e busca de segurança a qualquer custo", question: "O que pode se tornar mais seguro sem ficar parado?" }, en: { label: "Taurus", element: "Earth", mode: "Fixed", tone: "presence, steadiness, and a bond with the sensory", gifts: "loyalty, patience, and the ability to make something last", tension: "attachment, resistance to change, and seeking safety at any cost", question: "What can become safer without becoming stuck?" } },
  gemini: { pt: { label: "Gêmeos", element: "Ar", mode: "Mutável", tone: "curiosidade, troca e movimento entre ideias", gifts: "versatilidade, humor e inteligência para conectar pontos", tension: "dispersão, excesso de estímulo e dificuldade de permanecer", question: "Que conversa pode reorganizar o meu jeito de pensar?" }, en: { label: "Gemini", element: "Air", mode: "Mutable", tone: "curiosity, exchange, and movement between ideas", gifts: "versatility, humor, and intelligence for connecting dots", tension: "scattered attention, overstimulation, and difficulty staying", question: "What conversation could reorganize the way I think?" } },
  cancer: { pt: { label: "Câncer", element: "Água", mode: "Cardinal", tone: "proteção, memória e cuidado com o que pertence", gifts: "acolhimento, imaginação e lealdade emocional", tension: "defensividade, nostalgia e absorção do ambiente", question: "Que limite torna o meu cuidado mais sustentável?" }, en: { label: "Cancer", element: "Water", mode: "Cardinal", tone: "protection, memory, and care for what belongs", gifts: "warmth, imagination, and emotional loyalty", tension: "defensiveness, nostalgia, and absorbing the environment", question: "What boundary makes my care more sustainable?" } },
  leo: { pt: { label: "Leão", element: "Fogo", mode: "Fixo", tone: "expressão criativa, calor e desejo de irradiar", gifts: "generosidade, coragem e presença inspiradora", tension: "orgulho ferido, necessidade de validação e dramatização", question: "Como deixar a minha luz aparecer sem precisar competir?" }, en: { label: "Leo", element: "Fire", mode: "Fixed", tone: "creative expression, warmth, and the wish to radiate", gifts: "generosity, courage, and inspiring presence", tension: "wounded pride, needing validation, and dramatization", question: "How can I let my light appear without needing to compete?" } },
  virgo: { pt: { label: "Virgem", element: "Terra", mode: "Mutável", tone: "atenção aos detalhes, discernimento e cuidado prático", gifts: "precisão, serviço e talento para melhorar processos", tension: "autocrítica, excesso de controle e dificuldade de reconhecer o suficiente", question: "O que merece cuidado sem precisar ser corrigido o tempo todo?" }, en: { label: "Virgo", element: "Earth", mode: "Mutable", tone: "attention to detail, discernment, and practical care", gifts: "precision, service, and a talent for improving processes", tension: "self-criticism, over-control, and difficulty recognizing enough", question: "What deserves care without needing to be corrected all the time?" } },
  libra: { pt: { label: "Libra", element: "Ar", mode: "Cardinal", tone: "reciprocidade, beleza e busca por equilíbrio", gifts: "diplomacia, senso estético e habilidade para criar pontes", tension: "indecisão, evitar conflitos e medir o próprio valor pelo outro", question: "Que escolha preserva a relação sem apagar a minha voz?" }, en: { label: "Libra", element: "Air", mode: "Cardinal", tone: "reciprocity, beauty, and a search for balance", gifts: "diplomacy, aesthetic sense, and the ability to build bridges", tension: "indecision, conflict avoidance, and measuring worth through others", question: "What choice protects the relationship without erasing my voice?" } },
  scorpio: { pt: { label: "Escorpião", element: "Água", mode: "Fixo", tone: "intensidade, profundidade e percepção do que está oculto", gifts: "foco, coragem emocional e poder de regeneração", tension: "desconfiança, controle e dificuldade de soltar o que já terminou", question: "Que verdade pode ser acolhida sem virar armadura?" }, en: { label: "Scorpio", element: "Water", mode: "Fixed", tone: "intensity, depth, and perception of what is hidden", gifts: "focus, emotional courage, and regenerative power", tension: "mistrust, control, and difficulty releasing what has ended", question: "What truth can be welcomed without becoming armor?" } },
  sagittarius: { pt: { label: "Sagitário", element: "Fogo", mode: "Mutável", tone: "horizonte, aventura e busca por significado", gifts: "entusiasmo, honestidade e capacidade de ampliar perspectivas", tension: "exagero, inquietação e transformar opinião em certeza", question: "Que horizonte amplia a minha vida sem me afastar do presente?" }, en: { label: "Sagittarius", element: "Fire", mode: "Mutable", tone: "horizon, adventure, and a search for meaning", gifts: "enthusiasm, honesty, and the ability to widen perspectives", tension: "excess, restlessness, and turning opinion into certainty", question: "What horizon expands my life without pulling me away from the present?" } },
  capricorn: { pt: { label: "Capricórnio", element: "Terra", mode: "Cardinal", tone: "responsabilidade, estratégia e construção de longo prazo", gifts: "resiliência, visão de estrutura e compromisso", tension: "dureza consigo, sobrecarga e confundir valor com produtividade", question: "Que ambição pode crescer junto com a minha humanidade?" }, en: { label: "Capricorn", element: "Earth", mode: "Cardinal", tone: "responsibility, strategy, and long-term building", gifts: "resilience, structural vision, and commitment", tension: "being hard on yourself, overload, and confusing worth with productivity", question: "What ambition can grow alongside my humanity?" } },
  aquarius: { pt: { label: "Aquário", element: "Ar", mode: "Fixo", tone: "independência, visão coletiva e pensamento original", gifts: "inovação, consciência de grupo e liberdade de imaginar futuro", tension: "distanciamento, teimosia intelectual e dificuldade de mostrar vulnerabilidade", question: "Como pertencer sem abrir mão da minha diferença?" }, en: { label: "Aquarius", element: "Air", mode: "Fixed", tone: "independence, collective vision, and original thought", gifts: "innovation, group awareness, and freedom to imagine the future", tension: "detachment, intellectual stubbornness, and difficulty showing vulnerability", question: "How can I belong without giving up my difference?" } },
  pisces: { pt: { label: "Peixes", element: "Água", mode: "Mutável", tone: "sensibilidade, imaginação e percepção do invisível", gifts: "compaixão, criatividade e capacidade de sentir nuances", tension: "confusão de limites, idealização e fuga quando algo dói", question: "Como honrar o que sinto sem perder o chão?" }, en: { label: "Pisces", element: "Water", mode: "Mutable", tone: "sensitivity, imagination, and perception of the invisible", gifts: "compassion, creativity, and the ability to feel nuance", tension: "blurred boundaries, idealization, and escape when something hurts", question: "How can I honor what I feel without losing the ground?" } },
};

const houseInterpretations: Record<number, Localized<HouseInterpretation>> = {
  1: { pt: { label: "Casa 1", area: "presença e começo", explanation: "A primeira casa fala da forma como você chega ao mundo: corpo, presença, iniciativa e a impressão que a sua energia causa antes das palavras.", question: "Que versão de mim está pronta para ocupar o próprio espaço?" }, en: { label: "House 1", area: "presence and beginnings", explanation: "The first house speaks about how you arrive in the world: body, presence, initiative, and the impression your energy makes before words.", question: "What version of me is ready to take up its own space?" } },
  2: { pt: { label: "Casa 2", area: "recursos e valores", explanation: "A segunda casa fala do que sustenta você: dinheiro, talentos, corpo, autoestima e os valores que orientam o que merece ser preservado.", question: "O que tem valor para mim além do que pode ser medido?" }, en: { label: "House 2", area: "resources and values", explanation: "The second house speaks about what sustains you: money, talents, body, self-worth, and the values that guide what deserves to be preserved.", question: "What is valuable to me beyond what can be measured?" } },
  3: { pt: { label: "Casa 3", area: "aprendizagem e troca", explanation: "A terceira casa fala de pensamento cotidiano, conversas, estudos iniciais, vizinhança e das pequenas pontes que ligam você ao mundo.", question: "Que conversa ou aprendizado está mudando meu caminho?" }, en: { label: "House 3", area: "learning and exchange", explanation: "The third house speaks about everyday thought, conversations, early learning, neighborhood, and the small bridges connecting you with the world.", question: "What conversation or learning is changing my path?" } },
  4: { pt: { label: "Casa 4", area: "raízes e intimidade", explanation: "A quarta casa fala de origem, família, casa, privacidade e da base emocional a partir da qual você consegue descansar e se reconstruir.", question: "Que tipo de base me permite florescer sem me defender o tempo todo?" }, en: { label: "House 4", area: "roots and intimacy", explanation: "The fourth house speaks about origins, family, home, privacy, and the emotional base from which you can rest and rebuild.", question: "What kind of foundation lets me flourish without defending myself all the time?" } },
  5: { pt: { label: "Casa 5", area: "criação e prazer", explanation: "A quinta casa fala de criatividade, romance, expressão, brincadeira e tudo aquilo que ganha vida quando você faz algo porque deseja, não apenas porque precisa.", question: "O que quer nascer através da minha alegria?" }, en: { label: "House 5", area: "creation and pleasure", explanation: "The fifth house speaks about creativity, romance, expression, play, and what comes alive when you do something because you desire it, not only because you must.", question: "What wants to be born through my joy?" } },
  6: { pt: { label: "Casa 6", area: "ritmo e cuidado", explanation: "A sexta casa fala de rotina, saúde cotidiana, trabalho, prática e dos pequenos gestos que tornam a vida mais habitável.", question: "Que hábito simples pode cuidar da minha energia real?" }, en: { label: "House 6", area: "rhythm and care", explanation: "The sixth house speaks about routine, everyday health, work, practice, and the small gestures that make life more livable.", question: "What simple habit could care for my actual energy?" } },
  7: { pt: { label: "Casa 7", area: "encontro e parceria", explanation: "A sétima casa fala de relações de igual para igual, acordos, espelhos e do que você aprende quando a sua vida encontra outra vontade.", question: "Que relação me ensina reciprocidade sem me fazer desaparecer?" }, en: { label: "House 7", area: "encounter and partnership", explanation: "The seventh house speaks about equal relationships, agreements, mirrors, and what you learn when your life meets another will.", question: "What relationship teaches reciprocity without making me disappear?" } },
  8: { pt: { label: "Casa 8", area: "intimidade e transformação", explanation: "A oitava casa fala de confiança, trocas profundas, perdas, recursos compartilhados e das mudanças que acontecem quando você não consegue mais viver na superfície.", question: "O que precisa ser entregue para que uma nova forma de confiança surja?" }, en: { label: "House 8", area: "intimacy and transformation", explanation: "The eighth house speaks about trust, deep exchange, loss, shared resources, and changes that happen when surface living is no longer possible.", question: "What needs to be surrendered for a new form of trust to emerge?" } },
  9: { pt: { label: "Casa 9", area: "sentido e horizonte", explanation: "A nona casa fala de viagens, estudos, espiritualidade, filosofia e das experiências que ampliam a moldura através da qual você interpreta a vida.", question: "Que experiência está ampliando o meu mundo por dentro?" }, en: { label: "House 9", area: "meaning and horizon", explanation: "The ninth house speaks about travel, study, spirituality, philosophy, and experiences that widen the frame through which you interpret life.", question: "What experience is widening my world from the inside?" } },
  10: { pt: { label: "Casa 10", area: "obra e contribuição", explanation: "A décima casa fala de vocação, visibilidade, responsabilidade e da contribuição que você deseja deixar no mundo através do que constrói.", question: "Que obra merece a minha responsabilidade e a minha ambição?" }, en: { label: "House 10", area: "work and contribution", explanation: "The tenth house speaks about vocation, visibility, responsibility, and the contribution you want to leave through what you build.", question: "What work deserves my responsibility and ambition?" } },
  11: { pt: { label: "Casa 11", area: "futuro e comunidade", explanation: "A décima primeira casa fala de amizades, grupos, redes, causas e do futuro que começa quando uma visão deixa de ser só sua.", question: "Com quem eu quero construir o futuro que imagino?" }, en: { label: "House 11", area: "future and community", explanation: "The eleventh house speaks about friendship, groups, networks, causes, and the future that begins when a vision is no longer only yours.", question: "With whom do I want to build the future I imagine?" } },
  12: { pt: { label: "Casa 12", area: "silêncio e integração", explanation: "A décima segunda casa fala de recolhimento, sonhos, espiritualidade, encerramentos e das partes da experiência que precisam de silêncio para serem integradas.", question: "O que pede descanso, escuta e um encerramento gentil?" }, en: { label: "House 12", area: "silence and integration", explanation: "The twelfth house speaks about retreat, dreams, spirituality, endings, and parts of experience that need silence in order to integrate.", question: "What asks for rest, listening, and a gentle ending?" } },
};

const aspectInterpretations: Record<NatalAspectType, Localized<AspectInterpretation>> = {
  conjunction: { pt: { label: "Conjunção", explanation: "Dois símbolos ocupam a mesma região do céu e misturam as suas vozes. Isso concentra energia: pode dar muita potência, mas também tornar difícil separar uma necessidade da outra.", experience: "Você sente esse tema com intensidade e tende a vivê-lo de forma muito pessoal.", question: "Como essas duas forças podem colaborar sem uma apagar a outra?" }, en: { label: "Conjunction", explanation: "Two symbols occupy the same region of the sky and blend their voices. This concentrates energy: it can create great power, but also make it hard to separate one need from the other.", experience: "You feel this theme intensely and tend to experience it in a very personal way.", question: "How can these two forces collaborate without one erasing the other?" } },
  sextile: { pt: { label: "Sextil", explanation: "Duas partes do mapa encontram uma abertura cooperativa. O potencial está disponível, mas costuma pedir escolha, prática e uma iniciativa sua para virar experiência.", experience: "Oportunidades aparecem quando você se movimenta e cria a ponte.", question: "Que gesto consciente pode colocar esse talento em circulação?" }, en: { label: "Sextile", explanation: "Two parts of the chart find a cooperative opening. The potential is available, but usually asks for choice, practice, and your initiative to become experience.", experience: "Opportunities appear when you move and build the bridge.", question: "What conscious gesture could put this talent into circulation?" } },
  square: { pt: { label: "Quadratura", explanation: "Duas funções da vida puxam em direções diferentes. A tensão não é uma sentença: ela pode mostrar onde você precisa criar uma solução própria em vez de escolher um lado para sempre.", experience: "O incômodo reaparece até que você encontre uma forma mais integrada de agir.", question: "Que resposta nova a minha tensão está tentando me ensinar?" }, en: { label: "Square", explanation: "Two life functions pull in different directions. The tension is not a sentence: it can show where you need to create your own solution instead of choosing one side forever.", experience: "The discomfort returns until you find a more integrated way to act.", question: "What new response is my tension trying to teach me?" } },
  trine: { pt: { label: "Trígono", explanation: "Duas partes do mapa fluem com facilidade e reconhecem uma à outra. Esse talento pode parecer tão natural que você esquece de nomeá-lo ou desenvolvê-lo de propósito.", experience: "Há uma sensação de recurso interno, especialmente quando você confia no próprio ritmo.", question: "Que facilidade merece ser transformada em contribuição?" }, en: { label: "Trine", explanation: "Two parts of the chart flow easily and recognize each other. This talent can feel so natural that you forget to name it or develop it intentionally.", experience: "There is a sense of inner resource, especially when you trust your own rhythm.", question: "What ease deserves to become a contribution?" } },
  opposition: { pt: { label: "Oposição", explanation: "Duas forças ficam frente a frente e pedem equilíbrio. Muitas vezes uma aparece através de outras pessoas, como um espelho que ajuda você a reconhecer uma parte que estava distante.", experience: "Você aprende por contraste e por negociação entre necessidades verdadeiras.", question: "Como posso incluir os dois lados sem me dividir ao meio?" }, en: { label: "Opposition", explanation: "Two forces face each other and ask for balance. Often one appears through other people, as a mirror helping you recognize a part that had felt distant.", experience: "You learn through contrast and negotiation between real needs.", question: "How can I include both sides without splitting myself in two?" } },
};

export function getBodyInterpretation(body: NatalBody, locale: AstrologyLocale) {
  return bodyInterpretations[body][locale === "en" ? "en" : "pt"];
}

export function getAscendantInterpretation(locale: AstrologyLocale) {
  return ascendantInterpretation[locale === "en" ? "en" : "pt"];
}

export function getSignInterpretation(sign: ZodiacSign, locale: AstrologyLocale) {
  return signInterpretations[sign][locale === "en" ? "en" : "pt"];
}

export function getHouseInterpretation(house: number, locale: AstrologyLocale) {
  return houseInterpretations[house][locale === "en" ? "en" : "pt"];
}

export function getAspectInterpretation(type: NatalAspectType, locale: AstrologyLocale) {
  return aspectInterpretations[type][locale === "en" ? "en" : "pt"];
}
