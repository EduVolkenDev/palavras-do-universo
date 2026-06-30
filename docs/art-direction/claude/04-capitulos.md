# Definição dos Seis Capítulos

Responsável: Claude  
Data: 2026-06-27  
Formato: especificação completa de cada capítulo para implementação pelo Codex.

---

## Estrutura de cada capítulo

Cada capítulo especifica:
- **Pergunta emocional do usuário** — o que ele está sentindo ao entrar nesta etapa
- **Função narrativa** — o que a experiência precisa entregar
- **Estado da câmera** — posição, zoom, ângulo
- **Estado do portal** — escala, abertura, material, luminosidade
- **Símbolo em foco** — ícone protagonista (se houver)
- **Intensidade de luz** — ambiente, portal, narrativa
- **Resposta ao ponteiro/toque** — o que a interação revela
- **Densidade visual permitida** — quão "cheio" pode estar o viewport
- **Copy âncora** — frase que define o tom (não necessariamente o copy final)
- **Transição de entrada** — como se chega neste capítulo
- **Transição de saída** — como se avança para o próximo

---

## Capítulo 1 — Chegada

```ts
chapter: "arrival"
```

**Pergunta emocional:** "Onde estou? Posso confiar nisso?"

**Função narrativa:** estabelecer presença, criar confiança, apresentar o universo sem explicar demais.

**Estado da câmera:**
- Posição: distante, levemente acima do eixo do portal
- Zoom: mínimo — o portal parece pequeno, ao longe
- Ângulo: neutro, levíssima inclinação para baixo (2–3°) que cria sensação de olhar para um mundo
- Movimento: câmera fixa em chegada, inicia movimento suave de aproximação apenas com o primeiro scroll

**Estado do portal:**
- Escala: 40% da escala final
- Abertura: fechada — o portal é um anel, não uma passagem ainda
- Material: opacidade 70%, reflexo mínimo, borda levemente luminosa
- Luminosidade emissiva: 8%
- Oscilação de repouso: ativa, 0.3 Hz, amplitude mínima

**Símbolo em foco:** nenhum. A chegada pertence ao portal, não a um símbolo específico.

**Intensidade de luz:**
- Ambiente: 5%, fria (5200K)
- Portal: 8%
- Narrativa: off

**Resposta ao ponteiro:**
- Portal oscila levemente na direção do ponteiro
- Amplitude máxima: 5° de rotação
- Delay: 300ms — resposta lenta, não imediata

**Densidade visual:** mínima. Portal, headline, logo. Nada mais.

**Copy âncora (PT):** "Palavras do Universo. Clareza que emerge do símbolo."  
**Copy âncora (EN):** "Palavras do Universo. Clarity that rises from symbol."

**Transição de entrada:** fade in da cena a partir do void — a câmera está posicionada, o portal aparece dissolving (1800ms)

**Transição de saída:** câmera inicia aproximação, portal cresce de escala, headline desce e some, copy de reconhecimento emerge

---

## Capítulo 2 — Reconhecimento

```ts
chapter: "recognition"
```

**Pergunta emocional:** "Isso fala comigo? Estou sendo visto?"

**Função narrativa:** criar espelho. O usuário deve sentir que a experiência sabe por que ele está aqui.

**Estado da câmera:**
- Posição: aproximando, ainda distante mas visivelmente mais próxima
- Zoom: 60–70% do zoom final
- Ângulo: levemente oblíquo — o portal está à direita, a câmera compensa para a esquerda
- Movimento: drift lento lateral enquanto o usuário lê

**Estado do portal:**
- Escala: 75–80% da escala final
- Abertura: levemente aberta — uma fissura de luz no centro
- Material: borda rosada emergindo, emissão levemente rosada no interior
- Luminosidade emissiva: 12%
- Oscilação: presente, mais visível que na chegada

**Símbolo em foco:** primeiro ícone protagonista — relacionado à fase ou intenção do usuário.  
- Escala: 180–220px em desktop, centralizado em mobile
- Posição: plano médio, à esquerda do portal
- Comportamento: emerge lentamente (700ms), hover revela nome simbólico

**Intensidade de luz:**
- Ambiente: 8%, temperatura rosada (3800K)
- Portal: 12%
- Narrativa: off

**Resposta ao ponteiro:**
- Ícone protagonista responde com rotação suave (3°) e leve elevação (4px)
- Portal mantém resposta lenta

**Densidade visual:** baixa. Portal, ícone protagonista, copy de reconhecimento, logo/nav.

**Copy âncora (PT):** "Isso é para quem sente que precisa de mais clareza do que de mais informação."  
**Copy âncora (EN):** "This is for those who need more clarity than more information."

**Transição de entrada:** câmera desloca, ícone protagonista dissolve de baixo, copy de chegada some, copy de reconhecimento emerge

**Transição de saída:** ícone protagonista recua para plano mais fundo, portal centraliza, câmera continua aproximando, caminhos emergem

