export type TarotCardGuide = {
  core: string;
  question: string;
};

type LocalizedTarotCardGuide = {
  pt: TarotCardGuide;
  en: TarotCardGuide;
};

/**
 * A short, human entry point for every card. These are deliberately separate
 * from the contextual interpretation: the reader first learns the symbol,
 * then recognises where it touches their own life.
 */
export const CARD_GUIDES: Record<string, LocalizedTarotCardGuide> = {
  "major-00-the-fool": {
    pt: {
      core: "O Louco representa começo, liberdade e a coragem de caminhar sem controlar cada detalhe.",
      question: "Onde posso começar de um jeito mais leve, sem transformar medo em prudência?",
    },
    en: {
      core: "The Fool represents beginnings, freedom, and the courage to move without controlling every detail.",
      question: "Where can I begin more lightly, without mistaking fear for caution?",
    },
  },
  "major-01-the-magician": {
    pt: {
      core: "O Mago representa iniciativa: você reúne recursos, atenção e habilidade para fazer algo começar.",
      question: "Que recurso que já tenho pode virar uma ação hoje?",
    },
    en: {
      core: "The Magician represents initiative: you gather resources, attention, and skill to begin something.",
      question: "Which resource I already have can become an action today?",
    },
  },
  "major-02-the-high-priestess": {
    pt: {
      core: "A Sacerdotisa representa silêncio, percepção e uma verdade que amadurece antes de ser dita.",
      question: "O que eu já percebi, mas ainda não consegui escutar em silêncio?",
    },
    en: {
      core: "The High Priestess represents silence, perception, and a truth that matures before it is spoken.",
      question: "What have I already noticed but not yet been able to hear in silence?",
    },
  },
  "major-03-the-empress": {
    pt: {
      core: "A Imperatriz representa criação, cuidado e aquilo que cresce quando recebe presença constante.",
      question: "O que na minha vida precisa de cuidado real, e não de cobrança?",
    },
    en: {
      core: "The Empress represents creation, care, and what grows when it receives steady presence.",
      question: "What in my life needs real care rather than more pressure?",
    },
  },
  "major-04-the-emperor": {
    pt: {
      core: "O Imperador representa estrutura, responsabilidade e um limite firme que dá forma ao caminho.",
      question: "Que estrutura ou limite tornaria minha vida mais segura agora?",
    },
    en: {
      core: "The Emperor represents structure, responsibility, and a firm boundary that gives shape to the path.",
      question: "Which structure or boundary would make my life safer now?",
    },
  },
  "major-05-the-hierophant": {
    pt: {
      core: "O Hierofante representa aprendizado, tradição e a orientação de alguém ou algo que merece confiança.",
      question: "Que ensinamento ou orientação confiável pode me ajudar sem apagar minha própria voz?",
    },
    en: {
      core: "The Hierophant represents learning, tradition, and guidance from someone or something worthy of trust.",
      question: "Which trustworthy teaching or guidance can help without silencing my own voice?",
    },
  },
  "major-06-the-lovers": {
    pt: {
      core: "Os Enamorados representam escolha, vínculo e a necessidade de alinhar desejo com valores.",
      question: "Que escolha combina de verdade com aquilo que eu digo valorizar?",
    },
    en: {
      core: "The Lovers represent choice, connection, and the need to align desire with values.",
      question: "Which choice truly matches what I say I value?",
    },
  },
  "major-07-the-chariot": {
    pt: {
      core: "O Carro representa direção, movimento e a decisão de conduzir a própria energia para um destino escolhido.",
      question: "Para onde estou levando minha energia, e o que precisa deixar de competir por ela?",
    },
    en: {
      core: "The Chariot represents direction, movement, and choosing where to lead your own energy.",
      question: "Where am I taking my energy, and what needs to stop competing for it?",
    },
  },
  "major-08-strength": {
    pt: {
      core: "A Força representa coragem serena: firmeza com sensibilidade, sem precisar dominar tudo.",
      question: "Onde minha força pode aparecer como calma, e não como controle?",
    },
    en: {
      core: "Strength represents quiet courage: firmness with sensitivity, without needing to dominate everything.",
      question: "Where can my strength appear as calm rather than control?",
    },
  },
  "major-09-the-hermit": {
    pt: {
      core: "O Eremita representa recolhimento, busca interior e uma verdade encontrada longe do excesso de ruído.",
      question: "Que resposta pode aparecer se eu me afastar por um instante das opiniões ao redor?",
    },
    en: {
      core: "The Hermit represents withdrawal, inner search, and truth found away from excess noise.",
      question: "What answer might appear if I step away from other people's opinions for a moment?",
    },
  },
  "major-10-wheel-of-fortune": {
    pt: {
      core: "A Roda da Fortuna representa ciclos, mudanças e a vida se movendo além do nosso controle.",
      question: "O que está mudando, e como posso acompanhar sem tentar parar o ciclo?",
    },
    en: {
      core: "The Wheel of Fortune represents cycles, change, and life moving beyond our control.",
      question: "What is changing, and how can I move with it instead of trying to stop the cycle?",
    },
  },
  "major-11-justice": {
    pt: {
      core: "A Justiça representa verdade, equilíbrio e a consequência honesta das escolhas feitas.",
      question: "Que fato preciso encarar para escolher com mais equilíbrio?",
    },
    en: {
      core: "Justice represents truth, balance, and the honest consequences of the choices made.",
      question: "Which fact do I need to face to choose with more balance?",
    },
  },
  "major-12-the-hanged-man": {
    pt: {
      core: "O Enforcado representa pausa, entrega e a mudança de perspectiva que nasce quando a insistência para.",
      question: "O que posso enxergar se parar de forçar a mesma resposta?",
    },
    en: {
      core: "The Hanged Man represents pause, surrender, and a new perspective born when insistence stops.",
      question: "What might I see if I stop forcing the same answer?",
    },
  },
  "major-13-death": {
    pt: {
      core: "A Morte representa encerramento de ciclo, limpeza e renascimento: o fim abre espaço para uma vida nova.",
      question: "O que precisa terminar para que uma forma mais viva de seguir possa começar?",
    },
    en: {
      core: "Death represents the end of a cycle, clearing, and rebirth: an ending makes room for new life.",
      question: "What needs to end so a more alive way forward can begin?",
    },
  },
  "major-14-temperance": {
    pt: {
      core: "A Temperança representa equilíbrio, cura e a mistura paciente de partes que pareciam separadas.",
      question: "Onde preciso trocar intensidade por medida para voltar ao meu ritmo?",
    },
    en: {
      core: "Temperance represents balance, healing, and the patient blending of parts that seemed separate.",
      question: "Where do I need less intensity and more measure to return to my rhythm?",
    },
  },
  "major-15-the-devil": {
    pt: {
      core: "O Diabo representa apego, desejo e o padrão que ganha força quando não é nomeado.",
      question: "Que desejo ou hábito está escolhendo por mim sem que eu perceba?",
    },
    en: {
      core: "The Devil represents attachment, desire, and a pattern that grows stronger when left unnamed.",
      question: "Which desire or habit is choosing for me without my noticing?",
    },
  },
  "major-16-the-tower": {
    pt: {
      core: "A Torre representa ruptura e revelação: uma estrutura falsa cai para que a verdade possa aparecer.",
      question: "Que verdade a instabilidade está tentando me mostrar?",
    },
    en: {
      core: "The Tower represents rupture and revelation: a false structure falls so truth can appear.",
      question: "What truth is the instability trying to show me?",
    },
  },
  "major-17-the-star": {
    pt: {
      core: "A Estrela representa esperança, reparo e a confiança tranquila que volta depois de um período difícil.",
      question: "O que devolve esperança sem exigir que eu tenha todas as respostas?",
    },
    en: {
      core: "The Star represents hope, repair, and the quiet trust that returns after a difficult period.",
      question: "What restores hope without asking me to have every answer?",
    },
  },
  "major-18-the-moon": {
    pt: {
      core: "A Lua representa sensibilidade, medo e imaginação: nem toda impressão é um fato.",
      question: "O que é intuição aqui, e o que pode ser apenas medo fazendo barulho?",
    },
    en: {
      core: "The Moon represents sensitivity, fear, and imagination: not every impression is a fact.",
      question: "What is intuition here, and what may simply be fear making noise?",
    },
  },
  "major-19-the-sun": {
    pt: {
      core: "O Sol representa clareza, vitalidade e a alegria que aparece quando você pode ser inteiro.",
      question: "O que fica mais simples quando paro de esconder uma parte viva de mim?",
    },
    en: {
      core: "The Sun represents clarity, vitality, and joy that appears when you can be whole.",
      question: "What becomes simpler when I stop hiding a living part of myself?",
    },
  },
  "major-20-judgement": {
    pt: {
      core: "O Julgamento representa despertar, revisão e o chamado para responder pelo que você já compreendeu.",
      question: "Que verdade já amadureceu em mim e agora pede uma resposta?",
    },
    en: {
      core: "Judgement represents awakening, review, and the call to respond to what you already understand.",
      question: "Which truth has matured in me and now asks for a response?",
    },
  },
  "major-21-the-world": {
    pt: {
      core: "O Mundo representa conclusão, integração e a expansão que se torna possível quando um ciclo é reconhecido.",
      question: "Que etapa merece ser encerrada com presença antes de eu seguir adiante?",
    },
    en: {
      core: "The World represents completion, integration, and expansion made possible when a cycle is recognised.",
      question: "Which stage deserves to be completed with presence before I move on?",
    },
  },
  "wands-ace": {
    pt: {
      core: "O Ás de Paus representa uma faísca de desejo, energia e vontade de começar.",
      question: "Que impulso merece um primeiro gesto antes de perder calor?",
    },
    en: {
      core: "The Ace of Wands represents a spark of desire, energy, and the will to begin.",
      question: "Which impulse deserves a first gesture before it loses heat?",
    },
  },
  "wands-two": {
    pt: {
      core: "O Dois de Paus representa visão e a escolha de um horizonte depois do primeiro passo.",
      question: "Qual direção merece minha energia agora?",
    },
    en: {
      core: "The Two of Wands represents vision and choosing a horizon after the first step.",
      question: "Which direction deserves my energy now?",
    },
  },
  "wands-three": {
    pt: {
      core: "O Três de Paus representa expansão e a espera ativa pelo retorno do que foi colocado no mundo.",
      question: "O que já comecei precisa de tempo, alcance ou um novo ajuste?",
    },
    en: {
      core: "The Three of Wands represents expansion and actively waiting for what you have sent into the world.",
      question: "Does what I began need time, reach, or another adjustment?",
    },
  },
  "wands-four": {
    pt: {
      core: "O Quatro de Paus representa celebração, pertencimento e uma base onde você pode respirar.",
      question: "Que pequena conquista já merece ser reconhecida?",
    },
    en: {
      core: "The Four of Wands represents celebration, belonging, and a base where you can breathe.",
      question: "Which small achievement already deserves to be recognised?",
    },
  },
  "wands-five": {
    pt: {
      core: "O Cinco de Paus representa conflito, competição e forças que precisam encontrar uma forma melhor de conviver.",
      question: "Esta disputa pede confronto, acordo ou distância?",
    },
    en: {
      core: "The Five of Wands represents conflict, competition, and forces needing a better way to coexist.",
      question: "Does this dispute call for confrontation, agreement, or distance?",
    },
  },
  "wands-six": {
    pt: {
      core: "O Seis de Paus representa reconhecimento, avanço e o direito de receber crédito pela própria caminhada.",
      question: "Onde preciso permitir que meu esforço seja visto?",
    },
    en: {
      core: "The Six of Wands represents recognition, progress, and allowing yourself credit for the path taken.",
      question: "Where do I need to allow my effort to be seen?",
    },
  },
  "wands-seven": {
    pt: {
      core: "O Sete de Paus representa defesa, posição e a coragem de proteger o que importa.",
      question: "O que merece minha firmeza, sem que eu precise convencer todos?",
    },
    en: {
      core: "The Seven of Wands represents defence, position, and the courage to protect what matters.",
      question: "What deserves my firmness without needing me to convince everyone?",
    },
  },
  "wands-eight": {
    pt: {
      core: "O Oito de Paus representa rapidez, movimento e notícias que aceleram o caminho.",
      question: "Como posso responder ao movimento sem transformar velocidade em atropelo?",
    },
    en: {
      core: "The Eight of Wands represents speed, movement, and news that accelerates the path.",
      question: "How can I respond to movement without turning speed into upheaval?",
    },
  },
  "wands-nine": {
    pt: {
      core: "O Nove de Paus representa resistência, experiência e a proteção da energia depois de muito esforço.",
      question: "Estou protegendo algo importante ou apenas esperando um novo golpe?",
    },
    en: {
      core: "The Nine of Wands represents resilience, experience, and protecting your energy after sustained effort.",
      question: "Am I protecting something important or only waiting for another blow?",
    },
  },
  "wands-ten": {
    pt: {
      core: "O Dez de Paus representa excesso de responsabilidade e o peso de tentar sustentar tudo sozinho.",
      question: "Que peso posso dividir, concluir ou deixar para trás?",
    },
    en: {
      core: "The Ten of Wands represents excess responsibility and the weight of trying to carry everything alone.",
      question: "Which burden can I share, complete, or put down?",
    },
  },
  "wands-page": {
    pt: {
      core: "O Pajem de Paus representa curiosidade, descoberta e a coragem de experimentar antes de dominar.",
      question: "O que posso testar com curiosidade, sem exigir perfeição?",
    },
    en: {
      core: "The Page of Wands represents curiosity, discovery, and experimenting before mastery.",
      question: "What can I test with curiosity without demanding perfection?",
    },
  },
  "wands-knight": {
    pt: {
      core: "O Cavaleiro de Paus representa impulso, aventura e energia para avançar rapidamente.",
      question: "Onde meu entusiasmo precisa de direção para não virar fuga?",
    },
    en: {
      core: "The Knight of Wands represents impulse, adventure, and energy to move quickly.",
      question: "Where does my enthusiasm need direction so it does not become escape?",
    },
  },
  "wands-queen": {
    pt: {
      core: "A Rainha de Paus representa magnetismo, confiança e uma presença que não pede desculpas por existir.",
      question: "Onde posso ocupar meu espaço com mais naturalidade?",
    },
    en: {
      core: "The Queen of Wands represents magnetism, confidence, and a presence that does not apologise for existing.",
      question: "Where can I take up space more naturally?",
    },
  },
  "wands-king": {
    pt: {
      core: "O Rei de Paus representa liderança, visão e a decisão de transformar intenção em direção.",
      question: "Que decisão organiza meu caminho sem depender de urgência?",
    },
    en: {
      core: "The King of Wands represents leadership, vision, and turning intention into direction.",
      question: "Which decision can organise my path without relying on urgency?",
    },
  },
  "cups-ace": {
    pt: {
      core: "O Ás de Copas representa abertura do coração, sentimento novo e disponibilidade para receber.",
      question: "Que emoção está nascendo e precisa de espaço para existir?",
    },
    en: {
      core: "The Ace of Cups represents an open heart, a new feeling, and availability to receive.",
      question: "Which emotion is being born and needs room to exist?",
    },
  },
  "cups-two": {
    pt: {
      core: "O Dois de Copas representa encontro, troca e reciprocidade entre duas presenças.",
      question: "Existe escuta e troca dos dois lados neste vínculo?",
    },
    en: {
      core: "The Two of Cups represents meeting, exchange, and reciprocity between two presences.",
      question: "Are listening and exchange present on both sides of this bond?",
    },
  },
  "cups-three": {
    pt: {
      core: "O Três de Copas representa amizade, alegria compartilhada e apoio que torna a vida mais leve.",
      question: "Quem ou o que me ajuda a lembrar que não preciso atravessar tudo sozinho?",
    },
    en: {
      core: "The Three of Cups represents friendship, shared joy, and support that makes life lighter.",
      question: "Who or what reminds me I do not have to cross everything alone?",
    },
  },
  "cups-four": {
    pt: {
      core: "O Quatro de Copas representa pausa, insatisfação e uma oferta que pode passar despercebida.",
      question: "O que estou recusando apenas porque não chegou do jeito que imaginei?",
    },
    en: {
      core: "The Four of Cups represents pause, dissatisfaction, and an offer that may go unnoticed.",
      question: "What am I refusing only because it did not arrive as I imagined?",
    },
  },
  "cups-five": {
    pt: {
      core: "O Cinco de Copas representa perda, luto e a necessidade de honrar a dor sem esquecer o que permanece.",
      question: "O que ainda existe e merece ser visto junto do que foi perdido?",
    },
    en: {
      core: "The Five of Cups represents loss, grief, and honouring pain without forgetting what remains.",
      question: "What still exists and deserves to be seen alongside what was lost?",
    },
  },
  "cups-six": {
    pt: {
      core: "O Seis de Copas representa memória, ternura e o passado que pode ser visitado com maturidade.",
      question: "Que lembrança pode me ensinar sem me prender ao que já passou?",
    },
    en: {
      core: "The Six of Cups represents memory, tenderness, and visiting the past with maturity.",
      question: "Which memory can teach me without keeping me tied to the past?",
    },
  },
  "cups-seven": {
    pt: {
      core: "O Sete de Copas representa possibilidades, imaginação e a dificuldade de escolher entre muitos desejos.",
      question: "Qual possibilidade sustenta minha vida real, e qual apenas me distrai?",
    },
    en: {
      core: "The Seven of Cups represents possibilities, imagination, and difficulty choosing among many desires.",
      question: "Which possibility supports my real life, and which only distracts me?",
    },
  },
  "cups-eight": {
    pt: {
      core: "O Oito de Copas representa partida, desapego e a busca por algo que tenha mais verdade.",
      question: "O que já não me alimenta, mesmo que eu ainda tenha carinho por isso?",
    },
    en: {
      core: "The Eight of Cups represents departure, release, and searching for something truer.",
      question: "What no longer nourishes me, even though I still care about it?",
    },
  },
  "cups-nine": {
    pt: {
      core: "O Nove de Copas representa satisfação, prazer e a permissão para reconhecer uma conquista.",
      question: "Onde posso receber o que conquistei sem procurar imediatamente outro vazio?",
    },
    en: {
      core: "The Nine of Cups represents satisfaction, pleasure, and allowing yourself to recognise an achievement.",
      question: "Where can I receive what I have earned without immediately searching for another emptiness?",
    },
  },
  "cups-ten": {
    pt: {
      core: "O Dez de Copas representa harmonia, pertencimento e uma felicidade construída em escolhas possíveis.",
      question: "Que gesto cotidiano torna meus vínculos mais seguros e vivos?",
    },
    en: {
      core: "The Ten of Cups represents harmony, belonging, and happiness built through possible choices.",
      question: "Which everyday gesture makes my relationships safer and more alive?",
    },
  },
  "cups-page": {
    pt: {
      core: "O Pajem de Copas representa ternura, sensibilidade e uma mensagem emocional ainda delicada.",
      question: "Que sentimento pequeno merece ser tratado com gentileza?",
    },
    en: {
      core: "The Page of Cups represents tenderness, sensitivity, and a still-delicate emotional message.",
      question: "Which small feeling deserves to be treated gently?",
    },
  },
  "cups-knight": {
    pt: {
      core: "O Cavaleiro de Copas representa convite, romance e a coragem de expressar o que sente.",
      question: "O que preciso dizer com verdade, sem transformar desejo em promessa?",
    },
    en: {
      core: "The Knight of Cups represents invitation, romance, and the courage to express what you feel.",
      question: "What do I need to say truthfully without turning desire into a promise?",
    },
  },
  "cups-queen": {
    pt: {
      core: "A Rainha de Copas representa profundidade emocional, intuição e cuidado com limites.",
      question: "Como posso acolher o que sinto sem absorver o que pertence ao outro?",
    },
    en: {
      core: "The Queen of Cups represents emotional depth, intuition, and care with boundaries.",
      question: "How can I honour what I feel without absorbing what belongs to someone else?",
    },
  },
  "cups-king": {
    pt: {
      core: "O Rei de Copas representa maturidade emocional: sentir profundamente e responder sem se perder.",
      question: "Como posso cuidar da emoção sem deixar que ela conduza tudo sozinha?",
    },
    en: {
      core: "The King of Cups represents emotional maturity: feeling deeply and responding without losing yourself.",
      question: "How can I care for the emotion without letting it lead everything alone?",
    },
  },
  "swords-ace": {
    pt: {
      core: "O Ás de Espadas representa clareza, verdade e uma decisão que corta a confusão.",
      question: "Que frase simples organiza o que eu realmente preciso saber?",
    },
    en: {
      core: "The Ace of Swords represents clarity, truth, and a decision that cuts through confusion.",
      question: "Which simple sentence organises what I truly need to know?",
    },
  },
  "swords-two": {
    pt: {
      core: "O Dois de Espadas representa impasse, proteção e a escolha adiada para evitar desconforto.",
      question: "O que estou evitando olhar por medo de precisar escolher?",
    },
    en: {
      core: "The Two of Swords represents stalemate, protection, and a choice delayed to avoid discomfort.",
      question: "What am I avoiding because I fear having to choose?",
    },
  },
  "swords-three": {
    pt: {
      core: "O Três de Espadas representa dor reconhecida, verdade difícil e a liberação que começa com honestidade.",
      question: "Que dor precisa ser reconhecida para parar de comandar minhas escolhas?",
    },
    en: {
      core: "The Three of Swords represents recognised pain, difficult truth, and release beginning with honesty.",
      question: "Which pain needs recognition so it stops directing my choices?",
    },
  },
  "swords-four": {
    pt: {
      core: "O Quatro de Espadas representa descanso, recolhimento e recuperação da mente.",
      question: "Que pausa não é desistência, mas cuidado necessário?",
    },
    en: {
      core: "The Four of Swords represents rest, retreat, and the mind's recovery.",
      question: "Which pause is not giving up, but necessary care?",
    },
  },
  "swords-five": {
    pt: {
      core: "O Cinco de Espadas representa conflito, orgulho e a pergunta sobre o preço de vencer.",
      question: "Que vitória deixaria uma perda maior do que o problema original?",
    },
    en: {
      core: "The Five of Swords represents conflict, pride, and asking what victory would cost.",
      question: "Which victory would leave a greater loss than the original problem?",
    },
  },
  "swords-six": {
    pt: {
      core: "O Seis de Espadas representa travessia, mudança e uma saída que pode acontecer em silêncio.",
      question: "O que preciso deixar para conseguir atravessar esta fase?",
    },
    en: {
      core: "The Six of Swords represents crossing over, change, and an exit that may happen quietly.",
      question: "What do I need to leave behind to cross this phase?",
    },
  },
  "swords-seven": {
    pt: {
      core: "O Sete de Espadas representa estratégia, discrição e a diferença entre preservar-se e esconder a verdade.",
      question: "Onde preciso agir com inteligência sem abandonar minha integridade?",
    },
    en: {
      core: "The Seven of Swords represents strategy, discretion, and the difference between self-protection and hiding truth.",
      question: "Where do I need to act intelligently without abandoning my integrity?",
    },
  },
  "swords-eight": {
    pt: {
      core: "O Oito de Espadas representa limitação mental e a sensação de estar preso a uma história sobre si.",
      question: "Que pequena escolha ainda está disponível, mesmo que eu não veja a saída inteira?",
    },
    en: {
      core: "The Eight of Swords represents mental limitation and feeling trapped inside a story about yourself.",
      question: "Which small choice is still available even if I cannot see the whole way out?",
    },
  },
  "swords-nine": {
    pt: {
      core: "O Nove de Espadas representa preocupação, culpa e pensamentos que crescem quando ficam sozinhos.",
      question: "Que medo precisa voltar ao presente para deixar de crescer na minha cabeça?",
    },
    en: {
      core: "The Nine of Swords represents worry, guilt, and thoughts that grow when left alone.",
      question: "Which fear needs to return to the present so it stops growing in my mind?",
    },
  },
  "swords-ten": {
    pt: {
      core: "O Dez de Espadas representa fim, rendição e o alívio possível quando insistir deixa de ser opção.",
      question: "Que insistência chegou ao limite e pode finalmente ser encerrada?",
    },
    en: {
      core: "The Ten of Swords represents ending, surrender, and relief when insistence is no longer an option.",
      question: "Which insistence has reached its limit and can finally be ended?",
    },
  },
  "swords-page": {
    pt: {
      core: "O Pajem de Espadas representa curiosidade, atenção e a informação que ajuda a enxergar melhor.",
      question: "Que informação preciso verificar antes de tirar uma conclusão?",
    },
    en: {
      core: "The Page of Swords represents curiosity, attention, and information that helps you see more clearly.",
      question: "Which information do I need to verify before drawing a conclusion?",
    },
  },
  "swords-knight": {
    pt: {
      core: "O Cavaleiro de Espadas representa rapidez mental, decisão e o risco de avançar sem medir o impacto.",
      question: "Onde preciso desacelerar uma resposta para não transformar precisão em ataque?",
    },
    en: {
      core: "The Knight of Swords represents mental speed, decision, and the risk of moving without measuring impact.",
      question: "Where do I need to slow an answer so precision does not become attack?",
    },
  },
  "swords-queen": {
    pt: {
      core: "A Rainha de Espadas representa discernimento, verdade e limites ditos com elegância.",
      question: "Que verdade posso dizer com clareza sem perder meu cuidado?",
    },
    en: {
      core: "The Queen of Swords represents discernment, truth, and boundaries spoken with elegance.",
      question: "Which truth can I say clearly without losing my care?",
    },
  },
  "swords-king": {
    pt: {
      core: "O Rei de Espadas representa razão, autoridade e uma decisão guiada por visão ampla.",
      question: "Que critério claro deve orientar minha próxima decisão?",
    },
    en: {
      core: "The King of Swords represents reason, authority, and a decision guided by a wide view.",
      question: "Which clear criterion should guide my next decision?",
    },
  },
  "pentacles-ace": {
    pt: {
      core: "O Ás de Ouros representa oportunidade concreta, semente e um começo que precisa de cuidado prático.",
      question: "Que possibilidade pequena posso plantar na minha rotina?",
    },
    en: {
      core: "The Ace of Pentacles represents a concrete opportunity, a seed, and a beginning needing practical care.",
      question: "Which small possibility can I plant in my routine?",
    },
  },
  "pentacles-two": {
    pt: {
      core: "O Dois de Ouros representa adaptação, ritmo e a arte de reorganizar prioridades.",
      question: "O que precisa mudar de ritmo para eu não me perder no malabarismo?",
    },
    en: {
      core: "The Two of Pentacles represents adaptation, rhythm, and reorganising priorities.",
      question: "What needs a new pace so I do not lose myself in the juggling?",
    },
  },
  "pentacles-three": {
    pt: {
      core: "O Três de Ouros representa colaboração, habilidade e uma construção que melhora com boa parceria.",
      question: "Com quem ou com que método posso fazer isso ganhar qualidade?",
    },
    en: {
      core: "The Three of Pentacles represents collaboration, skill, and building that improves through good partnership.",
      question: "With whom or which method can I improve the quality of this?",
    },
  },
  "pentacles-four": {
    pt: {
      core: "O Quatro de Ouros representa segurança, posse e o limite entre proteger e controlar.",
      question: "O que preciso proteger, e o que estou segurando por medo?",
    },
    en: {
      core: "The Four of Pentacles represents security, possession, and the line between protecting and controlling.",
      question: "What do I need to protect, and what am I holding from fear?",
    },
  },
  "pentacles-five": {
    pt: {
      core: "O Cinco de Ouros representa escassez, vulnerabilidade e a necessidade de aceitar apoio possível.",
      question: "Que ajuda real existe, se eu tiver coragem de pedir?",
    },
    en: {
      core: "The Five of Pentacles represents scarcity, vulnerability, and accepting possible support.",
      question: "What real help exists if I have the courage to ask?",
    },
  },
  "pentacles-six": {
    pt: {
      core: "O Seis de Ouros representa dar, receber e o equilíbrio necessário para uma troca ser saudável.",
      question: "Onde a troca está equilibrada, e onde preciso ajustar o quanto ofereço?",
    },
    en: {
      core: "The Six of Pentacles represents giving, receiving, and the balance needed for a healthy exchange.",
      question: "Where is the exchange balanced, and where do I need to adjust what I offer?",
    },
  },
  "pentacles-seven": {
    pt: {
      core: "O Sete de Ouros representa paciência, avaliação e o tempo necessário para algo amadurecer.",
      question: "O que merece continuidade, revisão ou uma decisão de parar?",
    },
    en: {
      core: "The Seven of Pentacles represents patience, assessment, and time for something to mature.",
      question: "What deserves continuation, review, or a decision to stop?",
    },
  },
  "pentacles-eight": {
    pt: {
      core: "O Oito de Ouros representa prática, ofício e a melhora que nasce da repetição cuidadosa.",
      question: "Que habilidade se fortalece se eu praticar um pouco todos os dias?",
    },
    en: {
      core: "The Eight of Pentacles represents practice, craft, and improvement born from careful repetition.",
      question: "Which skill would strengthen if I practised a little each day?",
    },
  },
  "pentacles-nine": {
    pt: {
      core: "O Nove de Ouros representa autonomia, prazer e o valor de reconhecer o que você construiu.",
      question: "Como posso desfrutar do que conquistei sem transformar autonomia em isolamento?",
    },
    en: {
      core: "The Nine of Pentacles represents autonomy, pleasure, and recognising what you have built.",
      question: "How can I enjoy what I have built without turning autonomy into isolation?",
    },
  },
  "pentacles-ten": {
    pt: {
      core: "O Dez de Ouros representa legado, estabilidade e escolhas que sustentam mais do que o momento presente.",
      question: "Que decisão de hoje cuida também do meu futuro?",
    },
    en: {
      core: "The Ten of Pentacles represents legacy, stability, and choices that support more than the present moment.",
      question: "Which decision today also cares for my future?",
    },
  },
  "pentacles-page": {
    pt: {
      core: "O Pajem de Ouros representa estudo, começo prático e a humildade de aprender fazendo.",
      question: "Que primeiro passo concreto transforma interesse em aprendizado?",
    },
    en: {
      core: "The Page of Pentacles represents study, a practical beginning, and learning by doing.",
      question: "Which concrete first step turns interest into learning?",
    },
  },
  "pentacles-knight": {
    pt: {
      core: "O Cavaleiro de Ouros representa constância, responsabilidade e progresso que não depende de pressa.",
      question: "Que rotina simples me leva adiante, mesmo devagar?",
    },
    en: {
      core: "The Knight of Pentacles represents consistency, responsibility, and progress without haste.",
      question: "Which simple routine moves me forward, even slowly?",
    },
  },
  "pentacles-queen": {
    pt: {
      core: "A Rainha de Ouros representa cuidado concreto, presença e a ligação entre corpo, casa e segurança.",
      question: "Que cuidado prático meu corpo ou meu espaço está pedindo?",
    },
    en: {
      core: "The Queen of Pentacles represents practical care, presence, and the link between body, home, and security.",
      question: "What practical care are my body or my space asking for?",
    },
  },
  "pentacles-king": {
    pt: {
      core: "O Rei de Ouros representa solidez, ética e a construção paciente de segurança real.",
      question: "Que escolha madura fortalece minha base no longo prazo?",
    },
    en: {
      core: "The King of Pentacles represents solidity, ethics, and patiently building real security.",
      question: "Which mature choice strengthens my foundation over time?",
    },
  },
};

export function getCardGuide(key: string, locale: "pt-BR" | "en") {
  const guide = CARD_GUIDES[key];
  return guide?.[locale === "en" ? "en" : "pt"] ?? null;
}
