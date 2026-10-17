import type { DailyTransit } from "./daily-sky.ts";
import type { NatalAspectType, NatalBody, ZodiacSign } from "./natal-chart.ts";
import {
  getAspectInterpretation,
  getBodyInterpretation,
  getHouseInterpretation,
  getSignInterpretation,
  type AstrologyLocale,
} from "./interpretations.ts";

type PairReading = { possibility: string; tension: string; practice: string };
type BilingualPair = Record<AstrologyLocale, PairReading>;

function pair(pt: [string, string, string], en: [string, string, string]): BilingualPair {
  return {
    "pt-BR": { possibility: pt[0], tension: pt[1], practice: pt[2] },
    en: { possibility: en[0], tension: en[1], practice: en[2] },
  };
}

// Editorial readings of all 55 planet pairs, including same-planet contacts.
// The pair describes the relationship; the aspect describes how to work with it.
// Transit direction, signs and the actual natal house are added separately below.
const planetPairs: Record<NatalBody, Partial<Record<NatalBody, BilingualPair>>> = {
  Sun: {
    Sun: pair(
      ["Este encontro põe sua direção pessoal em foco: o que você escolhe precisa combinar com a pessoa que está se tornando.", "A vontade de provar seu valor pode competir com a necessidade de escolher por si, sem depender de aplauso.", "Revise uma meta e retire dela uma expectativa que pertence mais aos outros do que a você."],
      ["This meeting brings your personal direction into focus: your choices need to fit the person you are becoming.", "The urge to prove your worth can compete with the need to choose for yourself rather than for applause.", "Review one goal and remove an expectation that belongs more to other people than to you."],
    ),
    Moon: pair(
      ["Vontade e necessidade emocional podem se escutar: avançar não precisa significar abandonar o que dá segurança.", "O caminho que você quer seguir pode pedir algo diferente do que seu corpo e seus hábitos conseguem sustentar agora.", "Antes de confirmar um plano, nomeie tanto o que deseja quanto o cuidado de que precisa para realizá-lo."],
      ["Your intentions and emotional needs can listen to each other: moving forward need not mean losing your sense of safety.", "The direction you want to take may ask for something your body and familiar routines cannot comfortably sustain yet.", "Before confirming a plan, name both what you want and the support you need to carry it out."],
    ),
    Mercury: pair(
      ["Pensamento e expressão pessoal se aproximam: pode ficar mais simples explicar uma decisão e encontrar palavras que representem você.", "Defender uma ideia pode parecer o mesmo que defender seu valor pessoal, tornando mais difícil ouvir uma correção.", "Explique uma escolha em poucas frases e peça que a outra pessoa diga o que entendeu."],
      ["Thinking and self-expression come together: it may become easier to explain a decision in words that feel like your own.", "Defending an idea can feel like defending your worth, making a correction harder to hear.", "Explain one choice in a few sentences and ask the other person what they understood."],
    ),
    Venus: pair(
      ["O que você valoriza pode ganhar espaço nas suas escolhas: afeto, prazer e expressão pessoal encontram um ponto de encontro.", "Ser aceito pode começar a pesar mais do que ser coerente consigo, sobretudo ao negociar atenção ou reconhecimento.", "Escolha um gesto de afeto ou de criação que expresse um gosto seu, sem depender da aprovação de alguém."],
      ["What you value can find room in your choices: affection, enjoyment and self-expression have a chance to meet.", "Being liked can begin to matter more than being true to yourself, especially when seeking attention or recognition.", "Choose an affectionate or creative gesture that reflects your taste without depending on someone's approval."],
    ),
    Mars: pair(
      ["A vontade de agir pode se alinhar à sua direção: há um convite a sair da intenção e começar algo que importa.", "A necessidade de se afirmar pode virar pressa, disputa ou esforço além do necessário para provar que consegue.", "Defina uma ação com começo e fim e deixe claro o limite que você não pretende ultrapassar."],
      ["The urge to act can align with your direction, inviting you to turn an intention into a meaningful first step.", "The need to assert yourself can turn into haste, competition or excessive effort to prove you are capable.", "Define one action with a clear beginning and end, and name the boundary you will not cross."],
    ),
    Jupiter: pair(
      ["Júpiter e Sol aproximam crescimento e confiança pessoal. Pode ser mais fácil apresentar uma ideia, assumir uma responsabilidade escolhida ou reconhecer uma capacidade que você vinha diminuindo.", "O entusiasmo pode aumentar sua confiança mais rápido do que seus recursos. Assumir espaço é diferente de aceitar todas as oportunidades ou prometer além do que consegue entregar.", "Escolha uma oportunidade de crescimento e confira tempo, recursos e motivo antes de dizer sim."],
      ["Jupiter and the Sun bring growth and personal confidence together. Presenting an idea, taking on a chosen responsibility or recognising an ability you have played down may feel more accessible.", "Enthusiasm can grow faster than your resources. Taking up space is different from accepting every opportunity or promising more than you can deliver.", "Choose one opportunity to grow and check your time, resources and reasons before saying yes."],
    ),
    Saturn: pair(
      ["Propósito e compromisso podem trabalhar juntos: a confiança cresce quando você transforma uma intenção em algo consistente.", "Cobrança e medo de falhar podem diminuir sua espontaneidade, como se seu valor dependesse de produzir ou acertar sempre.", "Separe uma responsabilidade que é sua de uma cobrança desnecessária e estabeleça uma meta realizável."],
      ["Purpose and commitment can work together: confidence grows when you give an intention a reliable form.", "Pressure and fear of failure can limit spontaneity, as though your worth depended on always producing or getting things right.", "Separate a genuine responsibility from unnecessary pressure and set one achievable goal."],
    ),
    Uranus: pair(
      ["Originalidade e identidade se encontram: experimentar um papel diferente pode revelar uma escolha que combina melhor com você.", "Romper com expectativas pode se tornar uma reação automática, antes de você descobrir o que realmente quer colocar no lugar.", "Teste uma mudança reversível na rotina ou na forma de se apresentar antes de fazer uma ruptura maior."],
      ["Originality meets identity: trying a different role may reveal a choice that fits you better.", "Breaking with expectations can become an automatic reaction before you know what you want to put in their place.", "Try a reversible change in your routine or self-expression before making a larger break."],
    ),
    Neptune: pair(
      ["Imaginação e identidade podem abrir espaço para uma expressão mais sensível, criativa e menos presa a um papel rígido.", "A imagem de quem você gostaria de ser pode se misturar ao que é possível agora, deixando desejos e limites pouco definidos.", "Dê forma a uma inspiração num rascunho e confira qual parte dela já cabe na sua vida concreta."],
      ["Imagination and identity can make room for a more sensitive, creative expression beyond a rigid role.", "The person you wish to be can become mixed up with what is possible now, leaving desires and boundaries unclear.", "Give an inspiration a first draft and check which part already fits your practical circumstances."],
    ),
    Pluto: pair(
      ["Identidade e transformação se aproximam: reconhecer o que perdeu sentido pode ajudar você a assumir uma direção mais própria.", "O medo de perder influência ou reconhecimento pode endurecer sua posição e transformar uma escolha em disputa de poder.", "Identifique onde você pode agir sem controlar a resposta de outra pessoa."],
      ["Identity and transformation come together: recognising what no longer feels meaningful can help you choose a direction of your own.", "Fear of losing influence or recognition can harden your position and turn a choice into a power struggle.", "Identify where you can act without controlling another person's response."],
    ),
  },
  Moon: {
    Moon: pair(
      ["O contato entre as duas Luas destaca seu ritmo emocional e os cuidados que realmente restauram você. Familiaridade pode trazer alívio, sem que toda reação antiga precise ser repetida.", "Uma sensação conhecida pode ativar um hábito antigo de proteção, mesmo quando a situação atual pede uma resposta diferente.", "Observe o que está sentindo agora e escolha um cuidado concreto: descanso, alimento, espaço ou uma conversa acolhedora."],
      ["Contact between the two Moons highlights your emotional rhythm and the care that actually restores you. Familiarity can be comforting without every old reaction needing to be repeated.", "A familiar feeling can activate an old protective habit even when the present situation calls for a different response.", "Notice what you feel now and choose something practical: rest, food, space or a supportive conversation."],
    ),
    Mercury: pair(
      ["Sentir e nomear podem se aproximar: conversar ou escrever ajuda a distinguir uma emoção de uma interpretação sobre ela.", "O pensamento pode tentar explicar o sentimento antes de acolhê-lo, ou uma reação emocional pode virar uma conclusão apressada.", "Escreva separadamente: o que aconteceu, o que senti e o que ainda não sei."],
      ["Feeling and naming can come closer: talking or writing helps distinguish an emotion from your interpretation of it.", "Thinking may try to explain a feeling before making room for it, or an emotional reaction may become a rushed conclusion.", "Write three separate things: what happened, what you felt and what you do not yet know."],
    ),
    Venus: pair(
      ["Cuidado e afeto podem se reforçar: pequenos gestos de presença tornam mais claro o que faz você se sentir recebido.", "O desejo de conforto pode se confundir com a necessidade de agradar ou de receber confirmação afetiva imediata.", "Peça um tipo específico de cuidado em vez de esperar que a outra pessoa adivinhe."],
      ["Care and affection can reinforce each other: small gestures of presence help clarify what makes you feel welcomed.", "The wish for comfort can become confused with pleasing others or needing immediate reassurance.", "Ask for one specific kind of care rather than hoping the other person will guess."],
    ),
    Mars: pair(
      ["Emoção e ação podem colaborar: reconhecer o que incomoda ajuda a defender um limite sem ignorar a própria necessidade de cuidado.", "Uma necessidade emocional pode sair como irritação ou urgência, tornando difícil distinguir o que você sente do que quer exigir.", "Antes de responder, nomeie a necessidade por trás da irritação e formule um pedido claro, sem acusação."],
      ["Emotion and action can work together: recognising what bothers you helps you defend a boundary while respecting your need for care.", "An emotional need may come out as irritation or urgency, making it hard to distinguish what you feel from what you want to demand.", "Before responding, name the need behind your irritation and make a clear request without an accusation."],
    ),
    Jupiter: pair(
      ["Acolhimento e confiança podem se ampliar: procurar apoio ou dar nome a uma esperança ajuda a sair de uma preocupação fechada em si mesma.", "Buscar alívio pode levar a minimizar um sentimento difícil ou assumir compromissos de cuidado maiores do que consegue sustentar.", "Compartilhe uma preocupação com alguém disponível e combine um apoio que caiba na realidade dos dois."],
      ["Care and confidence can expand together: seeking support or naming a hope can help you step outside a worry that has become inward-looking.", "Seeking relief can lead to minimising a difficult feeling or taking on more caring commitments than you can sustain.", "Share one concern with someone who is available and agree on support that is realistic for both of you."],
    ),
    Saturn: pair(
      ["Segurança emocional pode ganhar uma estrutura: um limite respeitoso ou uma rotina estável ajuda o cuidado a durar.", "Responsabilidades podem pesar sobre suas necessidades, fazendo o descanso parecer culpa ou o pedido de ajuda parecer fraqueza.", "Reserve um cuidado básico na agenda e reveja uma obrigação que não precisa ser carregada sozinho."],
      ["Emotional security can gain structure: a respectful boundary or a steady routine helps care become sustainable.", "Responsibilities may weigh on your needs, making rest feel guilty or asking for help feel like weakness.", "Make room for basic care in your schedule and reconsider a responsibility you need not carry alone."],
    ),
    Uranus: pair(
      ["Uma mudança de hábito pode abrir espaço para respirar: segurança não precisa significar fazer tudo sempre do mesmo jeito.", "A necessidade de liberdade pode colidir com o que é familiar, trazendo inquietação diante de proximidade ou rotina.", "Altere um hábito pequeno e mantenha uma referência de cuidado enquanto testa o novo."],
      ["A change in habit can create breathing space: security need not mean doing everything the same way.", "The need for freedom can clash with familiar comforts, bringing restlessness around closeness or routine.", "Change one small habit while keeping a reliable source of care as you try something new."],
    ),
    Neptune: pair(
      ["Sensibilidade e imaginação podem aprofundar sua escuta emocional e sua relação com arte, silêncio e descanso.", "O clima ao redor pode se misturar ao que você sente, dificultando distinguir empatia de assumir emoções ou responsabilidades alheias.", "Faça uma pausa sem estímulos e pergunte o que é seu sentir e o que você está absorvendo do ambiente."],
      ["Sensitivity and imagination can deepen emotional listening and your connection with art, quiet and rest.", "The atmosphere around you can blend with your own feelings, making empathy hard to distinguish from taking on other people's emotions or responsibilities.", "Pause without extra stimulation and consider what is your own feeling and what you are absorbing from your surroundings."],
    ),
    Pluto: pair(
      ["Uma emoção intensa pode revelar uma necessidade antiga que merece ser reconhecida, sem continuar governando todas as suas respostas.", "Medo de perder vínculo ou proteção pode aumentar a vontade de controlar a proximidade e a reação de alguém.", "Descreva o sentimento sem agir imediatamente sobre ele e escolha uma pessoa ou um espaço seguro para elaborá-lo."],
      ["An intense feeling can reveal an older need that deserves recognition without continuing to govern every response.", "Fear of losing connection or protection can increase the urge to control closeness and someone's reaction.", "Describe the feeling without acting on it immediately and choose a safe person or setting in which to explore it."],
    ),
  },
  Mercury: {
    Mercury: pair(
      ["Seu modo de pensar e se comunicar entra em revisão: uma ideia pode ficar mais clara quando você a reformula com as palavras de hoje.", "Repetir um raciocínio conhecido pode parecer confirmação, mesmo quando faltam informações novas.", "Releia uma mensagem importante e confira o que é fato, interpretação e pergunta ainda aberta."],
      ["Your way of thinking and communicating comes up for review: an idea may become clearer when you put it into today's words.", "Repeating a familiar argument can feel like confirmation even when there is no new information.", "Reread an important message and separate fact, interpretation and unanswered questions."],
    ),
    Venus: pair(
      ["Palavras e afeto podem se encontrar: uma conversa cuidadosa ajuda a expressar gosto, valor e expectativa sem exigir que o outro adivinhe.", "A vontade de manter uma conversa agradável pode esconder um desacordo importante ou um desejo que não foi dito.", "Expresse uma preferência com gentileza e faça espaço para uma resposta diferente da sua."],
      ["Words and affection can meet: a considerate conversation helps express preferences, values and expectations without expecting mind-reading.", "The wish to keep a conversation pleasant can conceal an important disagreement or an unspoken desire.", "Express a preference kindly and make room for an answer different from your own."],
    ),
    Mars: pair(
      ["Ideia e iniciativa podem se conectar: a comunicação fica mais útil quando nomeia uma ação e um limite concretos.", "A rapidez da resposta pode ultrapassar a escuta, transformando uma diferença de opinião em confronto.", "Antes de enviar uma resposta firme, retire acusações e diga o que precisa ser feito ou combinado."],
      ["Ideas and initiative can connect: communication becomes more useful when it names a concrete action and boundary.", "A quick response can outpace listening and turn a difference of opinion into confrontation.", "Before sending a firm reply, remove accusations and state what needs doing or agreeing."],
    ),
    Jupiter: pair(
      ["Júpiter amplia o campo de Mercúrio: estudar, conectar ideias e explicar uma visão pode ficar mais acessível. O valor está em compreender melhor, não apenas em falar mais.", "Uma ideia ampla pode deixar detalhes importantes de fora. Convicção e entusiasmo não substituem a conferência de dados, prazos e do que a outra pessoa realmente entendeu.", "Escolha uma ideia para desenvolver, procure um exemplo concreto e confira a informação antes de compartilhá-la."],
      ["Jupiter widens Mercury's field: studying, connecting ideas and explaining a vision may feel more accessible. The value lies in understanding more, rather than simply saying more.", "A broad idea can leave important details out. Conviction and enthusiasm do not replace checking facts, deadlines and what another person actually understood.", "Choose one idea to develop, find a concrete example and check the information before sharing it."],
    ),
    Saturn: pair(
      ["Pensamento e disciplina podem colaborar: organizar uma informação por etapas ajuda a transformar uma ideia complexa em algo compreensível.", "O cuidado com erros pode virar autocensura ou rigidez, como se você só pudesse falar depois de ter certeza absoluta.", "Separe um problema em partes e prepare uma pergunta objetiva sobre a parte que ainda não está clara."],
      ["Thinking and discipline can work together: organising information in stages helps make a complex idea understandable.", "Concern about mistakes can become self-censorship or rigidity, as though you could only speak once completely certain.", "Break a problem into parts and prepare one precise question about the part that remains unclear."],
    ),
    Uranus: pair(
      ["Uma conexão inesperada pode renovar seu raciocínio: olhar por outro ângulo ajuda a encontrar alternativas para um problema conhecido.", "Muitas ideias ou estímulos ao mesmo tempo podem gerar dispersão, respostas bruscas ou mudanças antes de verificar o básico.", "Registre a ideia nova, desligue uma distração e teste uma hipótese de cada vez."],
      ["An unexpected connection can refresh your thinking: another angle may reveal alternatives to a familiar problem.", "Too many ideas or stimuli at once can bring distraction, abrupt replies or changes made before checking the basics.", "Write down the new idea, remove one distraction and test one hypothesis at a time."],
    ),
    Neptune: pair(
      ["Imaginação e linguagem podem abrir espaço para metáforas, escuta sensível e formas criativas de dizer algo difícil.", "Impressão, desejo e informação podem se misturar. Uma mensagem vaga não confirma uma intenção, e intuição não resolve uma dúvida factual.", "Peça esclarecimento sobre uma informação importante e reserve a inspiração para um rascunho criativo."],
      ["Imagination and language can make room for metaphor, sensitive listening and creative ways to express something difficult.", "Impression, desire and information can become mixed up. A vague message does not confirm an intention, and intuition cannot settle a factual question.", "Ask for clarification about important information and give inspiration a place in a creative draft."],
    ),
    Pluto: pair(
      ["Pensamento e profundidade podem colaborar: investigar a causa de uma questão ajuda a sair de respostas superficiais.", "A busca por certeza pode se transformar em insistência, suspeita ou vontade de conduzir a conversa até o outro concordar.", "Faça uma pergunta aberta e considere uma evidência que possa mudar sua hipótese."],
      ["Thinking and depth can work together: exploring the cause of a question helps you move beyond a surface answer.", "The search for certainty can become insistence, suspicion or a wish to steer a conversation until the other person agrees.", "Ask an open question and consider evidence that could change your hypothesis."],
    ),
  },
  Venus: {
    Venus: pair(
      ["Seus gostos e sua forma de se vincular ganham destaque: vale reconhecer quais trocas ainda trazem prazer e reciprocidade.", "O desejo de conforto ou aprovação pode encobrir uma diferença entre o que você aprecia e o que aceita para não desagradar.", "Reveja uma escolha de afeto, prazer ou consumo e pergunte se ela ainda representa seus valores."],
      ["Your tastes and way of relating come into focus: notice which exchanges still offer enjoyment and reciprocity.", "The wish for comfort or approval can hide a gap between what you value and what you accept to avoid disappointing someone.", "Review a choice involving affection, enjoyment or spending and ask whether it still reflects your values."],
    ),
    Mars: pair(
      ["Desejo e aproximação podem encontrar um ritmo comum: expressar interesse com clareza ajuda a unir iniciativa e reciprocidade.", "A vontade de agir pode ultrapassar o ritmo do vínculo. Atração ou entusiasmo não significam que desejo, disponibilidade e limites sejam iguais para os dois.", "Diga o que deseja e pergunte pelo ritmo e pelos limites da outra pessoa antes de avançar."],
      ["Desire and connection can find a shared rhythm: expressing interest clearly helps bring initiative and reciprocity together.", "The urge to act can outpace a relationship. Attraction or enthusiasm does not mean both people share the same desire, availability or boundaries.", "Say what you want and ask about the other person's pace and boundaries before taking things further."],
    ),
    Jupiter: pair(
      ["Afeto e generosidade podem se ampliar: há espaço para apreciar uma troca, criar algo belo ou reconhecer o valor de uma relação.", "O prazer de agradar pode levar a exagerar em gastos, promessas ou disponibilidade para manter uma sensação boa.", "Escolha um gesto generoso que caiba no seu orçamento e na sua disponibilidade real."],
      ["Affection and generosity can expand: there is room to appreciate an exchange, make something beautiful or recognise a relationship's value.", "The pleasure of pleasing can encourage excessive spending, promises or availability to keep a good feeling going.", "Choose a generous gesture that fits your budget and actual availability."],
    ),
    Saturn: pair(
      ["Vênus e Saturno ligam afeto a compromisso. Cuidar pode aparecer em atitudes consistentes, acordos claros e respeito ao tempo de cada pessoa, sem depender de grandes demonstrações.", "O medo de rejeição pode se disfarçar de frieza, exigência ou excesso de obrigação. Um vínculo responsável também precisa de prazer e espaço para pedir cuidado.", "Combine algo pequeno que possa ser cumprido e diga qual gesto faria você se sentir valorizado."],
      ["Venus and Saturn connect affection with commitment. Care can take the form of consistent actions, clear agreements and respect for each person's pace rather than grand gestures.", "Fear of rejection can appear as distance, high demands or excessive obligation. A responsible relationship also needs enjoyment and room to ask for care.", "Agree on one small thing you can follow through on and say what would help you feel valued."],
    ),
    Uranus: pair(
      ["Afeto e liberdade podem conversar: renovar um acordo ou experimentar algo diferente ajuda o vínculo a respirar sem apagar a individualidade.", "A busca por novidade pode virar afastamento repentino, enquanto a necessidade de segurança pode tentar controlar uma relação que pede atualização.", "Proponha uma novidade e conversem sobre autonomia e continuidade antes de alterar um acordo."],
      ["Affection and freedom can be in conversation: refreshing an agreement or trying something different gives connection room without erasing individuality.", "The search for novelty can become abrupt withdrawal, while the need for security may try to control a relationship that needs updating.", "Suggest something new and discuss independence and continuity before changing an agreement."],
    ),
    Neptune: pair(
      ["Sensibilidade e afeto podem alimentar a criação, a delicadeza e a capacidade de apreciar o outro sem exigir uma explicação para tudo.", "Idealizar alguém ou uma experiência pode tornar difícil reconhecer limites. Sentir uma conexão não confirma reciprocidade nem uma promessa que não foi feita.", "Desfrute da inspiração e confira, numa conversa direta, qual expectativa é realmente compartilhada."],
      ["Sensitivity and affection can nourish creativity, gentleness and appreciation without needing to explain everything.", "Idealising someone or an experience can make boundaries harder to see. Feeling a connection does not confirm reciprocity or a promise nobody made.", "Enjoy the inspiration and use a direct conversation to check which expectations are genuinely shared."],
    ),
    Pluto: pair(
      ["O que você valoriza pode ganhar profundidade: reconhecer desejos e limites ajuda a construir intimidade sem abandonar o próprio valor.", "Medo de perda pode aumentar ciúme, apego ou negociação de afeto como forma de poder. Intensidade não é prova de cuidado.", "Nomeie um limite que proteja sua autonomia e observe se ele pode ser respeitado na troca."],
      ["What you value can gain depth: recognising desires and boundaries helps build intimacy without abandoning your self-worth.", "Fear of loss can increase jealousy, attachment or the use of affection as power. Intensity is not proof of care.", "Name a boundary that protects your independence and notice whether it can be respected in the exchange."],
    ),
  },
  Mars: {
    Mars: pair(
      ["Sua forma de começar e sustentar esforço fica em evidência: vale direcionar a iniciativa para uma tarefa que depende de você.", "A urgência pode alimentar impaciência ou competição sem necessidade, consumindo energia antes de definir uma prioridade.", "Escolha uma prioridade, estabeleça um limite de esforço e inclua uma pausa antes da próxima tarefa."],
      ["Your way of beginning and sustaining effort comes into focus: direct initiative towards a task within your control.", "Urgency can feed impatience or unnecessary competition, using up energy before you have chosen a priority.", "Choose one priority, set a limit on your effort and include a break before the next task."],
    ),
    Jupiter: pair(
      ["Coragem e visão podem colaborar: uma iniciativa ganha sentido quando está ligada a uma meta maior e possível.", "O entusiasmo para avançar pode reduzir sua percepção de limites e transformar confiança em excesso de esforço ou compromisso.", "Divida uma meta ambiciosa em uma primeira etapa e defina o que precisa verificar antes de ampliar o plano."],
      ["Courage and vision can work together: initiative gains meaning when connected to a larger, realistic goal.", "Enthusiasm to move forward can weaken your sense of limits, turning confidence into excessive effort or commitment.", "Break an ambitious goal into a first stage and decide what you need to check before expanding the plan."],
    ),
    Saturn: pair(
      ["Ação e disciplina podem se apoiar: um limite claro ajuda a usar sua força com constância em vez de depender de um impulso.", "A vontade de avançar pode encontrar demora, regra ou cansaço. Forçar além do limite ou desistir de tudo são respostas diferentes de ajustar o ritmo.", "Escolha uma etapa pequena, confira os limites reais e combine um prazo que possa cumprir."],
      ["Action and discipline can support each other: a clear limit helps you use effort steadily rather than relying on a burst of motivation.", "The urge to move forward may meet delay, rules or tiredness. Pushing past limits or abandoning everything is different from adjusting your pace.", "Choose a small stage, check the actual constraints and agree on a deadline you can meet."],
    ),
    Uranus: pair(
      ["Iniciativa e invenção podem abrir uma alternativa: experimentar outra forma de agir ajuda a sair de um método que já não funciona.", "Inquietação pode acelerar uma ruptura ou uma resposta brusca antes de considerar as consequências e os combinados envolvidos.", "Teste uma alternativa reversível e faça uma pausa antes de uma decisão difícil de desfazer."],
      ["Initiative and invention can open an alternative: another way of acting helps you move beyond a method that no longer works.", "Restlessness can accelerate a break or an abrupt response before you consider the consequences and existing agreements.", "Test a reversible alternative and pause before a decision that would be difficult to undo."],
    ),
    Neptune: pair(
      ["A ação pode ganhar sentido pela imaginação e pela sensibilidade: criar, colaborar ou dedicar esforço a uma causa ajuda a dar forma a uma inspiração.", "Agir sem clareza sobre o objetivo pode dispersar energia. Tentar salvar uma situação indefinida não substitui um acordo sobre responsabilidade e limite.", "Defina o resultado de uma tarefa em uma frase e confirme o que depende de você antes de começar."],
      ["Action can gain meaning through imagination and sensitivity: making, collaborating or contributing to a cause helps give inspiration a form.", "Acting without a clear aim can scatter effort. Trying to rescue an undefined situation cannot replace an agreement about responsibility and limits.", "Define a task's intended result in one sentence and confirm what depends on you before beginning."],
    ),
    Pluto: pair(
      ["Determinação e profundidade podem ajudar a enfrentar uma mudança que exige compromisso, especialmente quando a força é usada para transformar um hábito próprio.", "A necessidade de vencer pode converter uma diferença em disputa de controle. Persistir é diferente de ultrapassar limites seus ou de outra pessoa.", "Escolha o que você pode mudar na própria conduta e estabeleça um ponto de parada para o esforço."],
      ["Determination and depth can help you face a change that needs commitment, especially when effort goes into transforming your own habit.", "The need to win can turn a difference into a struggle for control. Persistence is different from crossing your own or someone else's boundaries.", "Choose what you can change in your own behaviour and establish a stopping point for the effort."],
    ),
  },
  Jupiter: {
    Jupiter: pair(
      ["Sua visão de futuro e suas crenças entram em destaque: é um convite a ampliar conhecimento e escolher o que merece crescer.", "Ter muitas possibilidades pode dificultar uma escolha. Uma crença animadora precisa continuar aberta à realidade e a novas informações.", "Escolha uma área para aprender ou expandir e defina como reconhecer um avanço concreto."],
      ["Your view of the future and your beliefs come into focus, inviting you to widen your knowledge and choose what deserves to grow.", "Too many possibilities can make choosing difficult. An encouraging belief still needs to remain open to reality and new information.", "Choose one area to learn about or develop and define what practical progress would look like."],
    ),
    Saturn: pair(
      ["Expansão e estrutura podem se equilibrar: uma ambição ganha sustentação quando encontra prazo, orçamento e continuidade.", "A vontade de ampliar pode competir com o medo de perder estabilidade. Nem crescer sem limite nem adiar indefinidamente resolve essa negociação.", "Monte uma versão viável de um plano e separe o que pode começar agora do que precisa esperar."],
      ["Expansion and structure can balance each other: an ambition gains support through a timetable, budget and continuity.", "The wish to expand can compete with fear of losing stability. Neither unlimited growth nor indefinite delay resolves that negotiation.", "Build a workable version of a plan and separate what can begin now from what needs to wait."],
    ),
    Uranus: pair(
      ["Uma perspectiva nova pode ampliar suas possibilidades: estudar outro caminho ajuda a reconhecer oportunidades fora do habitual.", "Novidade pode parecer garantia de liberdade ou crescimento, levando a trocar um plano antes de avaliar se a alternativa realmente serve a você.", "Compare a ideia nova com uma necessidade concreta e teste sua utilidade em pequena escala."],
      ["A fresh perspective can widen your possibilities: exploring another route helps reveal options beyond the familiar.", "Novelty can look like a guarantee of freedom or growth, encouraging you to replace a plan before judging whether the alternative suits you.", "Compare the new idea with a concrete need and test its usefulness on a small scale."],
    ),
    Neptune: pair(
      ["Netuno e Júpiter ligam imaginação à busca de sentido. Arte, contemplação ou um projeto solidário podem ajudar uma esperança a ganhar forma sem precisar transformá-la em certeza.", "Uma visão inspiradora pode parecer maior do que as condições reais. Acolher um ideal não exige ignorar dúvidas, limites ou informações que o contradigam.", "Escolha uma inspiração e transforme-a em um gesto pequeno, verificável e compatível com seus recursos."],
      ["Neptune and Jupiter connect imagination with the search for meaning. Art, reflection or a shared contribution can help a hope take shape without turning it into certainty.", "An inspiring vision can appear larger than practical circumstances. Valuing an ideal does not require ignoring doubts, limits or conflicting information.", "Choose one inspiration and turn it into a small, observable action that fits your resources."],
    ),
    Pluto: pair(
      ["Crescimento e transformação podem se apoiar quando você revê uma convicção e reconhece onde deseja exercer influência com responsabilidade.", "Ter certeza de uma visão pode aumentar a necessidade de convencer ou controlar. A intensidade de uma crença não prova que ela serve para todos.", "Examine uma convicção importante e procure uma pergunta que permita revê-la sem abrir mão do que é essencial."],
      ["Growth and transformation can support each other when you reconsider a conviction and decide where to use your influence responsibly.", "Certainty about a vision can increase the urge to persuade or control. The intensity of a belief does not prove it is right for everyone.", "Examine an important conviction and find a question that lets you reconsider it without losing what matters most."],
    ),
  },
  Saturn: {
    Saturn: pair(
      ["Compromissos, limites e prioridades pedem revisão: construir maturidade pode significar escolher melhor o que merece seu tempo.", "O peso da obrigação pode tornar difícil distinguir responsabilidade real de uma regra antiga que já não faz sentido.", "Reveja um compromisso e defina o que precisa ser mantido, renegociado ou encerrado com responsabilidade."],
      ["Commitments, limits and priorities invite review: growing in maturity can mean choosing more carefully what deserves your time.", "The weight of duty can make a genuine responsibility hard to distinguish from an old rule that no longer makes sense.", "Review a commitment and decide what needs to be kept, renegotiated or responsibly brought to an end."],
    ),
    Uranus: pair(
      ["Continuidade e mudança podem colaborar: atualizar uma estrutura aos poucos permite experimentar sem perder tudo o que sustenta você.", "Manter o conhecido e romper com ele podem parecer opções incompatíveis, dificultando enxergar uma mudança gradual.", "Identifique uma regra que pode ser atualizada e preserve uma referência útil durante o teste."],
      ["Continuity and change can work together: gradually updating a structure allows experimentation without losing everything that supports you.", "Keeping the familiar and breaking with it can seem incompatible, making gradual change harder to imagine.", "Identify one rule you can update while keeping a useful source of stability during the trial."],
    ),
    Neptune: pair(
      ["Imaginação e realidade podem se ajudar: um ideal ganha corpo quando encontra uma rotina, um limite e uma forma de realização possível.", "Uma responsabilidade pouco definida pode produzir frustração, enquanto rigidez em excesso pode sufocar um projeto que ainda precisa de tempo para tomar forma.", "Dê a um projeto inspirado uma tarefa concreta, um prazo de revisão e um limite de esforço."],
      ["Imagination and reality can support each other: an ideal takes shape through a routine, a boundary and an achievable form.", "An unclear responsibility can cause frustration, while excessive rigidity may stifle a project that still needs time to take shape.", "Give an inspired project one concrete task, a review date and a limit on the effort involved."],
    ),
    Pluto: pair(
      ["Estrutura e transformação podem colaborar numa revisão profunda de um compromisso ou de uma forma de exercer responsabilidade.", "O medo de perder controle pode endurecer regras ou prolongar uma estrutura esgotada. Sustentar o essencial não exige preservar tudo.", "Separe o que precisa continuar do que pode ser reorganizado e planeje uma mudança por etapas."],
      ["Structure and transformation can work together in a thorough review of a commitment or way of taking responsibility.", "Fear of losing control can harden rules or prolong an exhausted structure. Protecting what matters does not require preserving everything.", "Separate what needs to continue from what can be reorganised and plan a change in stages."],
    ),
  },
  Uranus: {
    Uranus: pair(
      ["Sua relação com liberdade e novidade entra em revisão: pode haver espaço para reconhecer uma forma mais própria de participar da vida.", "A vontade de se diferenciar pode confundir autonomia com rejeitar qualquer compromisso ou referência anterior.", "Escolha uma mudança que aumente sua autonomia e confira quais vínculos ou acordos você deseja preservar."],
      ["Your relationship with freedom and novelty comes up for review, making room to recognise a more individual way of taking part in life.", "The wish to be different can confuse independence with rejecting every commitment or earlier reference point.", "Choose a change that increases your independence and check which connections or agreements you wish to preserve."],
    ),
    Neptune: pair(
      ["Imaginação e abertura ao novo podem renovar um ideal coletivo ou uma forma de criar, sem depender apenas de caminhos conhecidos.", "Uma visão sedutora de mudança pode perder contato com necessidades concretas ou com a clareza sobre quem fará o quê.", "Teste uma ideia criativa ou coletiva com uma tarefa pequena e responsabilidades explícitas."],
      ["Imagination and openness to change can refresh a shared ideal or creative approach beyond familiar methods.", "An attractive vision of change can lose contact with practical needs or clarity about who will do what.", "Test a creative or shared idea with a small task and explicit responsibilities."],
    ),
    Pluto: pair(
      ["Mudança e transformação podem se encontrar na revisão de regras, grupos e modos de exercer autonomia sem reproduzir antigos controles.", "A pressão por romper pode entrar em choque com o medo de perder poder ou pertencimento, favorecendo posições rígidas dos dois lados.", "Identifique uma estrutura que merece mudança e escolha uma ação possível sem exigir transformação total imediata."],
      ["Change and transformation can meet in a review of rules, groups and ways to act independently without repeating old forms of control.", "Pressure to break away can clash with fear of losing influence or belonging, encouraging rigid positions on both sides.", "Identify a structure worth changing and choose a possible action without demanding immediate, total transformation."],
    ),
  },
  Neptune: {
    Neptune: pair(
      ["Sua relação com imaginação, sensibilidade e sentido entra em revisão: vale distinguir uma inspiração viva de um ideal que já não orienta você.", "Dúvidas podem aumentar quando uma imagem antiga de futuro perde nitidez. Preencher essa incerteza com uma nova certeza imediata pode esconder perguntas importantes.", "Registre um ideal que está mudando e mantenha uma rotina concreta enquanto considera o que ainda faz sentido."],
      ["Your relationship with imagination, sensitivity and meaning comes up for review: distinguish a living inspiration from an ideal that no longer guides you.", "Uncertainty can grow when an old picture of the future becomes less clear. Replacing it with immediate certainty may conceal important questions.", "Write down an ideal that is changing and maintain a practical routine while considering what still feels meaningful."],
    ),
    Pluto: pair(
      ["Sensibilidade e transformação podem aprofundar a reflexão sobre ideais, pertencimento e formas de contribuir sem tentar controlar todo o processo.", "Uma esperança coletiva pode se misturar à necessidade de salvar ou conduzir outras pessoas, tornando limites e responsabilidade menos claros.", "Escolha uma contribuição concreta e delimite o que é sua responsabilidade e o que precisa continuar sendo escolha dos outros."],
      ["Sensitivity and transformation can deepen reflection on ideals, belonging and ways to contribute without controlling the whole process.", "A shared hope can become mixed up with the urge to rescue or direct other people, making boundaries and responsibility less clear.", "Choose a practical contribution and distinguish your responsibility from what must remain someone else's choice."],
    ),
  },
  Pluto: {
    Pluto: pair(
      ["Sua relação com controle, desapego e transformação entra em destaque: reconhecer o que não pode ser preservado do mesmo modo pode abrir uma mudança mais consciente.", "A necessidade de garantir um resultado pode manter você preso a uma disputa ou estrutura que exige revisão, em vez de mais força.", "Nomeie o que ainda está sob sua escolha e o que precisa ser negociado ou deixado ir por etapas."],
      ["Your relationship with control, release and transformation comes into focus: recognising what cannot continue unchanged can make room for a more conscious change.", "The need to guarantee an outcome can keep you tied to a struggle or structure that needs reconsideration rather than more force.", "Name what remains within your choices and what needs to be negotiated or gradually released."],
    ),
  },
};

