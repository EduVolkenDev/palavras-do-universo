# Storyboard — Desktop e Mobile

Responsável: Claude  
Data: 2026-06-27  
Formato: descrição textual de alta fidelidade. Cada quadro especifica composição, elementos ativos, estado da cena, ação do usuário e transição.

---

## Como ler este storyboard

Cada quadro tem:
- **Capítulo:** a etapa da jornada
- **Composição:** o que o usuário vê e onde cada elemento está
- **Estado da cena:** portal, luz, planos ativos
- **Ação do usuário:** o que o usuário pode fazer
- **Transição:** o que dispara e como a cena avança

Desktop (1440px) e Mobile (390px) são tratados separadamente quando diferem em composição — não apenas em escala.

---

## DESKTOP — 1440×900

---

### Quadro D-1 — Chegada

**Capítulo:** Chegada  
**Scroll:** 0px

**Composição:**
```
┌─────────────────────────────────────────────┐
│                                             │
│  Logo (top left, pequeno, opaco 70%)        │
│                                             │
│                                             │
│         [Portal — distante, 40% visível,   │
│          centro do viewport, leve brilho    │
│          violeta-azul emanando do centro]   │
│                                             │
│                                             │
│  Palavras do Universo          (headline   │
│  Clareza que emerge do símbolo  —  centro  │
│  abaixo do portal)                          │
│                                             │
│  [CTA fantasma: "Começar" — opacidade 0,   │
│   ainda não visível]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: 40% da escala final, parcialmente abaixo do viewport, luminosidade 8%
- Luz ambiente: 5%, temperatura fria
- Ícone protagonista: ausente
- Plano de cosmos: textura de vazio, sem estrelas isoladas
- Copy: headline em fade-in lento (1800ms), nenhum CTA visível ainda

**Ação do usuário:** observar. O portal oscila suavemente. A headline dissolve.

**Transição:** conforme o usuário inicia o scroll, o portal começa a crescer e se aproximar. A headline sobe e some. O CTA "Começar" aparece.

---

### Quadro D-2 — Chegada → Reconhecimento

**Capítulo:** Chegada avançando  
**Scroll:** 15–30% do capítulo

**Composição:**
```
┌─────────────────────────────────────────────┐
│  Logo (top left)   Nav suave surgindo       │
│                                             │
│                                             │
│         [Portal — 65% da escala,           │
│          luminosidade crescendo,            │
│          bordas mais nítidas]               │
│                                             │
│  "Você está aqui por uma razão"             │
│  [copy de reconhecimento — entrando]        │
│                                             │
│              [CTA: "Começar"]               │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: 65% da escala, saindo de baixo do viewport
- Luz: levemente rosada emergindo nas bordas do portal
- Copy: frase de reconhecimento dissolve de baixo

**Ação do usuário:** scroll ou clique no CTA.

**Transição:** CTA leva ao capítulo de Escolha. Scroll continua a narrativa.

---

### Quadro D-3 — Reconhecimento

**Capítulo:** Reconhecimento  
**Scroll:** seção 2

**Composição:**
```
┌─────────────────────────────────────────────┐
│  Logo   Nav                                 │
│                                             │
│  [Portal — 80%, levemente à direita]        │
│                                             │
│  "Isso é para quem sente que      ←copy    │
│   precisa de mais clareza do que            │
│   de mais informação."                      │
│                                             │
│  [Ícone protagonista — esquerda,            │
│   plano médio, escala protagonista]         │
│                                             │
│  Texto de suporte (menor, à esquerda)       │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: 80%, deslocado para a direita, libera espaço para copy à esquerda
- Ícone protagonista: primeiro ícone simbólico, escala ~200px, plano médio
- Luz: localizada e rosada, cria intimidade
- Copy: assimétrica — texto à esquerda, portal e ícone à direita

**Ação do usuário:** ler. Hover no ícone revela nome simbólico (sem tooltip óbvio — o próprio ícone exibe a palavra).

**Transição:** scroll avança para Escolha. Ícone retorna ao plano de matéria simbólica. Portal centraliza.

---

### Quadro D-4 — Escolha

**Capítulo:** Escolha  
**Scroll:** seção 3

**Composição:**
```
┌─────────────────────────────────────────────┐
│  Logo   Nav                                 │
│                                             │
│       "O que você está carregando          │
│        hoje?"                               │
│                                             │
│  [Portal — centralizado, 90%,              │
│   três caminhos surgem como sulcos          │
│   de luz ao redor]                          │
│                                             │
│  [Caminho 1]  [Caminho 2]  [Caminho 3]     │
│   Carta Dia    Leitura 3    Clareza         │
│                Cartas       Urgente         │
│                                             │
│  [Cada caminho: ícone pequeno + label,     │
│   sem card. São pontos no espaço.]          │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: centralizado, estável, serve como âncora visual para os três caminhos
- Luz: caminhos têm leve distinção de luminosidade — não cores diferentes, não bordas, apenas intensidade de luz diferente
- Ícones: três ícones pequenos orbita suavemente ao redor do portal (não partículas — objetos com posição definida)

