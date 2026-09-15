type LocalizedText = {
  pt: string;
  en: string;
};

export type DailyCardGuidance = {
  nextStep: string;
  exercise: string;
};

type LocalizedGuidance = {
  nextStep: LocalizedText;
  exercise: LocalizedText;
};

const MAJOR_GUIDANCE: Record<string, LocalizedGuidance> = {
  "major-00-the-fool": {
    nextStep: {
      pt: "Escolha algo que você está adiando por querer garantia total. Faça a versão mínima desse começo, sem prometer mais do que consegue sustentar.",
      en: "Choose something you are delaying because you want total certainty. Do the smallest version of that beginning without promising more than you can sustain.",
    },
    exercise: {
      pt: "Em cinco minutos, escreva: o que eu faria se não precisasse acertar de primeira? Escolha uma ação segura dessa lista e faça apenas o primeiro minuto agora.",
      en: "In five minutes, write: what would I do if I did not need to get it right the first time? Choose one safe action from the list and do only its first minute now.",
    },
  },
  "major-01-the-magician": {
    nextStep: {
      pt: "Pare de procurar mais uma ferramenta. Liste o recurso, a pessoa ou a habilidade que já está ao seu alcance e use um deles para iniciar a próxima ação.",
      en: "Stop looking for one more tool. Name the resource, person, or skill already within reach and use one of them to begin the next action.",
    },
    exercise: {
      pt: "Divida uma folha em três partes: já tenho, preciso pedir, posso aprender. Preencha uma linha em cada parte e transforme o primeiro item em uma ação de hoje.",
      en: "Divide a page into three parts: already have, need to ask for, can learn. Fill in one line for each and turn the first item into today's action.",
    },
  },
  "major-02-the-high-priestess": {
    nextStep: {
      pt: "Não force uma resposta para aliviar a ansiedade. Afaste por alguns minutos o ruído que está competindo com aquilo que você já percebeu.",
      en: "Do not force an answer just to relieve anxiety. Step away for a few minutes from the noise competing with what you already notice.",
    },
    exercise: {
      pt: "Fique dois minutos sem tela e complete três vezes: eu já sei que... Depois, circule a frase que você vinha evitando.",
      en: "Spend two minutes without a screen and complete three times: I already know that... Then circle the sentence you have been avoiding.",
    },
  },
  "major-03-the-empress": {
    nextStep: {
      pt: "Escolha algo vivo que depende de constância — seu corpo, uma relação, uma ideia ou sua casa — e ofereça cuidado antes de cobrar resultado.",
      en: "Choose something alive that depends on consistency — your body, a relationship, an idea, or your home — and offer care before demanding results.",
    },
    exercise: {
      pt: "Faça uma lista de três necessidades suas. Atenda hoje a menor delas de forma concreta, sem transformar cuidado em recompensa por produtividade.",
      en: "List three needs of your own. Meet the smallest one concretely today, without turning care into a reward for productivity.",
    },
  },
  "major-04-the-emperor": {
    nextStep: {
      pt: "Escolha um limite ou uma estrutura que reduza o improviso. Defina quem faz o quê, até quando e o que não cabe mais nesta etapa.",
      en: "Choose one boundary or structure that reduces improvisation. Define who does what, by when, and what no longer belongs in this stage.",
    },
    exercise: {
      pt: "Escreva uma regra simples que protegeria sua energia hoje. Comunique-a em uma frase curta ou coloque-a visível onde a decisão acontece.",
      en: "Write one simple rule that would protect your energy today. Communicate it in one short sentence or place it where the decision happens.",
    },
  },
  "major-05-the-hierophant": {
    nextStep: {
      pt: "Procure uma orientação confiável para o ponto em que você está travado, mas mantenha o direito de adaptar o conselho à sua realidade.",
      en: "Seek trustworthy guidance for the point where you are stuck, while keeping the right to adapt the advice to your reality.",
    },
    exercise: {
      pt: "Escolha uma fonte ou pessoa que realmente conheça o assunto. Anote uma pergunta objetiva e um princípio que você pode testar hoje.",
      en: "Choose a source or person who genuinely knows the subject. Write one precise question and one principle you can test today.",
    },
  },
  "major-06-the-lovers": {
    nextStep: {
      pt: "Compare a escolha que combina com seus valores com a escolha que apenas alivia a pressão agora. Dê preferência à primeira, mesmo que ela peça uma conversa honesta.",
      en: "Compare the choice that matches your values with the one that only relieves pressure now. Prefer the first, even if it asks for an honest conversation.",
    },
    exercise: {
      pt: "Complete duas frases: se eu me respeitar, eu escolho...; se eu apenas tentar agradar, eu escolho... Observe a diferença sem se julgar.",
      en: "Complete two sentences: if I respect myself, I choose...; if I only try to please, I choose... Notice the difference without judging yourself.",
    },
  },
  "major-07-the-chariot": {
    nextStep: {
      pt: "Escolha uma direção e retire uma distração que disputa sua energia. Movimento não é fazer tudo; é conduzir o que importa.",
      en: "Choose one direction and remove one distraction competing for your energy. Movement is not doing everything; it is steering what matters.",
    },
    exercise: {
      pt: "Defina o destino desta semana em uma frase. Em seguida, bloqueie vinte minutos no calendário para o próximo passo que depende apenas de você.",
      en: "Define this week's destination in one sentence. Then block twenty minutes in your calendar for the next step that depends only on you.",
    },
  },
  "major-08-strength": {
    nextStep: {
      pt: "Troque força bruta por presença. Responda ao que está acontecendo sem se abandonar e sem precisar dominar outra pessoa.",
      en: "Trade force for presence. Respond to what is happening without abandoning yourself or needing to control another person.",
    },
    exercise: {
      pt: "Antes da próxima resposta difícil, solte os ombros e conte até dez. Diga o que é verdadeiro em uma frase, sem aumentar o tom.",
      en: "Before your next difficult response, lower your shoulders and count to ten. Say what is true in one sentence without raising your voice.",
    },
  },
  "major-09-the-hermit": {
    nextStep: {
      pt: "Reduza a opinião externa por um momento. Vá até o ponto da questão que só você pode reconhecer e escolha a resposta mais simples que continua verdadeira.",
      en: "Reduce outside opinions for a moment. Go to the part of the question only you can recognize and choose the simplest answer that remains true.",
    },
    exercise: {
      pt: "Caminhe ou fique em silêncio por dez minutos sem consumir conteúdo. Ao final, escreva uma frase sobre o que ganhou clareza quando ninguém opinou.",
      en: "Walk or sit in silence for ten minutes without consuming content. At the end, write one sentence about what became clearer when nobody gave an opinion.",
    },
  },
  "major-10-wheel-of-fortune": {
    nextStep: {
      pt: "Separe o que mudou sem sua autorização do que ainda pode ser ajustado por você. Trabalhe na segunda parte sem tentar controlar o ciclo inteiro.",
      en: "Separate what changed without your permission from what you can still adjust. Work on the second part without trying to control the whole cycle.",
    },
    exercise: {
      pt: "Faça duas colunas: fora do meu controle e ao meu alcance. Coloque três itens em cada uma e escolha uma ação pequena da segunda coluna.",
      en: "Make two columns: outside my control and within my reach. Put three items in each and choose one small action from the second column.",
    },
  },
  "major-11-justice": {
    nextStep: {
      pt: "Olhe para os fatos antes de construir uma defesa. Reconheça sua parte, o limite da outra pessoa e a decisão que trata os dois com honestidade.",
      en: "Look at the facts before building a defence. Recognize your part, the other person's boundary, and the decision that treats both honestly.",
    },
    exercise: {
      pt: "Escreva três linhas: fato observado, história que contei sobre ele, reparo ou decisão necessária. Aja somente sobre a primeira e a terceira.",
      en: "Write three lines: observed fact, story I told myself about it, repair or decision needed. Act only on the first and third.",
    },
  },
  "major-12-the-hanged-man": {
    nextStep: {
      pt: "Pare de repetir a mesma tentativa esperando outro resultado. Suspenda a pressa e procure o ângulo que a situação está pedindo.",
      en: "Stop repeating the same attempt while expecting a different result. Suspend the rush and look for the angle the situation is asking for.",
    },
    exercise: {
      pt: "Descreva o problema em cinco linhas. Depois, escreva a versão que alguém de fora — sem sua urgência — daria para a mesma situação.",
      en: "Describe the problem in five lines. Then write the version someone outside your urgency would give to the same situation.",
    },
  },
  "major-13-death": {
    nextStep: {
      pt: "Nomeie o que já terminou, mesmo que ainda ocupe espaço na sua rotina. Retire hoje uma obrigação, objeto ou hábito que pertence à etapa anterior.",
      en: "Name what has already ended, even if it still occupies space in your routine. Remove one obligation, object, or habit that belongs to the previous stage.",
    },
    exercise: {
      pt: "Escreva: eu não preciso continuar carregando... Complete a frase e escolha uma forma concreta de encerrar, devolver ou deixar ir essa parte.",
      en: "Write: I do not need to keep carrying... Complete the sentence and choose one concrete way to end, return, or release that part.",
    },
  },
  "major-14-temperance": {
    nextStep: {
      pt: "Reduza o excesso em vez de exigir uma virada radical. Misture descanso e ação na medida que seu corpo consegue sustentar.",
      en: "Reduce excess instead of demanding a radical turn. Mix rest and action in the measure your body can sustain.",
    },
    exercise: {
      pt: "Escolha uma tarefa, uma pausa e uma necessidade do corpo. Coloque as três em uma sequência possível para as próximas horas.",
      en: "Choose one task, one pause, and one bodily need. Put all three into a possible sequence for the next few hours.",
    },
  },
  "major-15-the-devil": {
    nextStep: {
      pt: "Dê nome ao apego que está prometendo alívio rápido. Veja qual preço ele cobra e escolha um limite que devolva espaço à sua vontade.",
      en: "Name the attachment promising quick relief. See what it costs and choose a boundary that returns space to your own will.",
    },
    exercise: {
      pt: "Complete: eu digo que preciso de... para conseguir... Pergunte o que aconteceria se você testasse uma forma menos dependente desse padrão.",
      en: "Complete: I say I need... in order to... Ask what would happen if you tested a way that depends less on this pattern.",
    },
  },
  "major-16-the-tower": {
    nextStep: {
      pt: "Não gaste mais energia sustentando uma versão que os fatos já desmentiram. Proteja o essencial e reorganize a partir do que é verdadeiro.",
      en: "Do not spend more energy sustaining a version the facts have already disproved. Protect what is essential and reorganize from what is true.",
    },
    exercise: {
      pt: "Liste o que caiu, o que permanece e o que precisa de reparo. Escolha apenas o reparo que evita um dano maior hoje.",
      en: "List what fell, what remains, and what needs repair. Choose only the repair that prevents greater harm today.",
    },
  },
  "major-17-the-star": {
    nextStep: {
      pt: "Procure a ação que devolve confiança sem exigir prova imediata. Faça algo pequeno que trate seu futuro como possibilidade real.",
      en: "Look for the action that restores trust without demanding immediate proof. Do something small that treats your future as a real possibility.",
    },
    exercise: {
      pt: "Anote uma coisa que está se reparando, ainda que devagar. Cuide dela por dez minutos sem medir o resultado.",
      en: "Write down one thing that is repairing itself, even slowly. Care for it for ten minutes without measuring the result.",
    },
  },
  "major-18-the-moon": {
    nextStep: {
      pt: "Não transforme sensação em prova. Separe o que você sabe, o que teme e o que ainda precisa observar antes de decidir.",
      en: "Do not turn a feeling into proof. Separate what you know, what you fear, and what you still need to observe before deciding.",
    },
    exercise: {
      pt: "Divida uma página em fato, medo e hipótese. Preencha cada parte e adie uma conclusão que dependa apenas da hipótese.",
      en: "Divide a page into fact, fear, and hypothesis. Fill in each part and postpone any conclusion that depends only on the hypothesis.",
    },
  },
  "major-19-the-sun": {
    nextStep: {
      pt: "Escolha a versão mais simples e honesta da próxima ação. Clareza também é deixar de esconder o que já está funcionando.",
      en: "Choose the simplest and most honest version of the next action. Clarity also means stopping the hiding of what is already working.",
    },
    exercise: {
      pt: "Conte para alguém de confiança uma coisa que deu certo sem diminuir sua importância. Depois, use essa evidência para orientar o próximo passo.",
      en: "Tell someone you trust about one thing that worked without minimizing it. Then use that evidence to guide the next step.",
    },
  },
  "major-20-judgement": {
    nextStep: {
      pt: "Responda ao chamado que você já reconheceu. Não precisa consertar o passado inteiro; precisa assumir a próxima decisão com mais maturidade.",
      en: "Answer the calling you have already recognized. You do not need to fix the whole past; you need to take the next decision with more maturity.",
    },
    exercise: {
      pt: "Escreva o que a experiência ensinou, o que não se repete e qual responsabilidade presente nasce disso. Faça uma ação que honre essa aprendizagem.",
      en: "Write what the experience taught, what will not be repeated, and what present responsibility comes from it. Take one action that honours that learning.",
    },
  },
  "major-21-the-world": {
    nextStep: {
      pt: "Reconheça o ciclo que chegou a uma forma possível de conclusão. Feche uma ponta antes de abrir outra, para que expansão não vire dispersão.",
      en: "Recognize the cycle that has reached a possible completion. Close one loose end before opening another, so expansion does not become dispersion.",
    },
    exercise: {
      pt: "Anote três coisas que você atravessou e uma etapa que ainda precisa de fechamento. Faça hoje o gesto que marca essa conclusão.",
      en: "Write down three things you have moved through and one stage that still needs closure. Make the gesture that marks that completion today.",
    },
  },
};