const aspectDynamics: Record<NatalAspectType, Record<AstrologyLocale, string>> = {
  conjunction: {
    "pt-BR": "A conjunção reúne as duas funções no mesmo ponto do zodíaco. Elas ficam mais difíceis de separar: intensidade pode ser recurso, mas não torna a combinação automaticamente fácil ou favorável.",
    en: "A conjunction brings both functions to the same point of the zodiac. They become harder to separate: intensity can be useful without making the combination automatically easy or favourable.",
  },
  trine: {
    "pt-BR": "O trígono é uma relação de 120°: as funções encontram uma passagem mais fluida entre si. A facilidade pode apoiar uma escolha consciente ou passar despercebida se nada for colocado em prática.",
    en: "A trine is a 120° relationship: the functions find a smoother connection. That ease can support a conscious choice or go unnoticed if nothing is put into practice.",
  },
  sextile: {
    "pt-BR": "O sextil é uma relação de 60°: existe uma possibilidade de cooperação que costuma pedir iniciativa. Fazer uma pergunta, buscar um recurso ou experimentar um passo pequeno ajuda a dar uso à abertura.",
    en: "A sextile is a 60° relationship: an opportunity for cooperation usually asks for initiative. Asking a question, finding a resource or trying a small step helps make use of the opening.",
  },
  square: {
    "pt-BR": "A quadratura é uma relação de 90°: duas necessidades pressionam por respostas que nem sempre cabem no mesmo ritmo. O trabalho é ajustar uma conduta ou um acordo, em vez de concluir que o caminho está bloqueado.",
    en: "A square is a 90° relationship: two needs press for responses that may not fit the same pace. The work is to adjust an action or agreement rather than conclude that the way is blocked.",
  },
  opposition: {
    "pt-BR": "A oposição é uma relação de 180°: duas funções ocupam polos distintos e pedem equilíbrio. Perceber apenas um lado pode levar a atribuir todo o conflito ao outro; vale reconhecer as duas necessidades antes de escolher.",
    en: "An opposition is a 180° relationship: two functions occupy different poles and ask for balance. Seeing only one side can put all the conflict onto someone else; recognise both needs before choosing.",
  },
};

