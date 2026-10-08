# Bíblia Visual — Palavras do Universo

Responsável: Claude  
Data: 2026-06-27  
Escopo: paleta por capítulo, tipografia, luz, contraste, materiais, tokens e linguagem visual completa.

---

## 1. Princípios que comandam todas as decisões visuais

Estes princípios têm hierarquia: quando há conflito, o anterior prevalece.

1. **Legibilidade antes de atmosfera.** A copy nunca perde contraste por causa de um efeito visual.
2. **Função antes de estética.** Cada elemento visual responde a uma das seis funções da direção de arte (progressão, hierarquia, resposta, preparação, significado, orientação).
3. **Peso antes de velocidade.** Objetos têm inércia. A desaceleração comunica mais que a aceleração.
4. **Oclusão antes de exposição.** O que está parcialmente oculto parece mais real.
5. **Contenção antes de acumulação.** Menos elementos simultâneos, mais impacto por elemento.

---

## 2. Paleta

### 2.1 Paleta base (invariante entre capítulos)

A paleta base define o sistema cromático do universo. Os capítulos modulam luminosidade e saturação dentro destes limites — nunca introduzem cores fora deste conjunto.

```
--color-void:        #07060D   /* fundo base — quase preto com velatura azul-violeta */
--color-deep:        #0E0C1A   /* fundo secundário */
--color-matter:      #1A1730   /* superfícies de objetos sombra */
--color-threshold:   #2D2952   /* bordas, planos médios */
--color-mist:        #4A456E   /* bruma, transições, profundidade média */
--color-ether:       #7B74A8   /* portal em repouso, ícones secundários */
--color-resonance:   #B8B0D4   /* portal ativo, texto secundário */
--color-clarity:     #E8E4F4   /* texto principal, portal máximo */
--color-light:       #F5F3FC   /* branco quente do universo */
```

**Acento por capítulo** (ver seção 2.2 — nunca como cor de fundo global):

```
--color-gold:        #C9A84C   /* revelação — cartas */
--color-amber:       #E8962A   /* abertura — energia do portal */
--color-sage:        #6B9E7A   /* integração — estabilidade */
--color-rose:        #C47B8A   /* reconhecimento — intimidade */
```

### 2.2 Paleta por capítulo

Cada capítulo tem uma temperatura de luz dominante e um acento. A paleta base permanece — o que muda é qual faixa é enfatizada.

| Capítulo | Temperatura | Luminosidade geral | Acento | Saturação |
|---|---|---|---|---|
| Chegada | Fria, azul-violeta | Baixa (3–8%) | Nenhum | Mínima |
| Reconhecimento | Fria com toque rosado | Baixa-média (8–15%) | Rose, localizado | Baixa |
| Escolha | Neutra | Média (15–25%) | Ether | Baixa-média |
| Abertura | Quente, âmbar emergindo | Concentrada no portal (30–50%) | Amber | Média |
| Revelação | Quente-dourado, dirigida | Alta no foco, baixa ao redor | Gold | Alta, localizada |
| Integração | Neutra-quente | Estável (20–30%), distribuída | Sage | Baixa |

---

## 3. Tipografia

### 3.1 Famílias

```
--font-display:   [serifada de alto contraste — ex: Cormorant Garamond ou equivalente]
--font-body:      [sans-serif humanista — ex: Inter ou equivalente já no projeto]
--font-mono:      [monospace para labels técnicos, se necessário]
```

**Regra:** fonte display aparece somente em títulos de capítulo e nomes de cartas. Nunca em UI funcional. Nunca em copy de suporte.

### 3.2 Escala

```
--text-xs:    0.75rem   / 12px   — labels, metadados
--text-sm:    0.875rem  / 14px   — texto de suporte, badges
--text-base:  1rem      / 16px   — corpo padrão
--text-lg:    1.125rem  / 18px   — corpo destacado
--text-xl:    1.25rem   / 20px   — sub-headline
--text-2xl:   1.5rem    / 24px   — headline de seção
--text-3xl:   1.875rem  / 30px   — headline de capítulo mobile
--text-4xl:   2.25rem   / 36px   — headline de capítulo desktop
--text-5xl:   3rem      / 48px   — nome de capítulo / momento de revelação
--text-display: 4rem+           — escala protagonista, raramente
```

### 3.3 Contraste obrigatório

Nenhum texto aparece com contraste abaixo de 4.5:1 contra o fundo imediato. Isso é inegociável mesmo durante transições de cena. A cena deve reduzir luminosidade ao redor do texto antes que o texto perca contraste.

### 3.4 Comportamento tipográfico por capítulo

