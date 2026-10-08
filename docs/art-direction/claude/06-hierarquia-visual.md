# Hierarquia Visual — Portal, Cartas, Ícones e Copy

Responsável: Claude  
Data: 2026-06-27  
Escopo: regras de prioridade visual, z-order narrativo e como cada elemento cede espaço para o outro.

---

## 1. Princípio central

**Em qualquer momento, apenas um elemento tem protagonismo visual total.**

O olho humano segue hierarquia, não democracia. Uma página onde tudo compete pela atenção resulta em inércia — o usuário não sabe onde ir e não vai a lugar nenhum. A hierarquia do PdU é dinâmica: o elemento protagonista muda conforme o capítulo, mas em cada capítulo há clareza absoluta sobre quem lidera.

---

## 2. Protagonismo por capítulo

| Capítulo | Protagonista | Coadjuvante principal | Presente mas recuado | Ausente |
|---|---|---|---|---|
| Chegada | Portal | Copy (headline) | Logo/nav | Ícones, cartas |
| Reconhecimento | Copy + Ícone | Portal | Nav | Cartas |
| Escolha | Pergunta + Caminhos | Portal | Nav | Cartas |
| Abertura | Portal + Input | — | Nav | Ícones, cartas |
| Revelação | Cartas | Luz narrativa | Portal (fundo) | Ícones de UI |
| Integração | Copy (síntese) | Cartas (thumbnails) | Portal | Ícones |

**Regra de leitura da tabela:** se um elemento não está na coluna "Protagonista" ou "Coadjuvante principal", ele não pode chamar atenção para si mesmo. Deve ser visível mas passivo.

---

## 3. Z-order narrativo

O z-order não é apenas uma questão técnica de layers — é uma declaração de prioridade narrativa.

### 3.1 Stack de layers

```
Layer 5 — Interface crítica (sempre no topo)
  Modais, overlays de erro, confirmações de pagamento
  z-index: 1000+

Layer 4 — Interface funcional
  Navegação, CTAs, campos de input, botões
  z-index: 100–999

Layer 3 — Copy e conteúdo
  Headline, body text, síntese, interpretações
  z-index: 10–99

Layer 2 — Matéria simbólica (WebGL — Plano 2)
  Cartas, ícones protagonistas
  Renderizado em Three.js, posicionado virtualmente

Layer 1 — Portal e luz (WebGL — Plano 3)
  Portal, efeitos de luz, transmissão
  Renderizado em Three.js

Layer 0 — Cosmos (WebGL — Plano 4)
  Fundo, textura de vazio, ambiente
  Renderizado em Three.js
```

### 3.2 Sobreposição intencional

Elementos de Layer 3 (copy) podem parecer estar "dentro" do espaço WebGL por composição visual — mas tecnicamente estão acima do canvas. Essa ilusão é alcançada por:
- Copy posicionada onde não há elemento WebGL de alta densidade
- Sombra de texto muito suave contra o fundo WebGL (não `text-shadow` genérico)
- Contraste mantido pela redução de luminosidade da cena na área de copy

**Nunca** colocar copy dentro do canvas WebGL. Acessibilidade, SEO e performance agradecem.

---

## 4. Como cada elemento cede espaço

### 4.1 O portal cede para a copy

Quando copy importante precisa ser lida:
- Luminosidade do portal na área da copy reduz para metade do valor do capítulo
- Noise do portal na área da copy diminui (sem movimento próximo ao texto)
- A composição posiciona o portal fora do eixo central da copy

Implementação:
```js
// O portal "sabe" onde está a copy — recebe a bounding box dos elementos de texto
// e cria uma zona de baixa intensidade
function updatePortalCopyMask(textBoundingBoxes) {
  portalShader.uniforms.uCopyMask.value = textBoundingBoxes
  // No shader, a emissão é reduzida em 50% nas áreas da máscara
}
```

### 4.2 O portal cede para as cartas

Na Revelação:
- Portal recua fisicamente (câmera se afasta e portal diminui de escala)
- Luminosidade do portal reduz para 20%
- Luz narrativa assume a iluminação das cartas
- Portal permanece como âncora visual de fundo — não some

### 4.3 As cartas cedem para a síntese

Na Integração:
- Cartas reduzem para thumbnails (escala ~25% do tamanho de revelação)
- Thumbnails posicionadas no topo da área de conteúdo
- Copy de síntese ocupa o espaço principal

### 4.4 Os ícones cedem entre si

Quando múltiplos ícones estão presentes (capítulo de Escolha):
- Hover em um ícone: ele eleva, os outros reduzem para 60% de opacidade
- A redução de opacidade dos outros é suave (300ms) — não um corte
- O ícone sob hover não aumenta além de 110% da escala original — presença, não exibicionismo