const movingInvitations: Record<NatalBody, Record<AstrologyLocale, string>> = {
  Sun: { "pt-BR": "dar atenção à sua direção e ao que deseja expressar", en: "give attention to your direction and what you want to express" },
  Moon: { "pt-BR": "observar o clima emocional e a necessidade de cuidado deste momento", en: "notice the current emotional mood and need for care" },
  Mercury: { "pt-BR": "rever uma ideia, uma informação ou a forma de conversar", en: "reconsider an idea, a piece of information or a way of communicating" },
  Venus: { "pt-BR": "perceber o que deseja valorizar, apreciar ou cultivar numa troca", en: "notice what you want to value, enjoy or cultivate in an exchange" },
  Mars: { "pt-BR": "escolher onde agir, começar ou defender um limite", en: "choose where to act, begin or defend a boundary" },
  Jupiter: { "pt-BR": "ampliar uma possibilidade de aprendizagem, confiança ou crescimento", en: "develop a possibility for learning, confidence or growth" },
  Saturn: { "pt-BR": "rever limites, prazos e o que consegue sustentar com responsabilidade", en: "review limits, deadlines and what you can responsibly sustain" },
  Uranus: { "pt-BR": "experimentar uma mudança e questionar uma resposta automática", en: "try a change and question an automatic response" },
  Neptune: { "pt-BR": "acolher uma inspiração e distinguir sensibilidade de idealização", en: "make room for inspiration and distinguish sensitivity from idealisation" },
  Pluto: { "pt-BR": "examinar controle, desapego e o que precisa de transformação", en: "examine control, release and what needs to change at a deeper level" },
};