| Capítulo | Peso | Tracking | Opacidade inicial | Comportamento |
|---|---|---|---|---|
| Chegada | Light | Normal | 0 → fade in lento | Entra de baixo, dissolve |
| Reconhecimento | Regular | Ligeiramente aberto | 80% → 100% | Emerge conforme scroll |
| Escolha | Regular / Medium | Normal | 100% | Estática, sem movimento |
| Abertura | Medium | Comprimido | 90% | Pulsa suavemente com o portal |
| Revelação | Semibold (display) | Aberto | 0 → 100% dramático | Entra com a carta |
| Integração | Regular | Normal | 100% | Estável, sem movimento |

---

## 4. Luz

### 4.1 Fontes de luz no sistema

O sistema tem três tipos de fonte de luz. Cada uma tem comportamento distinto:

**Luz ambiente (environment light)**
- Sempre presente, nunca zerada.
- Define a temperatura geral do capítulo.
- Nunca superior a 15% de intensidade. Se passar disso, achata a profundidade.

**Luz do portal (emissive / point light)**
- Nasce do portal, não ilumina o portal externamente.
- Intensidade controlada por capítulo (ver tabela).
- Cor navega do azul-violeta (chegada) para o âmbar (abertura) para o dourado (revelação) para neutro (integração).
- Nunca projetada diretamente na copy. A copy tem sua própria fonte de legibilidade.

**Luz narrativa (spot / directional)**
- Aparece nos capítulos de Revelação e Integração.
- Dirigida exclusivamente para cartas e copy de síntese.
- Cria o único momento em que a cena tem alto contraste positivo.

### 4.2 Intensidade de luz por capítulo

| Capítulo | Ambiente | Portal | Narrativa | Nota |
|---|---|---|---|---|
| Chegada | 5% | 8% | Off | Quase escuro. O portal existe, mas distante |
| Reconhecimento | 8% | 12% | Off | Começa a se aproximar |
| Escolha | 10% | 18% | Off | Portal mais próximo, caminhos distinguíveis |
| Abertura | 8% | 45% | Off | Portal domina. Ambiente diminui para contraste |
| Revelação | 6% | 20% | 70% | Luz narrativa assume protagonismo |
| Integração | 12% | 15% | 30% | Composição balanceada, descansa o olho |

### 4.3 O que a luz nunca faz

- Criar névoa constante sobre toda a tela.
- Esconder copy por baixo de glow.
- Usar bloom sem limite de raio — bloom sempre tem máscara de distância.
- Piscar ou pulsar sem razão narrativa.
- Criar dois focos de luz simultâneos de mesma intensidade (cria ambiguidade visual).

---

## 5. Materiais

### 5.1 Material do portal

O portal não é um objeto geométrico com textura. É um estado de matéria.

**Composição:**
- Base: geometria toroidal ou arco — forma determinada pelo protótipo, não antecipada aqui.
- Shader: emissivo com noise procedural de baixa frequência. A superfície não é estática.
- Transmissão: parcialmente translúcido no interior. O fundo atravessa levemente, com distorção mínima.
- Rim: borda mais luminosa que o centro. O centro é abertura, não massa.
- Profundidade: o interior deve parecer maior que o exterior. Perspectiva divergente deliberada.

**Comportamento físico:**
- Em repouso: oscila muito lentamente (frequência ~0.3 Hz). Parece respirar.
- Com interação do ponteiro: a oscilação aumenta no lado mais próximo. Resposta assimétrica.
- Em scroll: escala, abertura e luminosidade mudam conforme o capítulo. Nunca corte abrupto.
- Ao revelar cartas: contrai levemente antes de expandir. Antecipação antes da revelação.

### 5.2 Material das cartas

As cartas são objetos físicos, não imagens dentro de cards HTML.

- **Face:** textura com leve granulação. Não plástica, não brilhante em excesso.
- **Verso:** padrão geométrico sutil relacionado ao simbolismo do universo — sem replicar os ícones da interface.
- **Borda:** levemente arredondada, espessura visível. Não corte reto.
- **Reflexo:** especular suave, ângulo dependente da luz narrativa.
- **Sombra:** projetada sobre o plano imediatamente abaixo. Não sobre o fundo geral.
- **Rotação em hover:** máximo 3°. Comunicar presença, não exibicionismo.

### 5.3 Material dos ícones

Ícones são objetos pertencentes ao universo, não glifos decorativos.

- **Geometria:** levemente tridimensional — não completamente flat, não completamente 3D. Extrusão sutil.
- **Material:** semiopaco. Absorve luz do portal sem competir com ele.
- **Escala:** ícones protagonistas (símbolo em foco por capítulo) têm escala 3–5× os ícones de UI.
- **Profundidade:** ícones protagonistas habitam plano médio. Ícones de UI habitam plano de interface.

---

## 6. Planos de profundidade

O sistema tem quatro planos. Cada elemento pertence a exatamente um plano.

