# Efeitos Genéricos e sem Função — Identificação e Alternativas

Responsável: Claude  
Data: 2026-06-27  
Escopo: catálogo de padrões visuais proibidos com critério de exclusão, sintoma de aparição e alternativa válida dentro da assinatura Volynx.

---

## Por que este documento existe

Efeitos genéricos não surgem por descuido — surgem porque são a resposta óbvia para um problema visual não totalmente resolvido. Um portal sem material definido recebe um glow. Uma transição sem coreografia recebe partículas. Uma página sem profundidade real recebe glassmorphism.

Este documento mapeia esses padrões para que a solução seja endereçada na causa, não mascarada na superfície.

---

## Catálogo de efeitos proibidos

---

### 1. Chuva de partículas flutuantes

**Descrição:** pontos ou formas pequenas em movimento aleatório pelo viewport, geralmente com leve opacidade e tamanhos variados.

**Por que aparece:** quando um espaço visual precisa parecer "vivo" mas a cena não tem matéria real — partículas preenchem o vazio com ruído.

**Por que não funciona no PdU:**
- Comunica "efeito de magia genérico" — é o padrão mais comum do segmento de tarot e espiritualidade digital.
- Não indica progressão, não responde ao usuário, não tem significado — falha em todas as seis funções.
- Compete com a atenção sem ganho narrativo.
- É computacionalmente caro sem retorno visual proporcional.

**Sintoma de aparição:** quando alguém pensa "a cena está vazia, vou adicionar algumas partículas".

**Alternativa válida:** o noise procedural no portal cria a sensação de movimento vivo sem distribuição aleatória. O cosmos de fundo pode ter textura de vazio (noise estático de baixíssima frequência) que dá profundidade sem movimento.

---

### 2. Glow externo aplicado sobre o portal

**Descrição:** `filter: blur()` ou `box-shadow` com alta spread aplicado externamente sobre a geometria do portal — criando um borrão luminoso ao redor.

**Por que aparece:** é a forma mais rápida de "dar luminosidade" a um objeto sem modificar seu material.

**Por que não funciona no PdU:**
- Cria uma luminosidade plana que não tem direção, não tem fonte, não tem física.
- O portal Volynx emite luz de dentro — não recebe luz de fora.
- Glow externo parece Photoshop aplicado sobre um elemento 3D — desfaz a sensação de profundidade.

**Sintoma de aparição:** `emissiveIntensity` não está funcionando como esperado, então alguém adiciona `filter: blur(20px)` no elemento HTML do canvas.

**Alternativa válida:** o shader emissivo do portal (`emissive` + `emissiveIntensity` no `MeshPhysicalMaterial`) cria luminosidade que nasce do material. Um `PointLight` posicionado no centro do portal ilumina o ambiente ao redor com físical correto.

---

### 3. Bokeh decorativo como fundo

**Descrição:** círculos desfocados de cores variadas sobrepostos ao fundo, criando uma névoa de pontos de luz grandes.

**Por que aparece:** produz sensação de "profundidade fotográfica" rapidamente, sem geometria real.

**Por que não funciona no PdU:**
- Profundidade fotográfica é profundidade passiva — não responde ao usuário, não muda com a narrativa.
- Circles desfocados de cor roxa/dourada são literalmente o visual padrão de páginas de tarot e horóscopo de baixo custo.
- Cria neve visual que atrapalha a leitura de copy.

**Sintoma de aparição:** quando um designer de UI tenta criar "atmosfera" rapidamente sem Three.js ainda implementado.

**Alternativa válida:** na ausência de WebGL, o fundo do PdU é `#07060D` com gradiente radial mínimo centrado no portal estático. Sem bokeh. A atmosfera vem da composição, não da decoração de fundo.

---

### 4. Halo central genérico

**Descrição:** círculo luminoso grande no centro do viewport, geralmente um gradient radial de cor de destaque para transparente.

**Por que aparece:** é a versão mais simples de "criar foco no centro da tela".

