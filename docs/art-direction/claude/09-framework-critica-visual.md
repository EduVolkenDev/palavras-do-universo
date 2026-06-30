# Framework de Crítica Visual Independente

Responsável: Claude  
Data: 2026-06-27  
Uso: aplicar em cada diff significativo do Codex antes de aprovação. Claude é o revisor — não o implementador.

---

## Como usar este framework

1. O Codex entrega um protótipo, diff ou screenshot.
2. Claude aplica cada seção deste framework sequencialmente.
3. O resultado é um relatório de crítica com: ✅ aprovado / ⚠️ ajuste necessário / ❌ bloqueador.
4. Bloqueadores impedem avanço para a próxima etapa. Ajustes podem ser corrigidos em paralelo. Aprovados não precisam de comentário adicional.

---

## Seção A — Coerência com a direção de arte

### A1 — Regra das seis funções

Cada efeito visual, animação ou elemento decorativo deve cumprir ao menos uma das seis funções:
1. Indicar progressão
2. Explicar hierarquia
3. Responder a uma escolha
4. Preparar uma revelação
5. Reforçar o significado
6. Orientar para a próxima ação

**Perguntas de revisão:**
- [ ] Existe algum efeito no protótipo que não cumpre nenhuma dessas funções?
- [ ] Existe algum elemento visual que existe apenas porque "fica bonito"?
- [ ] Algum movimento acontece sem que o usuário tenha iniciado uma ação ou avançado no scroll?

### A2 — Protagonismo visual

Em cada estado ou capítulo do protótipo:
- [ ] Há exatamente um protagonista visual?
- [ ] O protagonista é o correto para aquele capítulo (ver `04-capitulos.md`)?
- [ ] Os outros elementos são passivos sem serem invisíveis?

### A3 — O portal

- [ ] O portal tem oscilação de repouso? (Nunca completamente estático.)
- [ ] O portal nunca corta a copy por baixo? (Leitura sempre com contraste adequado.)
- [ ] A emissão do portal corresponde ao capítulo especificado?
- [ ] O portal não tem glow externo aplicado — a luz emana do material?

### A4 — Profundidade

- [ ] Os três planos são distinguíveis? (Cosmos, portal, matéria simbólica, interface.)
- [ ] Objetos do plano de fundo se movem menos que objetos do plano próximo?
- [ ] As cartas têm sombra projetada que as ancora no espaço?

---

## Seção B — O que não deve estar presente

Esta seção mapeia elementos proibidos. A presença de qualquer um é um bloqueador.

### B1 — Efeitos proibidos

- [ ] **Partículas orbitando o portal** → substituir por geometria com posição definida
- [ ] **Bokeh decorativo como fundo** → substituir por noise procedural ou void
- [ ] **Halo central genérico** → a emissão do portal substitui
- [ ] **Gradiente roxo como identidade de fundo** → paleta do projeto tem `#07060D` como base
- [ ] **Glassmorphism em cards de conteúdo** → reservado para overlays funcionais, se existirem
- [ ] **Chuva ou névoa de partículas** → sem exceções
- [ ] **Bloom sem máscara de distância** → bloom deve ter raio controlado e máscara

### B2 — Comportamentos proibidos

- [ ] **Scroll sequestrado** → o scroll deve sempre responder ao usuário, nunca ser bloqueado
- [ ] **Mais de dois movimentos simultâneos visíveis** → reduzir ou sequenciar
- [ ] **Texto entrando de múltiplas direções na mesma tela** → um único eixo de entrada por capítulo
- [ ] **Flash preto ou canvas vazio durante carregamento** → a cena só aparece quando pronta
- [ ] **Estado antigo visível durante nova leitura** → transição deve ocultar completamente o anterior
- [ ] **Animação que atrasa uma resposta já pronta da API** → animação máxima de revelação não deve ser mais longa que o tempo real de carregamento

### B3 — Copy proibida

- [ ] Promessas de resultado absoluto ("vai mudar sua vida", "a resposta que você precisa")
- [ ] Urgência artificial ("oferta por tempo limitado", "apenas hoje")
- [ ] Jargão de horóscopo popular ("as energias estão alinhadas")
- [ ] Placeholders genéricos no input ("Digite sua pergunta aqui", "Escreva algo")
- [ ] Labels funcionais em CTAs rituais ("Enviar", "Submit", "OK")
- [ ] Afirmações genéricas na Integração que não derivam da leitura

---

## Seção C — Acessibilidade

### C1 — Contraste

