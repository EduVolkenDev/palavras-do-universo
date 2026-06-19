import { getTarotShellByName } from "./cardCatalog";

export type TarotCard = {
  id: number;
  key: string;
  name: string;
  keywords: string[];
  upright: string;
  reversed: string;
  assetPath: string;
};

function card(
  id: number,
  name: string,
  keywords: string[],
  upright: string,
  reversed: string
): TarotCard {
  const shell = getTarotShellByName(name);

  if (!shell) {
    throw new Error(`Carta sem cadastro no catálogo: ${name}`);
  }

  return {
    id,
    key: shell.key,
    name,
    keywords,
    upright,
    reversed,
    assetPath: shell.assetPath,
  };
}

export const CARDS: TarotCard[] = [
  card(
    1,
    "O Louco",
    ["começo", "liberdade", "coragem"],
    "Um começo limpo. Você avança melhor quando solta o excesso de controle.",
    "Impulso sem direção. Você pode estar confundindo coragem com fuga."
  ),
  card(
    2,
    "O Mago",
    ["ação", "foco", "manifestação"],
    "Você já tem recursos suficientes para começar. O importante agora é concentrar energia em uma ação.",
    "Dispersão. Existe vontade, mas ela se perde quando tudo parece urgente ao mesmo tempo."
  ),
  card(
    3,
    "A Sacerdotisa",
    ["intuição", "silêncio", "mistério"],
    "A resposta já está em você, mas precisa de silêncio para aparecer.",
    "Ruído interno. Você está tentando sentir com a cabeça acelerada."
  ),
  card(
    4,
    "A Imperatriz",
    ["cuidado", "fertilidade", "receber"],
    "Algo cresce quando recebe constância, beleza e cuidado simples.",
    "Excesso de entrega. Você pode estar nutrindo tudo, menos o próprio centro."
  ),
  card(
    5,
    "O Imperador",
    ["estrutura", "limite", "direção"],
    "Organizar o terreno vai trazer mais paz do que tentar controlar tudo.",
    "Rigidez. Um limite necessário pode ter virado uma muralha."
  ),
  card(
    6,
    "O Hierofante",
    ["sabedoria", "tradição", "aprendizado"],
    "Procure orientação confiável e transforme experiência em prática.",
    "Você pode estar seguindo uma regra antiga que já não conversa com sua verdade."
  ),
  card(
    7,
    "Os Enamorados",
    ["escolha", "vínculo", "alinhamento"],
    "A escolha certa pede coerência entre desejo, valor e consequência.",
    "A dúvida cresce quando você tenta agradar um caminho que não combina com você."
  ),
  card(
    8,
    "O Carro",
    ["movimento", "decisão", "avanço"],
    "A direção aparece quando você para de negociar com a própria hesitação.",
    "Pressa sem eixo. Avançar agora exige menos força e mais direção."
  ),
  card(
    9,
    "A Força",
    ["coragem", "calma", "domínio"],
    "Sua força hoje está na suavidade firme, não na imposição.",
    "Cansaço de sustentar tudo. Respire antes de transformar defesa em ataque."
  ),
  card(
    10,
    "O Eremita",
    ["pausa", "verdade", "recolhimento"],
    "Uma resposta importante nasce quando você diminui o barulho ao redor.",
    "Isolamento demais pode estar protegendo você da dor e também da vida."
  ),
  card(
    11,
    "A Roda da Fortuna",
    ["ciclo", "mudança", "virada"],
    "O ciclo está se movendo. Ajuste sua postura antes de tentar segurar o que muda.",
    "Resistência ao fluxo. Algo quer virar, mas você ainda negocia com o passado."
  ),
  card(
    12,
    "A Justiça",
    ["verdade", "limite", "consequência"],
    "Clareza, acordos e consequência. O que é justo precisa ser dito com calma.",
    "Autoengano ou desequilíbrio. Você está negociando um limite importante."
  ),
  card(
    13,
    "O Enforcado",
    ["pausa", "rendição", "perspectiva"],
    "Olhar por outro ângulo muda mais do que insistir na mesma resposta.",
    "Estagnação. A pausa já ensinou; agora ela precisa virar escolha."
  ),
  card(
    14,
    "A Morte",
    ["fim", "limpeza", "renascimento"],
    "Algo termina para liberar energia. Nem todo fim é perda; alguns são devolução de vida.",
    "Apego ao que já acabou. A transição dói mais quando você tenta voltar para uma versão antiga."
  ),
  card(
    15,
    "A Temperança",
    ["equilíbrio", "cura", "integração"],
    "Misture calma com ação. O caminho hoje pede medida, não intensidade.",
    "Desequilíbrio por excesso ou falta. O corpo já está avisando onde você passou do ponto."
  ),
  card(
    16,
    "O Diabo",
    ["apego", "desejo", "consciência"],
    "Nomear o apego enfraquece o poder que ele tem sobre você.",
    "Um padrão sedutor pode estar cobrando caro pela sensação de controle."
  ),
  card(
    17,
    "A Torre",
    ["ruptura", "verdade", "libertação"],
    "O que cai revela o que não tinha base. Reorganize pelo que é verdadeiro.",
    "Evitar a verdade prolonga a instabilidade. A queda pode ser menor se você parar de sustentar o falso."
  ),
  card(
    18,
    "A Estrela",
    ["esperança", "reparo", "confiança"],
    "Há uma luz discreta indicando caminho. Confie no que te devolve serenidade.",
    "Desânimo. Você pode estar confundindo demora com ausência de possibilidade."
  ),
  card(
    19,
    "A Lua",
    ["sensibilidade", "medo", "imaginação"],
    "Nem tudo que assusta é ameaça. Observe antes de concluir.",
    "Confusão emocional. Espere a maré baixar antes de decidir por medo."
  ),
  card(
    20,
    "O Sol",
    ["vitalidade", "clareza", "alegria"],
    "A clareza volta quando você escolhe o simples, o vivo e o honesto.",
    "Você pode estar escondendo sua luz para não incomodar quem se acostumou com sua sombra."
  ),
  card(
    21,
    "O Julgamento",
    ["chamado", "despertar", "revisão"],
    "Um chamado interno pede maturidade. Responda pelo que você já sabe hoje.",
    "Culpa antiga pode estar ocupando o lugar da responsabilidade presente."
  ),
  card(
    22,
    "O Mundo",
    ["conclusão", "integração", "expansão"],
    "Um ciclo ganha sentido quando você reconhece o quanto caminhou.",
    "Falta fechar uma etapa com presença. Sem conclusão, a expansão perde força."
  ),
  card(
    23,
    "Ás de Paus",
    ["faísca", "desejo", "início"],
    "Uma faísca pede movimento. Comece pequeno antes que a inspiração esfrie.",
    "Energia presa. O desejo existe, mas precisa de gesto concreto."
  ),
  card(
    24,
    "Dois de Paus",
    ["visão", "planejamento", "escolha"],
    "Você já saiu do ponto inicial. Agora precisa escolher para onde direcionar a energia.",
    "Planejar demais pode estar adiando o primeiro passo real."
  ),
  card(
    25,
    "Três de Paus",
    ["expansão", "espera", "horizonte"],
    "O que foi lançado começa a mostrar sinais. Observe o horizonte sem abandonar o presente.",
    "Impaciência. A resposta está vindo, mas ainda precisa atravessar distância."
  ),
  card(
    26,
    "Quatro de Paus",
    ["celebração", "base", "pertencimento"],
    "Reconheça uma pequena vitória. A segurança também se constrói celebrando o que sustenta.",
    "Dificuldade de receber. Você pode estar passando rápido demais pelo que merece ser honrado."
  ),
  card(
    27,
    "Cinco de Paus",
    ["conflito", "tensão", "ajuste"],
    "A tensão mostra onde as forças estão desalinhadas. Nem todo conflito precisa virar guerra.",
    "Disputa inútil. Escolha melhor onde sua energia merece entrar."
  ),
  card(
    28,
    "Seis de Paus",
    ["reconhecimento", "vitória", "confiança"],
    "Aceite reconhecimento sem diminuir sua caminhada. Você chegou até aqui por mérito e constância.",
    "Medo de aparecer. Sua humildade pode estar virando invisibilidade."
  ),
  card(
    29,
    "Sete de Paus",
    ["posição", "defesa", "coragem"],
    "Defenda o que importa sem se explicar para todos. Algumas posições precisam de firmeza silenciosa.",
    "Cansaço defensivo. Veja se você está protegendo algo real ou lutando por hábito."
  ),
  card(
    30,
    "Oito de Paus",
    ["movimento", "notícia", "rapidez"],
    "Algo acelera. Responda com presença para não transformar oportunidade em atropelo.",
    "Pressa mental. Mensagens e sinais podem confundir se você não filtrar prioridades."
  ),
  card(
    31,
    "Nove de Paus",
    ["resiliência", "limite", "vigilância"],
    "Você está mais perto do fim de um ciclo do que imagina. Proteja sua energia para concluir.",
    "Exaustão defensiva. Nem toda aproximação é ameaça."
  ),
  card(
    32,
    "Dez de Paus",
    ["peso", "responsabilidade", "limite"],
    "Carregar tudo sozinho não é prova de força. Redistribua o peso.",
    "Sobrecarga. Se você não soltar algo, o corpo vai pedir essa pausa por você."
  ),
  card(
    33,
    "Pajem de Paus",
    ["curiosidade", "mensagem", "experimento"],
    "Permita-se testar antes de dominar. A curiosidade abre uma porta importante.",
    "Ansiedade por validação. A ideia precisa respirar antes de virar cobrança."
  ),
  card(
    34,
    "Cavaleiro de Paus",
    ["ímpeto", "aventura", "movimento"],
    "Há força para avançar. Use velocidade com intenção, não como fuga.",
    "Impulsividade. O fogo é útil quando ilumina, perigoso quando queima tudo."
  ),
  card(
    35,
    "Rainha de Paus",
    ["magnetismo", "confiança", "presença"],
    "Sua presença tem força quando você ocupa espaço sem pedir desculpa por existir.",
    "Insegurança mascarada de controle. Volte para o seu centro antes de reagir."
  ),
  card(
    36,
    "Rei de Paus",
    ["liderança", "visão", "decisão"],
    "Lidere pela visão, não pela urgência. Uma decisão firme pode organizar o campo.",
    "Autoridade impaciente. Conduzir exige direção e escuta."
  ),
  card(
    37,
    "Ás de Copas",
    ["abertura", "afeto", "sensibilidade"],
    "Um sentimento novo pede espaço. Receba o que nasce sem exigir forma imediata.",
    "Coração protegido demais. A emoção existe, mas talvez esteja represada por medo de se entregar."
  ),
  card(
    38,
    "Dois de Copas",
    ["encontro", "troca", "reciprocidade"],
    "Um vínculo ganha força quando existe escuta dos dois lados.",
    "Desequilíbrio na troca. Veja se você está tentando sustentar sozinho algo que deveria ser compartilhado."
  ),
  card(
    39,
    "Três de Copas",
    ["amizade", "celebração", "apoio"],
    "A alegria se amplia quando é dividida. Procure quem lembra você de respirar com leveza.",
    "Excesso de dispersão. Nem toda companhia alimenta o que você está tentando preservar."
  ),
  card(
    40,
    "Quatro de Copas",
    ["pausa", "insatisfação", "observação"],
    "Nem toda resposta chega com encanto imediato. Observe o que você ainda não quis receber.",
    "Fechamento emocional. Uma oportunidade pode estar passando despercebida porque veio simples demais."
  ),
  card(
    41,
    "Cinco de Copas",
    ["perda", "luto", "reorganização"],
    "Honre o que doeu, mas não deixe a perda apagar tudo que ainda permanece.",
    "Atenção presa no que faltou. O coração precisa de tempo, mas também de horizonte."
  ),
  card(
    42,
    "Seis de Copas",
    ["memória", "doçura", "retorno"],
    "Uma lembrança pode trazer cura quando você a olha com ternura e maturidade.",
    "Nostalgia demais. O passado pode estar parecendo mais seguro do que realmente foi."
  ),
  card(
    43,
    "Sete de Copas",
    ["possibilidades", "imaginação", "escolha"],
    "Há muitas imagens no ar. Escolha pelo que sustenta sua paz, não pelo que apenas encanta.",
    "Fantasia sem chão. Desejos demais podem virar névoa quando nenhum recebe direção."
  ),
  card(
    44,
    "Oito de Copas",
    ["desapego", "busca", "partida"],
    "Ir embora também pode ser um ato de honestidade com a própria alma.",
    "Medo de deixar. Você pode estar permanecendo onde já não existe alimento real."
  ),
  card(
    45,
    "Nove de Copas",
    ["satisfação", "merecimento", "prazer"],
    "Permita-se reconhecer uma conquista sem procurar imediatamente o próximo vazio.",
    "Prazer isolado. Algo pode parecer suficiente por fora, mas pedir mais presença por dentro."
  ),
  card(
    46,
    "Dez de Copas",
    ["harmonia", "família", "plenitude"],
    "Um cenário de paz se constrói com afeto possível, presença e pequenas escolhas consistentes.",
    "Idealização de felicidade. Cuidado para não cobrar perfeição de vínculos humanos."
  ),
  card(
    47,
    "Pajem de Copas",
    ["ternura", "mensagem", "imaginação"],
    "Uma emoção delicada quer ser ouvida. Responda com gentileza, não com pressa de explicar.",
    "Sensibilidade imatura. Uma reação pequena pode estar carregando sentimento antigo."
  ),
  card(
    48,
    "Cavaleiro de Copas",
    ["romance", "convite", "expressão"],
    "Dizer o que sente pode abrir caminho, desde que venha com presença e verdade.",
    "Promessa bonita sem consistência. Encanto precisa caminhar junto com atitude."
  ),
  card(
    49,
    "Rainha de Copas",
    ["intuição", "cuidado", "profundidade"],
    "Sua sensibilidade é bússola. Cuide do que sente sem absorver tudo ao redor.",
    "Empatia sem limite. Acolher não significa carregar dores que não são suas."
  ),
  card(
    50,
    "Rei de Copas",
    ["maturidade", "equilíbrio", "compaixão"],
    "Sinta com profundidade e responda com calma. A maturidade emocional organiza o dia.",
    "Controle emocional rígido. Não sentir para parecer forte também é uma forma de se afastar."
  ),
  card(
    51,
    "Ás de Espadas",
    ["clareza", "verdade", "decisão"],
    "Uma verdade simples corta a confusão. Nomeie o que precisa ser visto.",
    "Pensamento afiado demais. Clareza sem cuidado pode virar dureza."
  ),
  card(
    52,
    "Dois de Espadas",
    ["impasse", "proteção", "escolha"],
    "A decisão pede silêncio e honestidade. Evitar olhar para os lados não elimina a escolha.",
    "Bloqueio. Você pode estar confundindo neutralidade com medo de se posicionar."
  ),
  card(
    53,
    "Três de Espadas",
    ["dor", "verdade", "liberação"],
    "Uma dor reconhecida começa a perder poder. Seja gentil com o que está sendo atravessado.",
    "Ferida reaberta. Repetir a cena mentalmente pode estar impedindo o alívio."
  ),
  card(
    54,
    "Quatro de Espadas",
    ["descanso", "pausa", "recuperação"],
    "A mente precisa de recolhimento para voltar a enxergar com clareza.",
    "Cansaço acumulado. Ignorar a pausa pode transformar ruído em exaustão."
  ),
  card(
    55,
    "Cinco de Espadas",
    ["conflito", "orgulho", "custo"],
    "Antes de vencer uma discussão, pergunte o que essa vitória custaria.",
    "Disputa sem ganho real. A necessidade de ter razão pode estar afastando a paz."
  ),
  card(
    56,
    "Seis de Espadas",
    ["travessia", "alívio", "mudança"],
    "A saída pode ser silenciosa, mas ainda assim é saída. Permita-se atravessar.",
    "Resistência ao deslocamento. Ficar no conhecido talvez esteja custando mais do que mudar."
  ),
  card(
    57,
    "Sete de Espadas",
    ["estratégia", "discrição", "verdade"],
    "Nem tudo precisa ser anunciado. Mas escolha estratégia sem abandonar integridade.",
    "Evitação. Uma parte da verdade pode estar sendo escondida até de você."
  ),
  card(
    58,
    "Oito de Espadas",
    ["limitação", "medo", "perspectiva"],
    "A prisão maior talvez seja a história que você repetiu sobre si. Procure a abertura pequena.",
    "Paralisia mental. Você pode ter mais escolha do que a ansiedade deixa parecer."
  ),
  card(
    59,
    "Nove de Espadas",
    ["preocupação", "insônia", "culpa"],
    "A mente está tentando proteger você pelo excesso. Traga o medo para o presente e respire.",
    "Pensamentos em espiral. Nem toda preocupação é sinal; algumas são apenas cansaço pedindo cuidado."
  ),
  card(
    60,
    "Dez de Espadas",
    ["fim", "rendição", "recomeço"],
    "Um limite foi alcançado. O fim de uma insistência pode ser o começo do alívio.",
    "Apego ao ponto final. Ficar revivendo a queda atrasa a reconstrução."
  ),
  card(
    61,
    "Pajem de Espadas",
    ["curiosidade", "atenção", "notícia"],
    "Investigue com calma. Uma informação pequena pode organizar uma decisão maior.",
    "Vigilância ansiosa. Saber mais nem sempre significa entender melhor."
  ),
  card(
    62,
    "Cavaleiro de Espadas",
    ["pressa", "foco", "impulso"],
    "Há força mental para avançar, mas escolha bem a direção antes de acelerar.",
    "Ataque por impulso. Palavras rápidas podem abrir cortes lentos de fechar."
  ),
  card(
    63,
    "Rainha de Espadas",
    ["discernimento", "limite", "lucidez"],
    "Diga a verdade com elegância. Um limite claro pode ser profundamente cuidadoso.",
    "Frieza defensiva. A lucidez perde força quando vira distância de tudo que sente."
  ),
  card(
    64,
    "Rei de Espadas",
    ["autoridade", "razão", "decisão"],
    "Decida com visão ampla e palavra precisa. A mente serena lidera melhor.",
    "Controle racional. Você pode estar usando lógica para não tocar uma emoção importante."
  ),
  card(
    65,
    "Ás de Ouros",
    ["oportunidade", "corpo", "semente"],
    "Uma possibilidade concreta começa pequena. Plante com paciência e presença.",
    "Semente sem cuidado. A chance existe, mas precisa de rotina para ganhar raiz."
  ),
  card(
    66,
    "Dois de Ouros",
    ["equilíbrio", "adaptação", "prioridade"],
    "Ajuste o ritmo. Você não precisa carregar tudo com a mesma intensidade hoje.",
    "Malabarismo excessivo. Flexibilidade não deve virar abandono das próprias necessidades."
  ),
  card(
    67,
    "Três de Ouros",
    ["colaboração", "ofício", "construção"],
    "O caminho ganha qualidade quando você combina talento, escuta e boa parceria.",
    "Falta de alinhamento. Construir junto exige combinar expectativas antes de seguir."
  ),
  card(
    68,
    "Quatro de Ouros",
    ["segurança", "posse", "controle"],
    "Proteja o que importa, mas deixe espaço para a vida circular.",
    "Apego ao controle. O medo de perder pode estar impedindo você de receber."
  ),
  card(
    69,
    "Cinco de Ouros",
    ["escassez", "apoio", "vulnerabilidade"],
    "Você não precisa atravessar tudo do lado de fora. Procure apoio possível e real.",
    "Isolamento por vergonha. Pedir ajuda também pode ser um gesto de força."
  ),
  card(
    70,
    "Seis de Ouros",
    ["troca", "generosidade", "equilíbrio"],
    "Dar e receber precisam encontrar medida. Observe onde a balança pede ajuste.",
    "Desequilíbrio na ajuda. Generosidade sem limite pode virar dívida emocional."
  ),
  card(
    71,
    "Sete de Ouros",
    ["paciência", "cultivo", "avaliação"],
    "O que você plantou precisa de tempo e revisão. Nem tudo floresce na velocidade do desejo.",
    "Impaciência com o processo. Cortar cedo demais pode impedir o fruto de aparecer."
  ),
  card(
    72,
    "Oito de Ouros",
    ["prática", "dedicação", "aperfeiçoamento"],
    "A repetição cuidadosa transforma intenção em domínio. Continue refinando.",
    "Perfeccionismo. Melhorar é útil; se punir a cada detalhe rouba energia da obra."
  ),
  card(
    73,
    "Nove de Ouros",
    ["autonomia", "colheita", "valor"],
    "Reconheça o valor do que você construiu. Autonomia também merece prazer.",
    "Autossuficiência rígida. Não precisar de ninguém pode virar uma forma de solidão."
  ),
  card(
    74,
    "Dez de Ouros",
    ["legado", "estabilidade", "continuidade"],
    "Pense no que permanece. Uma escolha madura hoje pode sustentar muitos amanhãs.",
    "Segurança sem alma. Estabilidade perde brilho quando vira apenas obrigação herdada."
  ),
  card(
    75,
    "Pajem de Ouros",
    ["estudo", "semente", "disciplina"],
    "Aprenda com humildade e constância. O começo prático vale mais que a ideia perfeita.",
    "Distração material. O plano precisa sair do imaginário e ganhar método."
  ),
  card(
    76,
    "Cavaleiro de Ouros",
    ["constância", "responsabilidade", "ritmo"],
    "Vá no ritmo que sustenta. O progresso silencioso também é movimento.",
    "Lentidão por medo. Cuidado para não chamar de prudência o que virou estagnação."
  ),
  card(
    77,
    "Rainha de Ouros",
    ["cuidado", "corpo", "prosperidade"],
    "Cuide do mundo concreto com ternura. Seu corpo e sua casa também falam com você.",
    "Excesso de cuidado externo. Nutrir tudo ao redor não substitui voltar para si."
  ),
  card(
    78,
    "Rei de Ouros",
    ["estabilidade", "maturidade", "realização"],
    "Construa com calma, ética e visão de longo prazo. O sólido nasce da consistência.",
    "Apego ao resultado. Segurança verdadeira não precisa endurecer o coração."
  ),
];