---

## Capítulo 3 — Escolha

```ts
chapter: "paths"
```

**Pergunta emocional:** "O que posso fazer aqui? Qual é o caminho certo para mim?"

**Função narrativa:** expor os caminhos com clareza sem criar ansiedade de decisão. A arquitetura visual deve tornar a escolha óbvia, não sobrecarregada.

**Estado da câmera:**
- Posição: centralizada, olhando diretamente para o portal
- Zoom: 80–85% do zoom final
- Ângulo: frontal, sem inclinação
- Movimento: mínimo — estabilidade comunica que há tempo para escolher

**Estado do portal:**
- Escala: 90% da escala final
- Abertura: média — claramente uma passagem, mas ainda não totalmente aberta
- Material: neutro, sem acento de cor específico — aguarda a escolha do usuário
- Luminosidade emissiva: 18%
- Oscilação: reduzida — o portal aguarda

**Símbolo em foco:** três ícones menores, um por caminho, posicionados ao redor do portal como pontos de saída.  
- Escala: 80–100px cada
- Comportamento: hover ilumina o ícone e o caminho correspondente, outros ícones reduzem para 60% de opacidade

**Intensidade de luz:**
- Ambiente: 10%, neutra (4000K)
- Portal: 18%
- Narrativa: off
- Detalhe: cada caminho tem um fio de luz que conecta o ícone ao portal — não uma linha visível, mas uma variação de intensidade no caminho

**Resposta ao ponteiro:**
- Hover em cada caminho: ícone eleva, fio de luz intensifica, outros caminhos recuam suavemente
- Portal: responde ao caminho sob hover com leve distorção na direção do ponteiro

**Densidade visual:** média. Portal, três ícones, labels dos caminhos, pergunta âncora. Sem texto de suporte neste capítulo.

**Copy âncora (PT):** "O que você está carregando hoje?"  
**Copy âncora (EN):** "What are you carrying today?"

**Transição de entrada:** câmera centraliza, ícone de reconhecimento recua, três caminhos emergem em sequência (300ms de intervalo entre cada)

**Transição de saída (por clique):** caminho selecionado ilumina completamente, outros dois somem, portal inicia expansão, câmera avança — Abertura começa

**Transição de saída (por scroll):** caminhos permanecem visíveis, mais contexto sobre cada caminho emerge abaixo

---

## Capítulo 4 — Abertura

```ts
chapter: "opening"
```

**Pergunta emocional:** "O que acontece quando eu participo? Vale a entrega?"

**Função narrativa:** transformar a ação (digitar a pergunta) em ritual. O usuário deve sentir que está iniciando algo real, não preenchendo um formulário.

**Estado da câmera:**
- Posição: close — o portal ocupa grande parte do viewport
- Zoom: 95% do zoom final
- Ângulo: levemente de baixo para cima — olhar para dentro do portal
- Movimento: leve oscilação suave da câmera, como respiração

**Estado do portal:**
- Escala: 100% da escala final — máxima presença
- Abertura: expandindo durante este capítulo
- Material: luz âmbar emergindo do centro, borda vibrando suavemente
- Luminosidade emissiva: 45% — o portal domina
- Sequência de revelação: quando o usuário submete a pergunta, o portal contrai levemente (antecipação, 300ms) e depois expande (revelação, 1200ms)

**Símbolo em foco:** nenhum ícone de conteúdo. O portal é o único protagonista. O campo de input integra-se à composição como um vão de passagem no portal.

**Intensidade de luz:**
- Ambiente: 8% (reduzida para criar contraste com o portal)
- Portal: 45%
- Narrativa: off

**Resposta ao ponteiro/toque:**
- Enquanto o usuário digita: portal respira ligeiramente (oscilação aumenta para 0.5 Hz)
- Ao submeter: sequência de contração → expansão descrita acima

**Densidade visual:** alta no portal, baixa em tudo mais. Apenas o campo de pergunta e o CTA de submissão. Nenhum texto de suporte.

**Copy âncora (PT):** "Qual é a pergunta que você traz para este momento?"  
**Copy âncora (EN):** "What is the question you bring to this moment?"

**Transição de entrada:** câmera avança rapidamente (500ms), outros elementos saem, portal expande, luz âmbar intensifica

**Transição de saída:** após submissão — portal contrai, pausa de 300ms, expande ao máximo, cartas surgem do interior

---

## Capítulo 5 — Revelação

```ts
chapter: "revelation"
```

**Pergunta emocional:** "O que as cartas significam para mim, especificamente?"

**Função narrativa:** conectar pergunta, cartas e significado de forma que o usuário sinta que a resposta é sua — não genérica.

**Estado da câmera:**
- Posição: recuada do close da Abertura — as cartas precisam de espaço
- Zoom: 70% do zoom final
- Ângulo: levemente de cima para baixo — olhar para as cartas como objetos sobre uma superfície
- Movimento: câmera estabiliza ao entrar nas cartas. Sem drift. O foco é o conteúdo.