const signStyles: Record<ZodiacSign, Record<AstrologyLocale, string>> = {
  aries: { "pt-BR": "iniciativa e resposta direta", en: "initiative and a direct response" },
  taurus: { "pt-BR": "continuidade, conforto e segurança concreta", en: "continuity, comfort and practical security" },
  gemini: { "pt-BR": "curiosidade, perguntas e troca de informação", en: "curiosity, questions and exchanging information" },
  cancer: { "pt-BR": "proteção, familiaridade e vínculo emocional", en: "protection, familiarity and emotional connection" },
  leo: { "pt-BR": "expressão criativa e reconhecimento", en: "creative expression and recognition" },
  virgo: { "pt-BR": "discernimento, utilidade e ajustes práticos", en: "discernment, usefulness and practical adjustments" },
  libra: { "pt-BR": "reciprocidade, diálogo e negociação", en: "reciprocity, dialogue and negotiation" },
  scorpio: { "pt-BR": "profundidade, confiança e intimidade", en: "depth, trust and intimacy" },
  sagittarius: { "pt-BR": "liberdade para explorar e buscar sentido", en: "freedom to explore and seek meaning" },
  capricorn: { "pt-BR": "estrutura, responsabilidade e continuidade", en: "structure, responsibility and continuity" },
  aquarius: { "pt-BR": "autonomia, experimentação e participação coletiva", en: "independence, experimentation and participation in a group" },
  pisces: { "pt-BR": "sensibilidade, imaginação e abertura emocional", en: "sensitivity, imagination and emotional openness" },
};