- [ ] Todo texto tem contraste mínimo de 4.5:1 contra o fundo imediato?
- [ ] O contraste foi verificado no estado mais desfavorável de luz (pico de intensidade do portal)?
- [ ] CTAs têm contraste de 3:1 para o texto interno vs fundo do botão?

### C2 — Reduced motion

- [ ] Com `prefers-reduced-motion: reduce`, todos os movimentos são substituídos por crossfades?
- [ ] A composição estática do portal SVG é tratada como deliverable visual completo?
- [ ] Nenhuma funcionalidade depende de animação para ser compreendida?

### C3 — Teclado e foco

- [ ] Todos os CTAs são alcançáveis por Tab?
- [ ] O estado de foco é visível e não conflita com a composição visual?
- [ ] O campo de input da Abertura recebe foco correto sem deslocamento inesperado?

### C4 — Mobile

- [ ] Em 390px, nenhum texto é menor que 16px?
- [ ] Todos os alvos de toque têm pelo menos 48×48px?
- [ ] O portal não é cortado lateralmente (deve ser mais alto, nunca mais estreito)?
- [ ] O teclado nativo não empurra conteúdo crítico para fora do viewport?

---

## Seção D — Performance

### D1 — Carregamento

- [ ] O HTML e a copy aparecem antes do canvas?
- [ ] O canvas não exibe estado vazio ou flash preto?
- [ ] O primeiro frame do canvas é o estado correto (chegada), não um estado intermediário?

### D2 — Frames

- [ ] O protótipo sustenta 55–60 FPS em desktop de referência?
- [ ] O perfil reduzido (mobile ou GPU limitada) mantém experiência suave?
- [ ] O canvas não bloqueia a thread principal durante interação com UI?

### D3 — Bundle

- [ ] Nenhuma dependência nova foi instalada sem justificativa documentada?
- [ ] O canvas é carregado com `next/dynamic` — não bloqueia SSR?

---

## Seção E — Responsividade e estados

### E1 — Resize e orientação

- [ ] O resize do viewport não quebra a composição?
- [ ] A mudança de orientação (portrait → landscape no mobile) restaura o estado correto?
- [ ] Links com hash continuam funcionais após a implementação?

### E2 — Estados de erro

- [ ] Erros de API têm tratamento humano e contextual?
- [ ] A pergunta do usuário é preservada em caso de erro?
- [ ] Nenhum estado de erro exibe conteúdo técnico para o usuário?

### E3 — Estados intermediários

- [ ] O scroll rápido não deixa animações pela metade?
- [ ] Voltar a uma seção restaura o estado correto (câmera, portal, luz)?

---

## Seção F — Narrativa e coerência

### F1 — Fluxo emocional

- [ ] A jornada Chegada → Integração é perceptível como progressão, não como seções independentes?
- [ ] A transição entre capítulos tem começo, foco e conclusão?
- [ ] A revelação das cartas cria antecipação antes da entrega (contração → expansão)?

### F2 — Consistência da assinatura

- [ ] O portal é reconhecível entre sessões sem repetir exatamente a mesma cena?
- [ ] A paleta mantém-se dentro dos limites especificados em `02-biblia-visual.md`?
- [ ] A tipografia usa display apenas em títulos e nomes de cartas?

---

## Modelo de relatório de crítica

```markdown
# Crítica Visual — [nome da etapa / diff]
Data: 
Revisado por: Claude
Diff ou screenshot: [referência]

## Resultado geral
[ ] Aprovado para avanço
[ ] Ajustes necessários (lista abaixo)
[X] Bloqueadores identificados (lista abaixo)

## Bloqueadores (impedem avanço)
- [B1/B2/etc] Descrição do problema + sugestão de correção

## Ajustes (podem ser corrigidos em paralelo)
- [A1/C1/etc] Descrição + sugestão

## Aprovados
- [seções que passaram sem comentário]

## Próxima ação recomendada
[o que o Codex deve fazer antes da próxima revisão]
```

---

## Nota sobre independência da revisão

Esta revisão é mais útil quando o Claude **não participou da implementação**. Se Claude sugeriu uma solução e o Codex implementou, o Codex deve ser o primeiro revisor — Claude deve revisar o diff sem ter visto o processo de implementação. Isso evita viés de confirmação (aprovar o que próprio agente sugeriu).

Quando houver dúvida sobre se um elemento específico passa nos critérios, a regra é: **melhor questionar e descobrir que passa do que aprovar e descobrir que não passa no navegador.**