const SUIT_CONTEXT: Record<string, LocalizedText> = {
  wands: {
    pt: "Traga isso para uma meta, projeto ou impulso que pede movimento.",
    en: "Bring this to a goal, project, or impulse that asks for movement.",
  },
  cups: {
    pt: "Traga isso para um sentimento ou vínculo; fale do que é seu sem tentar controlar o outro.",
    en: "Bring this to a feeling or bond; speak from your side without trying to control the other person.",
  },
  swords: {
    pt: "Traga isso para uma decisão, conversa ou pensamento repetitivo; separe fato de interpretação.",
    en: "Bring this to a decision, conversation, or recurring thought; separate fact from interpretation.",
  },
  pentacles: {
    pt: "Traga isso para o corpo, dinheiro, trabalho ou rotina; escolha algo que possa ser visto e medido.",
    en: "Bring this to your body, money, work, or routine; choose something that can be seen and measured.",
  },
};

const RANK_ACTION: Record<string, LocalizedText> = {
  ace: {
    pt: "Comece pela menor ação que dá forma ao que está nascendo.",
    en: "Begin with the smallest action that gives shape to what is emerging.",
  },
  two: {
    pt: "Compare duas opções reais e escolha um primeiro passo, sem tentar decidir o caminho inteiro hoje.",
    en: "Compare two real options and choose a first step without trying to decide the whole path today.",
  },
  three: {
    pt: "Observe o que já foi iniciado, ajuste o alcance e envolva o recurso ou a pessoa que pode fazer isso avançar.",
    en: "Notice what has already begun, adjust its reach, and involve the resource or person that can move it forward.",
  },
  four: {
    pt: "Proteja uma base que já funciona antes de exigir uma nova mudança.",
    en: "Protect a foundation that already works before demanding another change.",
  },
  five: {
    pt: "Nomeie o que está acontecendo sem aumentar a história; escolha a parte que está sob seu controle e cuide dela.",
    en: "Name what is happening without enlarging the story; choose the part within your control and tend to it.",
  },
  six: {
    pt: "Reconheça o que já avançou e aceite, ofereça ou peça o apoio que torna o próximo passo mais leve.",
    en: "Recognize what has already moved forward and accept, offer, or ask for support that makes the next step lighter.",
  },
  seven: {
    pt: "Faça uma pausa para avaliar evidências, limites e custo antes de insistir ou recuar.",
    en: "Pause to assess evidence, boundaries, and cost before insisting or stepping back.",
  },
  eight: {
    pt: "Interrompa a demora com uma ação de duração definida e pequena o bastante para começar agora.",
    en: "Break the delay with an action that has a defined duration and is small enough to begin now.",
  },
  nine: {
    pt: "Reconheça sua experiência e preserve uma reserva de energia; não entregue tudo para provar que consegue.",
    en: "Recognize your experience and preserve an energy reserve; do not give everything away to prove you can.",
  },
  ten: {
    pt: "Identifique o peso que não precisa continuar só com você e encerre, delegue ou renegocie uma parte.",
    en: "Identify the weight that does not need to remain yours alone and end, delegate, or renegotiate one part.",
  },
  page: {
    pt: "Transforme curiosidade em aprendizado aplicado: escolha uma pergunta e estude apenas o suficiente para testá-la.",
    en: "Turn curiosity into applied learning: choose one question and study only enough to test it.",
  },
  knight: {
    pt: "Dê movimento ao que está parado, mas defina antes onde termina o impulso e começa a imprudência.",
    en: "Move what is stalled, but define first where momentum ends and recklessness begins.",
  },
  queen: {
    pt: "Confie na sua experiência e conduza a situação a partir do que você sabe, sem pedir validação para cada passo.",
    en: "Trust your experience and lead the situation from what you know without asking for validation at every step.",
  },
  king: {
    pt: "Escolha uma decisão sustentável e assuma a responsabilidade de mantê-la depois do entusiasmo inicial.",
    en: "Choose a sustainable decision and take responsibility for keeping it after the initial enthusiasm.",
  },
};