```
Plano 4 — Cosmos (fundo)
  Ambiente escuro, estrelas ou textura de vazio.
  Não interativo. Scroll: parallax muito lento (5-10%).

Plano 3 — Portal
  O portal e seus efeitos de luz.
  Interativo (responde ao ponteiro e scroll).
  Nunca sobrepõe copy principal.

Plano 2 — Matéria simbólica
  Cartas, ícones protagonistas, símbolos em foco.
  Interativos na Revelação e Integração.
  Leve parallax em resposta ao ponteiro (1-2%).

Plano 1 — Interface e copy
  Texto, CTAs, navegação.
  Sem parallax. Sempre estável.
  Contraste mantido independentemente dos planos abaixo.
```

**Regra:** um elemento nunca migra de plano entre capítulos sem transição explícita. A transição é parte da narrativa.

---

## 7. Movimento

### 7.1 Curvas de easing

```css
--ease-in:      cubic-bezier(0.4, 0, 1, 1)      /* entradas: usadas raramente */
--ease-out:     cubic-bezier(0, 0, 0.2, 1)       /* saídas e respostas ao usuário */
--ease-inout:   cubic-bezier(0.4, 0, 0.2, 1)     /* transições de estado */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1) /* resposta ao ponteiro — leve overshoot */
--ease-portal:  cubic-bezier(0.16, 1, 0.3, 1)    /* movimentos do portal — aceleração rápida, desaceleração longa */
```

### 7.2 Durações

```
--duration-instant:   100ms   /* feedback de UI imediato */
--duration-quick:     200ms   /* hover, focus */
--duration-medium:    400ms   /* entrada de elementos */
--duration-slow:      700ms   /* transições de capítulo */
--duration-portal:   1200ms   /* movimentos de câmera e portal */
--duration-reveal:   1800ms   /* surgimento de cartas */
```

### 7.3 Regras de movimento

- Máximo dois objetos em movimento simultâneo visível. Terceiro objeto só entra quando o primeiro termina ou diminui significativamente.
- O portal nunca para completamente — oscilação de repouso sempre ativa.
- Objetos grandes (portal, ícone protagonista) se movem 30–50% menos que objetos pequenos (partículas de luz, textura de fundo).
- Scroll controla progressão, nunca inicia movimento livre. O usuário está sempre no controle.
- `prefers-reduced-motion`: todos os movimentos são substituídos por crossfades. Nenhuma funcionalidade é perdida. A composição estática é tratada como deliverable próprio.

---

## 8. Composição

### 8.1 Grade editorial

O layout não usa uma grade rígida. Usa princípios de composição editorial:

- **Eixo vertical dominante:** elementos entram e saem no eixo vertical. Movimento horizontal é raro e significativo quando ocorre.
- **Assimetria controlada:** o portal habita um lado ou o centro — nunca ambos simultaneamente em displays menores. A copy ocupa o espaço oposto com respiro.
- **Respiro vertical:** entre capítulos, a composição respira. Não há preenchimento completo de viewport como objetivo.
- **Escala protagonista:** um único elemento tem escala dominante por capítulo. Outros elementos são coadjuvantes.

### 8.2 Mobile

Mobile não é uma versão reduzida do desktop. É uma composição própria.

No mobile:
- O portal ocupa mais do viewport verticalmente (tela estreita = portal mais alto).
- O eixo principal é vertical — nenhuma composição assume disposição lado a lado.
- A resposta ao ponteiro é substituída pela resposta à inclinação do dispositivo (gyroscope), com fallback para scroll.
- A escala dos ícones protagonistas é relativa ao viewport — no mobile, um ícone protagonista pode ocupar 40% da tela. No desktop, 20%.
- Copy tem fonte mínima de 16px. Sem exceção.

---

## 9. O que não existe nesta bíblia

Esta seção é tão importante quanto as anteriores. O que está ausente desta bíblia está ausente por decisão — não por esquecimento.

| Ausente | Por quê |
|---|---|
| Gradiente roxo como fundo | Comunica esoterismo genérico, não assinatura premium |
| Glassmorphism em superfícies de conteúdo | Reduz legibilidade sem adicionar profundidade real |
| Partículas e bokeh | Profundidade decorativa, sem função narrativa |
| Neon e glow excessivo | Confunde atmosfera de clube com atmosfera de ritual |
| Cores primárias saturadas | Quebram a contenção emocional da paleta |
| Grid simétrico de cards | Comunica catálogo, não experiência |
| Animações de entrada em todas as direções | Compete pela atenção em vez de guiar |
| Fontes decorativas em corpo de texto | Reduz velocidade de leitura sem ganho expressivo |
| Dois focos de luz simultâneos de igual intensidade | Cria ambiguidade — o olho não sabe onde ir |
| Scroll sequestrado | O usuário nunca perde o controle |