**Ação do usuário:** escolher um caminho ou continuar o scroll para explorar.

**Transição:** clique no caminho inicia o ritual de Abertura. Scroll continua para mostrar mais contexto sobre os caminhos.

---

### Quadro D-5 — Abertura (estado de preparação)

**Capítulo:** Abertura  
**Scroll / interação:** usuário escolheu um caminho

**Composição:**
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│       [Portal — 100% da escala,            │
│        abertura se expande,                 │
│        luz âmbar emergindo do centro,       │
│        ícone coadjuvante recua]             │
│                                             │
│  "Qual é a pergunta que você traz          │
│   para este momento?"                       │
│                                             │
│  [Campo de texto — sem borda visível,      │
│   placeholder como sombra]                  │
│                                             │
│                          [Revelar]          │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: escala máxima, abertura expandindo, luz âmbar concentrada no centro
- Luz ambiente: reduzida para 8% — contraste aumenta a atenção no portal
- Copy: pergunta ao usuário, campo de input integrado à composição (não um formulário convencional)
- Estado de concentração — menos elementos, maior presença do portal

**Ação do usuário:** digitar a pergunta, clicar em Revelar.

**Transição:** portal contrai levemente (antecipação), depois expande ao máximo enquanto as cartas surgem.

---

### Quadro D-6 — Revelação

**Capítulo:** Revelação  
**Scroll / interação:** após submissão da pergunta

**Composição:**
```
┌─────────────────────────────────────────────┐
│                                             │
│  [Portal — recuado ao fundo, estável,      │
│   luz dourada dirigida para as cartas]      │
│                                             │
│                                             │
│  [Carta 1]    [Carta 2]    [Carta 3]       │
│  Protagonistas, escala real, plano médio   │
│  Surgem progressivamente — não simultâneas │
│                                             │
│  "A Lua"      "O Sol"     "A Torre"        │
│   significado  significado  significado     │
│   conectado    conectado    conectado       │
│   à pergunta   à pergunta   à pergunta     │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: recuado, luz dourada, serve de cenário — não protagonista
- Cartas: plano médio, escala protagonista, surgimento progressivo (intervalo 400ms entre cada)
- Luz narrativa: dirigida de cima-esquerda, cria sombras nas cartas que as tornam físicas
- Copy: conectada a cada carta — não panel lateral, mas texto abaixo ou sobreposto sutilmente

**Ação do usuário:** ler cada carta, scroll para síntese.

**Transição:** scroll revela a síntese, cartas sobem levemente e diminuem de escala.

---

### Quadro D-7 — Integração

**Capítulo:** Integração  
**Scroll:** após revelação

**Composição:**
```
┌─────────────────────────────────────────────┐
│                                             │
│  [Portal — menor, estável, luz sage]        │
│                                             │
│  Síntese:                                   │
│  "O padrão desta leitura aponta para..."   │
│                                             │
│  Conselho:                                  │
│  "Uma ação possível hoje é..."              │
│                                             │
│  Afirmação:                                 │
│  "Você tem clareza suficiente para..."     │
│                                             │
│  [Salvar leitura]  [Nova pergunta]          │
│  [Conheça o Círculo]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Estado da cena:**
- Portal: escala reduzida, luz sage (verde-sutil), composição calma
- Copy: hierarquia clara — síntese > conselho > afirmação
- CTAs: presentes mas sem urgência. A oferta aparece quando o valor já foi entregue.
- Composição: respirada, estável, sem movimento excessivo

**Ação do usuário:** ler, salvar, decidir sobre próximo passo.

---

## MOBILE — 390×844

---

### Quadro M-1 — Chegada (mobile)

**Composição:**
```
┌─────────────────┐
│  Logo           │
│                 │
│                 │
│   [Portal —     │
│    80% da       │
│    largura,     │
│    centralizado,│
│    prolonga-se  │
│    além do      │
│    viewport     │
│    inferior]    │
│                 │
│  Palavras do    │
│  Universo       │
│                 │
│  Clareza que    │
│  emerge do      │
│  símbolo        │
│                 │
│  [Começar]      │
└─────────────────┘
```