**Por que não funciona no PdU:**
- É decoração sem função — o portal já cria o foco no centro.
- Um halo central estático não muda conforme o capítulo — é a negação da narrativa por luz.
- Cria interferência visual com a copy que também tende ao centro.

**Sintoma de aparição:** implementação do fundo antes do portal estar pronto.

**Alternativa válida:** o portal em si é o foco. Quando o portal não está centralizado (capítulo de Reconhecimento), não há halo — a assimetria da composição cria o foco.

---

### 5. Gradiente roxo como sinônimo de magia

**Descrição:** `background: linear-gradient(#6B21A8, #3B0764)` ou variações como background global ou de seção.

**Por que aparece:** associação cultural entre roxo e misticismo — é o caminho de menor resistência para comunicar "espiritual" visualmente.

**Por que não funciona no PdU:**
- É o background padrão de 80% dos concorrentes.
- A assinatura Volynx deve ser reconhecível porque não se parece com o campo.
- Gradiente roxo como fundo global achata a profundidade — tudo fica no mesmo plano.

**Sintoma de aparição:** durante a Etapa 0 (baseline) ou quando alguém tenta "dar cara de tarot" rapidamente.

**Alternativa válida:** `#07060D` como base. O acento violeta-azul (`#2D2952`) aparece no material do portal e na temperatura de luz da chegada — nunca como fundo global.

---

### 6. Glassmorphism em superfícies de conteúdo

**Descrição:** `backdrop-filter: blur()` + `background: rgba(255,255,255,0.05)` em cards, painéis ou containers de texto.

**Por que aparece:** comunica "premium" e "moderno" rapidamente. É uma das tendências mais usadas no design de produto 2021–2024.

**Por que não funciona no PdU:**
- Glassmorphism em conteúdo comunica "UI de app tech" — o oposto da sensação de ritual e profundidade espacial.
- Cria um plano adicional de leitura entre o usuário e o conteúdo — literalmente mais uma camada de vidro.
- Reduz legibilidade quando aplicado sobre backgrounds complexos (como a cena WebGL).
- Qualquer mudança no background inviabiliza o cálculo de contraste — impossível garantir 4.5:1.

**Sintoma de aparição:** quando um elemento de conteúdo precisa separar-se visualmente do fundo WebGL.

**Alternativa válida:** a copy sempre está em um plano onde a cena WebGL foi composicionalmente recuada ou escurecida naquela área. O contraste é garantido por controle de luz da cena, não por filtros CSS sobre o conteúdo. Para casos onde um container é necessário (modal, card de produto), usar `background: rgba(14, 12, 26, 0.92)` — opaco, não vítreo.

---

### 7. Parallax excessivo em múltiplos elementos

**Descrição:** múltiplas camadas com velocidades de scroll diferentes — elementos HTML, imagens, e canvas todos se movendo em velocidades distintas.

**Por que aparece:** comunicar profundidade por diferença de velocidade é intuitivo — é como funciona a perspectiva no mundo real.

**Por que não funciona no PdU:**
- Quando muitos elementos têm parallax, o efeito cancela a si mesmo — tudo parece se mover, mas nada parece ter peso.
- Parallax em elementos HTML e parallax na cena WebGL em simultâneo cria inconsistência de física.
- Em mobile, parallax horizontal causa motion sickness.

**Sintoma de aparição:** tentativa de criar profundidade antes da cena WebGL estar pronta.

**Alternativa válida:** a profundidade do PdU vem exclusivamente dos planos do Three.js. Elementos HTML não têm parallax — estão fixos no plano de interface. A câmera WebGL cria a ilusão de profundidade.

---

### 8. Animações de entrada de todos os lados

**Descrição:** elementos entrando pela esquerda, direita, cima e baixo — cada seção com uma direção diferente de entrada.

**Por que aparece:** bibliotecas de animação como AOS (Animate On Scroll) fazem isso por padrão.