// The slower-to-faster direction uses the pair reading. The other direction
// has its own application: Mercury activating natal Jupiter is not Jupiter
// expanding natal Mercury. These entries are meanings, not name substitutions.
const directedApplications: Partial<Record<NatalBody, Partial<Record<NatalBody, Record<AstrologyLocale, string>>>>> = {
  Sun: {
    Moon: { "pt-BR": "O Sol em trânsito convida a reconhecer uma necessidade emocional e escolher como acolhê-la, em vez de apenas reagir a ela.", en: "The moving Sun invites you to recognise an emotional need and choose how to care for it rather than simply react to it." },
    Mercury: { "pt-BR": "O Sol em trânsito destaca uma ideia que você deseja assumir como sua: explicar o que pensa pode ajudar a escolher uma direção.", en: "The moving Sun highlights an idea you want to stand behind: explaining your thinking can help you choose a direction." },
    Venus: { "pt-BR": "O Sol em trânsito põe atenção nas suas preferências: uma escolha de afeto, prazer ou criação pode mostrar o que você deseja valorizar de verdade.", en: "The moving Sun draws attention to your preferences: a choice involving affection, enjoyment or creativity can reveal what you want to value." },
    Mars: { "pt-BR": "O Sol em trânsito ilumina sua iniciativa: vale decidir qual ação expressa sua vontade, sem fazer da afirmação pessoal uma disputa.", en: "The moving Sun highlights your initiative: choose an action that expresses your intentions without turning self-assertion into a contest." },
    Jupiter: { "pt-BR": "O Sol em trânsito destaca suas convicções e planos de crescimento. Escolher uma possibilidade para desenvolver pode ser mais útil do que tentar abraçar todas.", en: "The moving Sun highlights your convictions and plans for growth. Choosing one possibility to develop may be more useful than trying to pursue them all." },
    Saturn: { "pt-BR": "O Sol em trânsito põe foco num compromisso: você pode reconhecer onde uma responsabilidade serve à sua direção e onde virou apenas cobrança.", en: "The moving Sun brings a commitment into focus: notice where a responsibility supports your direction and where it has become mere pressure." },
    Uranus: { "pt-BR": "O Sol em trânsito destaca uma parte sua que pede autonomia. Uma experiência pequena pode mostrar como ser mais autêntico sem romper por impulso.", en: "The moving Sun highlights a part of you that needs independence. A small experiment can show how to be more authentic without an impulsive break." },
    Neptune: { "pt-BR": "O Sol em trânsito convida a dar atenção a um ideal ou projeto criativo. Tornar visível uma inspiração ajuda a distinguir desejo de uma direção já possível.", en: "The moving Sun invites attention to an ideal or creative project. Making an inspiration visible helps distinguish a wish from an achievable direction." },
    Pluto: { "pt-BR": "O Sol em trânsito põe foco numa escolha ligada a autonomia e controle. Reconhecer sua parte numa situação ajuda a agir sem exigir domínio sobre o resultado.", en: "The moving Sun focuses attention on a choice involving independence and control. Recognising your part helps you act without demanding control of the outcome." },
  },
  Moon: {
    Mercury: { "pt-BR": "A Lua em trânsito aproxima o estado emocional da forma de pensar. Dar nome ao sentimento antes de explicá-lo pode tornar uma conversa mais clara.", en: "The moving Moon brings your emotional state into contact with your thinking. Naming a feeling before explaining it may make a conversation clearer." },
    Venus: { "pt-BR": "A Lua em trânsito sensibiliza sua forma de receber afeto: um gesto simples pode ajudar a reconhecer de que proximidade ou conforto você precisa agora.", en: "The moving Moon draws attention to how you receive affection: a simple gesture may help reveal the closeness or comfort you need now." },
    Mars: { "pt-BR": "A Lua em trânsito sensibiliza sua iniciativa e seus limites. Uma emoção pode ganhar voz pela ação; reconhecer a necessidade por trás dela ajuda a responder sem atacar.", en: "The moving Moon brings feeling to your initiative and boundaries. An emotion may seek expression through action; recognising the need behind it helps you respond without attacking." },
    Jupiter: { "pt-BR": "A Lua em trânsito aproxima sua necessidade de acolhimento da confiança no futuro. Compartilhar uma esperança pode dar apoio emocional sem dispensar um plano realista.", en: "The moving Moon connects your need for care with trust in the future. Sharing a hope can offer emotional support without replacing a realistic plan." },
    Saturn: { "pt-BR": "A Lua em trânsito torna mais sensível sua relação com obrigação e limite. Observe se uma regra protege seu equilíbrio ou faz você ignorar uma necessidade básica.", en: "The moving Moon brings sensitivity to duty and boundaries. Notice whether a rule protects your balance or leads you to ignore a basic need." },
    Uranus: { "pt-BR": "A Lua em trânsito toca sua necessidade de liberdade. Um pequeno espaço de escolha pode aliviar a inquietação sem exigir que você abandone toda a rotina.", en: "The moving Moon touches your need for freedom. A little room for choice can ease restlessness without requiring you to abandon your whole routine." },
    Neptune: { "pt-BR": "A Lua em trânsito aproxima emoção e imaginação. Um ambiente calmo ou uma atividade criativa pode ajudar a perceber o que você sente sem absorver todo o clima ao redor.", en: "The moving Moon brings feeling and imagination closer. A quiet setting or creative activity can help you notice your feelings without absorbing the entire atmosphere around you." },
    Pluto: { "pt-BR": "A Lua em trânsito pode tornar um apego ou medo de perda mais perceptível. Acolher o sentimento não exige controlar a proximidade ou a resposta de alguém.", en: "The moving Moon may make an attachment or fear of loss easier to notice. Making room for the feeling does not require controlling someone's closeness or response." },
  },
  Mercury: {
    Venus: { "pt-BR": "Mercúrio em trânsito convida a colocar uma preferência ou expectativa afetiva em palavras. Uma pergunta direta e gentil ajuda a substituir suposições por acordo.", en: "The moving Mercury invites you to put a preference or relationship expectation into words. A kind, direct question helps replace assumptions with agreement." },
    Mars: { "pt-BR": "Mercúrio em trânsito ajuda a organizar uma iniciativa e explicar um limite. A clareza está em dizer o que precisa mudar, sem fazer da conversa uma competição.", en: "The moving Mercury helps you organise an initiative and explain a boundary. Clarity means stating what needs to change without making the conversation a competition." },
    Jupiter: { "pt-BR": "Mercúrio em trânsito convida a examinar suas convicções: fazer perguntas, conferir fontes e explicar uma visão ajuda a transformar uma crença ampla em entendimento concreto.", en: "The moving Mercury invites you to examine your convictions: asking questions, checking sources and explaining a vision helps turn a broad belief into concrete understanding." },
    Saturn: { "pt-BR": "Mercúrio em trânsito favorece a revisão de um prazo, uma regra ou um compromisso. Colocar as condições por escrito ajuda a perceber o que é possível cumprir.", en: "The moving Mercury supports reviewing a deadline, rule or commitment. Writing down the conditions helps clarify what can actually be delivered." },
    Uranus: { "pt-BR": "Mercúrio em trânsito leva uma pergunta nova a um padrão conhecido. Uma hipótese diferente pode ser útil se você a testar antes de tratá-la como solução.", en: "The moving Mercury brings a fresh question to a familiar pattern. A different hypothesis can be useful if you test it before treating it as the answer." },
    Neptune: { "pt-BR": "Mercúrio em trânsito convida a dar palavras a uma impressão ou inspiração. Diferenciar metáfora, sentimento e informação verificável ajuda a manter a comunicação clara.", en: "The moving Mercury invites you to put an impression or inspiration into words. Distinguishing metaphor, feeling and verifiable information helps keep communication clear." },
    Pluto: { "pt-BR": "Mercúrio em trânsito pode ajudar a investigar um assunto difícil. Faça perguntas que abram compreensão, em vez de buscar uma confirmação a qualquer custo.", en: "The moving Mercury can help you investigate a difficult subject. Ask questions that open understanding rather than seek confirmation at any cost." },
  },
  Venus: {
    Mars: { "pt-BR": "Vênus em trânsito convida a aproximar desejo de reciprocidade. Demonstrar interesse pode ser um gesto claro de afeto, desde que o ritmo e os limites sejam compartilhados.", en: "The moving Venus invites desire into conversation with reciprocity. Showing interest can be a clear affectionate gesture when pace and boundaries are shared." },
    Jupiter: { "pt-BR": "Vênus em trânsito destaca o prazer de aprender, compartilhar e ampliar experiências. Escolha uma troca generosa que também respeite seus recursos.", en: "The moving Venus highlights enjoyment in learning, sharing and broadening experience. Choose a generous exchange that also respects your resources." },
    Saturn: { "pt-BR": "Vênus em trânsito aproxima afeto de compromisso e responsabilidade. Um acordo cumprido, um limite respeitado ou uma presença constante pode tornar o cuidado mais concreto.", en: "The moving Venus connects affection with commitment and responsibility. Keeping an agreement, respecting a boundary or showing up consistently can make care tangible." },
    Uranus: { "pt-BR": "Vênus em trânsito convida a renovar o modo de se aproximar. Uma experiência diferente pode trazer prazer sem exigir que você abandone os acordos que dão confiança ao vínculo.", en: "The moving Venus invites a fresh way of connecting. A different experience can bring enjoyment without requiring you to abandon the agreements that sustain trust." },
    Neptune: { "pt-BR": "Vênus em trânsito pode dar forma afetiva ou artística a uma inspiração. Aproveite a delicadeza sem atribuir à outra pessoa uma intenção que ela não expressou.", en: "The moving Venus can give an inspiration an affectionate or artistic form. Enjoy the tenderness without assigning someone an intention they have not expressed." },
    Pluto: { "pt-BR": "Vênus em trânsito põe atenção na profundidade das suas escolhas afetivas. Reconhecer o que tem valor ajuda a distinguir intimidade de uma troca guiada por medo de perda.", en: "The moving Venus draws attention to the depth of your relationship choices. Recognising what matters helps distinguish intimacy from an exchange driven by fear of loss." },
  },
  Mars: {
    Jupiter: { "pt-BR": "Marte em trânsito convida a colocar uma convicção em ação. Uma primeira etapa concreta pode testar sua confiança sem transformar ambição em excesso de compromisso.", en: "The moving Mars invites you to put a conviction into action. A concrete first stage can test your confidence without turning ambition into excessive commitment." },
    Saturn: { "pt-BR": "Marte em trânsito leva iniciativa a uma responsabilidade já existente. Avançar por uma etapa delimitada ajuda a trabalhar com o limite, em vez de apenas lutar contra ele.", en: "The moving Mars brings initiative to an existing responsibility. Making progress through a defined stage helps you work with a limit rather than simply fight it." },
    Uranus: { "pt-BR": "Marte em trânsito mobiliza sua necessidade de mudar. Testar um método alternativo pode ser mais produtivo do que responder à inquietação com uma ruptura imediata.", en: "The moving Mars activates your wish for change. Testing an alternative method can be more useful than answering restlessness with an immediate break." },
    Neptune: { "pt-BR": "Marte em trânsito pede uma ação para uma inspiração. Escolher um resultado pequeno e explícito ajuda a não dispersar esforço numa missão indefinida.", en: "The moving Mars asks for action on an inspiration. Choosing a small, explicit result helps keep effort from scattering across an undefined mission." },
    Pluto: { "pt-BR": "Marte em trânsito mobiliza sua determinação para transformar algo. Direcione a força para uma conduta sua, sem fazer de outra pessoa um obstáculo a vencer.", en: "The moving Mars activates determination to change something. Direct effort towards your own behaviour without treating another person as an obstacle to defeat." },
  },
  Jupiter: {
    Saturn: { "pt-BR": "Júpiter em trânsito convida a ampliar uma estrutura existente. Uma meta pode crescer de modo sustentável quando prazo, recursos e responsabilidades crescem com ela.", en: "The moving Jupiter invites you to expand an existing structure. A goal can grow sustainably when time, resources and responsibilities develop alongside it." },
    Uranus: { "pt-BR": "Júpiter em trânsito amplia sua abertura a alternativas. Explorar uma ideia diferente pode renovar a confiança, desde que novidade e utilidade sejam avaliadas separadamente.", en: "The moving Jupiter broadens your openness to alternatives. Exploring a different idea can renew confidence when novelty and usefulness are judged separately." },
    Neptune: { "pt-BR": "Júpiter em trânsito amplia um ideal ou uma inspiração. Há espaço para estudar, criar ou contribuir, sem transformar esperança em uma promessa de resultado.", en: "The moving Jupiter expands an ideal or inspiration. There is room to learn, create or contribute without turning hope into a promise of results." },
    Pluto: { "pt-BR": "Júpiter em trânsito convida a ampliar sua compreensão sobre poder e mudança. Rever uma convicção pode ajudar a exercer influência sem querer impor uma única visão.", en: "The moving Jupiter invites a broader understanding of power and change. Reviewing a conviction can help you use influence without imposing a single viewpoint." },
  },
  Saturn: {
    Uranus: { "pt-BR": "Saturno em trânsito pede sustentação para uma mudança. Definir etapas e limites pode dar continuidade à inovação sem transformá-la numa nova rigidez.", en: "The moving Saturn asks you to support a change. Defining stages and limits can help innovation last without turning it into a new rigidity." },
    Neptune: { "pt-BR": "Saturno em trânsito convida a dar estrutura a um ideal. Um prazo de revisão e uma tarefa possível ajudam a distinguir construção paciente de insistir num plano sem forma.", en: "The moving Saturn invites structure around an ideal. A review date and achievable task help distinguish patient development from persisting with a shapeless plan." },
    Pluto: { "pt-BR": "Saturno em trânsito pede responsabilidade numa transformação. Separar o que precisa continuar do que já se esgotou pode tornar uma mudança profunda mais viável.", en: "The moving Saturn asks for responsibility within a transformation. Separating what needs to continue from what has run its course can make a deep change more workable." },
  },
  Uranus: {
    Neptune: { "pt-BR": "Urano em trânsito convida a renovar uma visão ou ideal. Um experimento criativo pequeno pode mostrar como a inspiração se relaciona com necessidades atuais.", en: "The moving Uranus invites you to refresh a vision or ideal. A small creative experiment can reveal how inspiration relates to present needs." },
    Pluto: { "pt-BR": "Urano em trânsito questiona formas arraigadas de controle. Uma alternativa pode abrir espaço para autonomia sem exigir que toda a estrutura seja destruída.", en: "The moving Uranus questions established forms of control. An alternative can make room for independence without requiring the whole structure to be destroyed." },
  },
  Neptune: {
    Pluto: { "pt-BR": "Netuno em trânsito convida a rever a sensibilidade envolvida numa mudança profunda. Uma contribuição cuidadosa pode ser mais útil do que tentar salvar ou conduzir o processo inteiro.", en: "The moving Neptune invites attention to sensitivity within a deep change. A considered contribution can be more useful than trying to rescue or direct the entire process." },
  },
};