### 4.5 A copy cede para a ação iminente

Quando o usuário está prestes a interagir (hover no CTA de Revelar, por exemplo):
- Copy de suporte ao redor reduz levemente de opacidade (80%)
- O CTA aumenta de contraste
- O portal reage à iminência com leve aumento de luminosidade

---

## 5. Regras tipográficas de hierarquia

### 5.1 Hierarquia por capítulo

```
Chegada:
  H1 (display) → copy âncora              [protagonista]
  Nada mais.

Reconhecimento:
  H2 (display) → frase de reconhecimento  [protagonista]
  Body → texto de suporte                 [coadjuvante]
  Label → nome do ícone em hover          [presente, passivo]

Escolha:
  H2 → pergunta âncora                    [protagonista]
  Label → nome de cada caminho            [coadjuvante]
  (sem body text — a complexidade seria ruído)

Abertura:
  H3 → pergunta ao usuário               [protagonista]
  Placeholder → instrução no input        [passivo]
  (sem copy adicional)

Revelação:
  Nome da carta (display) → protagonista por carta
  Body → interpretação conectada à pergunta
  Label small → pergunta original do usuário (âncora no topo)

Integração:
  Overline → label de seção (Síntese, Conselho, Afirmação)
  H3 → conteúdo de cada seção
  Body → desenvolvimento
  CTA → ação disponível
```

### 5.2 O que nunca coexiste em igualdade

Combinações proibidas — dois elementos no mesmo nível visual simultaneamente:

- H1 e H2 com tamanho similar na mesma viewport
- Dois CTAs primários side-by-side sem hierarquia clara
- Ícone protagonista e portal em escala máxima simultaneamente
- Três ou mais animações de entrada simultâneas
- Copy de revelação e copy de síntese no mesmo viewport sem separação clara

---

## 6. Hierarquia de CTAs

Os CTAs têm três níveis de presença visual:

**Primário** — uma ação por tela, máxima presença:
```
Estilo: fundo sólido, cor que contrasta com o capítulo, text em void
Exemplo: "Começar", "Revelar", "Salvar leitura"
Regra: apenas um CTA primário visível por vez
```

**Secundário** — ação alternativa, menor presença:
```
Estilo: borda fina, sem fundo, text na cor de contraste
Exemplo: "Entrar", "Ver histórico", "Nova pergunta"
Regra: máximo dois CTAs secundários por viewport
```

**Fantasma** — disponível mas não insistindo:
```
Estilo: apenas texto, sem borda ou fundo, opacidade 70%
Exemplo: "Conheça o Círculo", "Ver mais sobre as cartas"
Regra: CTAs comerciais começam como fantasma até o momento de valor percebido
```

### 6.1 Quando a oferta comercial aparece

O CTA do Círculo (oferta recorrente) nunca aparece como primário no primeiro acesso. Ordem de aparição:

1. Não existe até o final da Integração
2. Aparece como fantasma ao fim da síntese, após 3 segundos ou ao final do scroll
3. Nunca interrompe o fluxo de leitura
4. Na segunda e terceira visita, pode aparecer como secundário

---

## 7. Hierarquia em mobile

O mobile tem um viewport estreito e um dedo que oclui 1/4 da tela ao tocar. Isso muda algumas regras:

- **Somente um protagonista por viewport** — mais rigoroso que no desktop
- **CTAs primários: altura mínima 56px, largura mínima 200px** — tocáveis com polegar
- **Cartas: uma de cada vez** — não três simultâneas
- **Copy: nunca empurrada para fora do viewport por elemento visual** — o portal recua, não a copy
- **Ícones protagonistas: máximo um por viewport mobile** — dois ícones simultâneos criam competição

---

## 8. Checklist de hierarquia visual

Usar em cada revisão de protótipo:

```
[ ] Há um único protagonista visual por capítulo?
[ ] O portal não compete com a copy de leitura?
[ ] As cartas têm espaço suficiente ao redor (respiração)?
[ ] Nenhum ícone secundário tem mais peso visual que o protagonista?
[ ] A hierarquia tipográfica é evidente em 2 segundos sem instrução?
[ ] Os CTAs comerciais aparecem somente após entrega de valor?
[ ] No mobile, a hierarquia funciona com uma mão e tela em modo retrato?
[ ] A luz narrativa é a mais intensa no capítulo de Revelação?
[ ] Elementos passivos (nav, logo, labels) não pedem atenção?
[ ] Ao fazer zoom a 200%, a hierarquia ainda funciona?
```