**Diferenças do desktop:**
- Portal centralizado verticalmente — não deslocado lateralmente.
- Headline abaixo do portal (não ao lado).
- CTA visível desde o início (usuário mobile precisa de âncora imediata).
- Resposta ao ponteiro substituída por resposta à inclinação (gyroscope).

---

### Quadro M-2 — Reconhecimento (mobile)

**Composição:**
```
┌─────────────────┐
│  Logo  ≡        │
│                 │
│  [Ícone         │
│   protagonista  │
│   — 40% da      │
│   largura,      │
│   centralizado] │
│                 │
│  "Isso é para   │
│  quem sente     │
│  que precisa    │
│  de mais        │
│  clareza do     │
│  que de mais    │
│  informação."   │
│                 │
│  [Portal        │
│   parcial no    │
│   fundo]        │
└─────────────────┘
```

**Diferenças do desktop:**
- Ícone protagonista acima da copy (não ao lado).
- Portal ao fundo (menor presença, não compete com o texto).
- Copy ocupa largura total — sem colunas.

---

### Quadro M-3 — Escolha (mobile)

**Composição:**
```
┌─────────────────┐
│                 │
│   [Portal       │
│    centralizado]│
│                 │
│  "O que você   │
│   está          │
│   carregando    │
│   hoje?"        │
│                 │
│  [Caminho 1]   │
│  Carta do Dia  │
│                 │
│  [Caminho 2]   │
│  Leitura 3     │
│  Cartas        │
│                 │
│  [Caminho 3]   │
│  Clareza       │
│  Urgente       │
│                 │
└─────────────────┘
```

**Diferenças do desktop:**
- Caminhos empilhados verticalmente (não lado a lado).
- Cada caminho tem mais respiro — tela estreita exige mais espaço entre itens tocáveis.
- Target mínimo de toque: 48×48px por caminho.

---

### Quadro M-4 — Abertura (mobile)

**Composição:**
```
┌─────────────────┐
│                 │
│   [Portal —     │
│    ocupa         │
│    60% da tela, │
│    luz âmbar]   │
│                 │
│  "Qual é a      │
│  pergunta?"     │
│                 │
│  [Campo de      │
│  texto — full   │
│  width, teclado │
│  nativo]        │
│                 │
│  [Revelar]      │
│                 │
└─────────────────┘
```

**Diferenças do desktop:**
- Campo de texto full width — teclado nativo não pode ser substituído por componente customizado.
- Portal não compete com o campo de input — recua enquanto o teclado está ativo.
- CTA "Revelar" posicionado acima do teclado (não embaixo).

---

### Quadro M-5 — Revelação (mobile)

**Composição:**
```
┌─────────────────┐
│                 │
│  [Carta 1 —     │
│   protagonista, │
│   80% da        │
│   largura]      │
│                 │
│  "A Lua"        │
│  significado    │
│  conectado à    │
│  pergunta       │
│                 │
│  ───────────    │
│  swipe →        │
│  ───────────    │
│  [Carta 2]      │
│                 │
└─────────────────┘
```

**Diferenças do desktop:**
- Cartas em sequência vertical ou carousel horizontal (swipe).
- Uma carta protagonista por vez — não três simultâneas.
- Significado imediatamente abaixo da carta (não ao lado).
- Portal ao fundo, menor.

---

### Quadro M-6 — Integração (mobile)

**Composição:**
```
┌─────────────────┐
│                 │
│  Síntese:       │
│  "O padrão      │
│  desta leitura  │
│  aponta para..."│
│                 │
│  Conselho:      │
│  "Uma ação      │
│  possível..."   │
│                 │
│  Afirmação:     │
│  "Você tem      │
│  clareza        │
│  suficiente..." │
│                 │
│  [Salvar]       │
│  [Nova]         │
│  [Círculo]      │
│                 │
└─────────────────┘
```

**Diferenças do desktop:**
- Portal quase ausente — integração é o momento de maior contenção visual.
- CTAs empilhados verticalmente.
- Full width para todos os elementos.

---

## Notas de direção para o Codex

1. **O portal nunca é cortado lateralmente no mobile.** Se a tela é estreita, o portal é mais alto — não mais estreito.
2. **A sequência de revelação no mobile é vertical ou carousel — nunca três cartas lado a lado.**
3. **O campo de input na Abertura deve testar comportamento com teclado nativo antes de qualquer customização.**
4. **Nenhum quadro tem mais de dois elementos em movimento simultâneo.**
5. **A copy de todos os quadros tem contraste verificado contra o estado de luz daquele momento — não contra o fundo estático.**