**Estado do portal:**
- Escala: 80% — recuou para o fundo
- Abertura: mantida — as cartas saíram por ela
- Material: dourado, luz narrativa emerge do portal e atinge as cartas
- Luminosidade emissiva: 20% — presente mas não protagonista
- Posição: fundo, levemente elevado — serve de cenário, não de foco

**Símbolo em foco:** as três cartas, cada uma como objeto protagonista.
- Desktop: disposição em leque horizontal, escala real (proporção de carta física)
- Mobile: vertical sequencial ou carousel
- Surgimento: progressivo com 400ms de intervalo entre cada carta
- Orientação: cada carta pode ser normal ou invertida — a orientação é parte do significado

**Intensidade de luz:**
- Ambiente: 6%
- Portal: 20%
- Narrativa: 70% — dirigida do portal para as cartas, cria sombras que tornam as cartas físicas

**Resposta ao ponteiro:**
- Hover em cada carta: leve elevação (8px), rotação sutil (2°), reflexo especular visível
- Copy da carta emerge em hover (desktop) ou toque (mobile)

**Densidade visual:** média-alta. Três cartas, seus significados, a pergunta do usuário visível no topo como âncora.

**Copy âncora (PT):** "[pergunta do usuário] + nome das cartas + interpretação conectada"  
**Copy âncora (EN):** idem em inglês conforme idioma selecionado

**Transição de entrada:** portal expande → cartas emergem uma a uma do interior do portal → câmera recua para revelar todas as três → luz narrativa se estabiliza

**Transição de saída:** cartas reduzem levemente de escala e se posicionam no topo da tela como thumbnails, síntese emerge abaixo

---

## Capítulo 6 — Integração

```ts
chapter: "integration"
```

**Pergunta emocional:** "O que faço com isso agora? O que levo daqui?"

**Função narrativa:** entregar síntese, conselho e afirmação de forma que o usuário saia com clareza e uma ação possível — sem pressão.

**Estado da câmera:**
- Posição: recuada, estável
- Zoom: 60% do zoom final
- Ângulo: frontal, neutro
- Movimento: sem movimento. Este é o capítulo de maior estabilidade.

**Estado do portal:**
- Escala: 60% — presente mas claramente coadjuvante
- Abertura: levemente reduzida — o ritual encerra
- Material: luz sage (verde suave), temperatura quente
- Luminosidade emissiva: 15%
- Oscilação: volta à frequência de repouso (0.3 Hz)

**Símbolo em foco:** as três cartas em formato thumbnail no topo. Nenhum ícone protagonista — o protagonista é a síntese.

**Intensidade de luz:**
- Ambiente: 12%, neutra-quente (3500K)
- Portal: 15%
- Narrativa: 30% — distribuída, não dirigida

**Resposta ao ponteiro:** mínima. Este é o momento de leitura e reflexão, não de exploração.

**Densidade visual:** média. Síntese, conselho, afirmação, thumbnails das cartas, CTAs. Composição calma.

**Copy âncora (PT):** "Síntese / Conselho / Afirmação / [CTAs sem urgência]"  
**Copy âncora (EN):** "Synthesis / Advice / Affirmation / [CTAs without urgency]"

**CTAs neste capítulo (ordem de prioridade):**
1. Salvar leitura (funcional, não comercial)
2. Nova pergunta (continuidade)
3. Conheça o Círculo (oferta — aparece após 3 segundos ou ao final do scroll, nunca interrompe)

**Transição de entrada:** cartas se posicionam como thumbnails, síntese dissolve de baixo, câmera recua, portal diminui, luz sage emerge

**Transição de saída:** usuário sai para outra seção ou fecha a leitura. Não há transição automática para outro capítulo — a integração é o fim do ritual.

---

## Tabela-resumo dos seis capítulos

| | Chegada | Reconhecimento | Escolha | Abertura | Revelação | Integração |
|---|---|---|---|---|---|---|
| **Portal** | 40%, fechado | 75%, fissura | 90%, médio | 100%, expandindo | 80%, fundo | 60%, fechando |
| **Luz portal** | 8% | 12% | 18% | 45% | 20% | 15% |
| **Luz narrativa** | Off | Off | Off | Off | 70% | 30% |
| **Ícone foco** | Nenhum | 1 protagonista | 3 pequenos | Nenhum | 3 cartas | Thumbnails |
| **Câmera** | Distante | Aproximando | Central | Close | Recuada | Estável |
| **Densidade** | Mínima | Baixa | Média | Baixa | Média-alta | Média |
| **Movimento** | Lento | Drift | Estável | Respiração | Estável | Mínimo |
| **Acento de cor** | Nenhum | Rose | Nenhum | Amber | Gold | Sage |