**Por que não funciona no PdU:**
- Desorientam o olho — a narrativa visual exige que o movimento tenha um eixo dominante.
- A jornada do PdU é vertical (scroll para baixo = avança na narrativa). Entradas laterais contradizem esse eixo.
- Múltiplas direções simultâneas competem entre si e com o portal.

**Sintoma de aparição:** uso de AOS, Framer Motion com animações padrão, ou GSAP sem configuração intencional de direção.

**Alternativa válida:** elementos entram exclusivamente de baixo (fade + translateY). A exceção é a revelação das cartas, que emergem do portal — entradas específicas com função narrativa clara.

---

### 9. Cards para fragmentar todo o conteúdo

**Descrição:** todo trecho de conteúdo dentro de um card — com borda, padding, sombra e background próprio.

**Por que aparece:** é o padrão de UI mais ensinado — "isole o conteúdo em um container".

**Por que não funciona no PdU:**
- Cards comunicam "catálogo" e "lista" — o oposto de experiência contínua.
- Uma página de cards é uma grade de caixas. A direção de arte proíbe explicitamente "a lógica visual de uma sequência de caixas".
- Cards em superfície WebGL criam dissonância: o espaço é tridimensional, o conteúdo é flat.

**Sintoma de aparição:** qualquer vez que um desenvolvedor precisa "separar" conteúdo visualmente e recorre ao padrão de card por default.

**Alternativa válida:** a separação de conteúdo vem da composição e do respiro vertical. Tipografia com hierarquia clara substitui cards. Cards são reservados para itens verdadeiramente independentes: histórico de leituras (um card por leitura), produtos em checkout, opções que exigem comparação direta.

---

### 10. Parallax de scroll sequestrado

**Descrição:** o scroll do usuário é interceptado — a página não rola, uma animação avança.

**Por que aparece:** tenta criar experiências mais cinematográficas e controladas.

**Por que não funciona no PdU:**
- O usuário perde o controle — uma das regras absolutas da direção de arte é "o usuário nunca perde o controle da página".
- Em mobile, scroll sequestrado é especialmente problemático — gera sensação de trava.
- Incompatível com leitores de tela e navegação por teclado.

**Sintoma de aparição:** uso de `overflow: hidden` no body com animação controlada por ScrollTrigger.

**Alternativa válida:** ScrollTrigger com `scrub: true` em elementos WebGL — a cena reage ao scroll natural do usuário, não o substitui. O usuário sempre pode rolar livremente; a cena acompanha.

---

## Tabela de verificação rápida

Para revisão rápida antes de aprovar qualquer diff visual:

| Efeito | Presente? | Bloqueador? |
|---|---|---|
| Partículas flutuantes | [ ] | ❌ Sim |
| Glow externo (CSS filter) no portal | [ ] | ❌ Sim |
| Bokeh como fundo | [ ] | ❌ Sim |
| Halo central genérico | [ ] | ❌ Sim |
| Gradiente roxo como fundo global | [ ] | ❌ Sim |
| Glassmorphism em conteúdo | [ ] | ❌ Sim |
| Mais de 2 camadas de parallax HTML | [ ] | ⚠️ Ajuste |
| Animações de entrada em múltiplas direções | [ ] | ⚠️ Ajuste |
| Cards para todo fragmento de conteúdo | [ ] | ⚠️ Ajuste |
| Scroll sequestrado | [ ] | ❌ Sim |

---

## Quando um efeito "proibido" pode existir temporariamente

Durante o desenvolvimento, efeitos placeholder são aceitáveis — desde que marcados explicitamente no código:

```js
// TODO: placeholder — substituir pelo shader emissivo do portal antes da Etapa 3
const tempGlow = new THREE.PointLight(0x7B74A8, 2, 5)
scene.add(tempGlow)
```

O que não é aceitável: efeito placeholder entrando em PR sem essa marcação, ou sendo aprovado como solução final por estar "funcionando".