export function getPlanetAspectReading(firstBody: NatalBody, secondBody: NatalBody, type: NatalAspectType, locale: AstrologyLocale) {
  const entry = planetPairs[firstBody][secondBody] ?? planetPairs[secondBody][firstBody];
  if (!entry) throw new Error(`Missing planet-pair interpretation: ${firstBody}/${secondBody}`);
  const copy = entry[locale];
  const isReturn = firstBody === secondBody && type === "conjunction";
  const aspectMeaning = isReturn
    ? locale === "en"
      ? "This is a planetary return: the current planet meets its own natal position. It symbolises a cycle to review, rather than a guaranteed event or a requirement to change everything at once."
      : "Este é um retorno planetário: o planeta atual encontra sua própria posição natal. Ele simboliza um ciclo a rever, sem garantir um acontecimento nem exigir que você mude tudo de uma vez."
    : aspectDynamics[type][locale];
  const description = type === "conjunction"
    ? `${copy.possibility} ${copy.tension}`
    : type === "square" || type === "opposition" ? copy.tension : copy.possibility;
  return { description, aspectMeaning, practice: copy.practice, tension: copy.tension, isReturn };
}

export function getDailyTransitInterpretation(transit: DailyTransit, locale: AstrologyLocale) {
  const moving = getBodyInterpretation(transit.transitBody, locale);
  const natal = getBodyInterpretation(transit.natalBody, locale);
  const aspect = getAspectInterpretation(transit.type, locale);
  const transitSign = getSignInterpretation(transit.transitSign, locale).label;
  const natalSign = getSignInterpretation(transit.natalSign, locale).label;
  const reading = getPlanetAspectReading(transit.transitBody, transit.natalBody, transit.type, locale);
  const directed = directedApplications[transit.transitBody]?.[transit.natalBody]?.[locale];
  let description = directed ?? reading.description;
  if (directed && (transit.type === "square" || transit.type === "opposition" || transit.type === "conjunction")) {
    description += ` ${reading.tension}`;
  }
  const house = transit.natalHouse !== null && Number.isInteger(transit.natalHouse) && transit.natalHouse >= 1 && transit.natalHouse <= 12
    ? getHouseInterpretation(transit.natalHouse, locale) : null;
  const title = locale === "en"
    ? `${moving.label} ${aspect.label.toLowerCase()} natal ${natal.label}`
    : `${moving.label} em ${aspect.label.toLowerCase()} com ${natal.label} natal`;
  const detail = locale === "en"
    ? `${moving.label} in ${transitSign} · natal ${natal.label} in ${natalSign}${house ? `, house ${transit.natalHouse}` : ""}`
    : `${moving.label} em ${transitSign} · ${natal.label} natal em ${natalSign}${house ? `, casa ${transit.natalHouse}` : ""}`;
  const roles = locale === "en"
    ? `${moving.label} is the moving planet here, inviting you to ${movingInvitations[transit.transitBody][locale]}. Your natal ${natal.label} is the personal reference: ${natal.archetype}.`
    : `${moving.label} é o planeta em trânsito: o convite é ${movingInvitations[transit.transitBody][locale]}. ${natal.label} natal é a referência pessoal: ${natal.archetype}.`;
  const signContext = locale === "en"
    ? `The movement in ${transitSign} emphasises ${signStyles[transit.transitSign][locale]}. The natal position in ${natalSign} adds ${signStyles[transit.natalSign][locale]}.`
    : `O movimento em ${transitSign} tem ênfase em ${signStyles[transit.transitSign][locale]}. A posição natal em ${natalSign} acrescenta ${signStyles[transit.natalSign][locale]}.`;
  const houseContext = house
    ? `${house.label} · ${house.area}. ${house.explanation}` : null;
  return { ...reading, description, title, detail, roles, signContext, houseContext };
}