const RANK_EXERCISE: Record<string, LocalizedText> = {
  ace: {
    pt: "Escreva uma frase sobre o que quer começar e faça o primeiro gesto em até cinco minutos.",
    en: "Write one sentence about what you want to begin and take the first step within five minutes.",
  },
  two: {
    pt: "Liste duas possibilidades. Para cada uma, escreva o que ela amplia, o que exige e qual teste pequeno cabe nesta semana.",
    en: "List two possibilities. For each, write what it expands, what it asks, and what small test fits this week.",
  },
  three: {
    pt: "Registre o que já foi feito, o próximo alcance possível e uma mensagem ou tarefa que leve isso adiante.",
    en: "Record what is done, the next possible reach, and one message or task that moves it forward.",
  },
  four: {
    pt: "Anote o que hoje te dá base. Preserve uma parte disso antes de assumir uma nova demanda.",
    en: "Write down what gives you a foundation today. Protect one part of it before taking on a new demand.",
  },
  five: {
    pt: "Escreva o que aconteceu, o que isso despertou em você e qual próximo gesto evita piorar a situação.",
    en: "Write what happened, what it stirred in you, and which next action prevents the situation from getting worse.",
  },
  six: {
    pt: "Anote uma conquista recente e identifique um apoio que você pode oferecer ou aceitar sem vergonha.",
    en: "Write one recent achievement and identify support you can offer or accept without shame.",
  },
  seven: {
    pt: "Faça três colunas: evidência, receio e próximo teste. Preencha uma linha em cada.",
    en: "Make three columns: evidence, concern, and next test. Fill in one line for each.",
  },
  eight: {
    pt: "Programe quinze minutos e faça uma única tarefa relacionada à carta até o timer terminar.",
    en: "Set a fifteen-minute timer and do one task related to the card until it ends.",
  },
  nine: {
    pt: "Liste o que já sustenta você e escolha uma forma de proteger sua energia antes de responder ao mundo.",
    en: "List what already supports you and choose one way to protect your energy before responding to the world.",
  },
  ten: {
    pt: "Escreva o que você está carregando, o que pode ser encerrado e quem ou o que pode dividir o peso.",
    en: "Write what you are carrying, what can end, and who or what can share the weight.",
  },
  page: {
    pt: "Escolha uma pergunta concreta e reserve dez minutos para aprender algo que ajude a testá-la na prática.",
    en: "Choose one concrete question and spend ten minutes learning something that helps test it in practice.",
  },
  knight: {
    pt: "Escolha uma ação com começo e fim claros. Faça-a hoje e reveja o resultado antes de acelerar de novo.",
    en: "Choose an action with a clear beginning and end. Do it today and review the result before speeding up again.",
  },
  queen: {
    pt: "Complete: eu sei que... Depois, use essa certeza para orientar uma conversa, cuidado ou decisão.",
    en: "Complete: I know that... Then use that certainty to guide one conversation, act of care, or decision.",
  },
  king: {
    pt: "Defina o compromisso que você consegue sustentar por sete dias e anote como vai perceber que ele está funcionando.",
    en: "Define the commitment you can sustain for seven days and write how you will know it is working.",
  },
};

function localized(value: LocalizedText, isEnglish: boolean) {
  return isEnglish ? value.en : value.pt;
}

export function getDailyCardGuidance(
  cardKey: string,
  reversed: boolean,
  isEnglish: boolean
): DailyCardGuidance {
  const major = MAJOR_GUIDANCE[cardKey];
  if (major) {
    return {
      nextStep: localized(major.nextStep, isEnglish),
      exercise: localized(major.exercise, isEnglish),
    };
  }

  const [suit, rank] = cardKey.split("-");
  const action = RANK_ACTION[rank] ?? RANK_ACTION.ace;
  const exercise = RANK_EXERCISE[rank] ?? RANK_EXERCISE.ace;
  const context = SUIT_CONTEXT[suit] ?? SUIT_CONTEXT.swords;
  const blockPrefix: LocalizedText = {
    pt: "Antes de agir, observe o excesso ou bloqueio que está atrapalhando esse movimento. ",
    en: "Before acting, notice the excess or block getting in the way of this movement. ",
  };

  return {
    nextStep: `${reversed ? localized(blockPrefix, isEnglish) : ""}${localized(action, isEnglish)} ${localized(context, isEnglish)}`,
    exercise: `${reversed ? localized(blockPrefix, isEnglish) : ""}${localized(exercise, isEnglish)}`,
  };
}
