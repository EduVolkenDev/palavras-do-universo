# Etapa 1: Revisão técnica da direção de arte

Data: 27 de junho de 2026  
Revisor: Codex  
Material revisado: `docs/art-direction/claude/01` a `10`  
Resultado: aprovado com ajustes técnicos obrigatórios

## 1. Veredito

Os documentos entregues pelo Claude formam uma direção de arte coerente,
executável e alinhada ao baseline. Storyboard, capítulos, hierarquia, jornada
emocional e efeitos proibidos estão aprovados como referência visual.

A especificação técnica do portal é tratada como intenção, não como código
pronto. Alguns exemplos precisam ser simplificados para preservar performance,
privacidade e compatibilidade.

## 2. Decisões aprovadas

- A home será uma cena contínua dividida em seis capítulos.
- O portal será o objeto persistente que muda de função ao longo da jornada.
- HTML e copy permanecem fora do canvas.
- O usuário mantém o scroll nativo.
- Cada capítulo possui um protagonista visual.
- Mobile terá composição própria.
- Não haverá partículas, bokeh, halo genérico ou glassmorphism de conteúdo.
- A monetização aparece depois da entrega de valor.
- A leitura preserva pergunta, significado por carta, síntese, conselho e
  afirmação como uma única resposta coerente.
- PT e EN serão implementados juntos em toda copy nova.

## 3. Ajustes técnicos obrigatórios

### 3.1 Renderização

O portal não ficará em render loop permanente quando:

- a aba estiver em segundo plano;
- a cena estiver fora do viewport;
- `prefers-reduced-motion` estiver ativo;
- o perfil estiver em modo estático.

O protótipo usará renderização contínua apenas enquanto houver movimento
perceptível. A estratégia evoluirá para `frameloop="demand"` quando o sistema
de capítulos estiver estabilizado.

### 3.2 Mobile

Giroscópio não será ativado automaticamente. `DeviceOrientationEvent` pode
exigir permissão explícita e não é necessário para provar a assinatura.

Primeiro protótipo mobile:

- resposta ao scroll;
- movimento de repouso reduzido;
- sem sensor;
- DPR máximo 1;
- menor complexidade geométrica.

Sensor poderá ser testado posteriormente como enhancement opcional, iniciado
por ação clara do usuário.

### 3.3 Perfil de qualidade

Não usar:

- nome do renderer da GPU;
- `WEBGL_debug_renderer_info`;
- existência de `navigator.gpu` como indicador de potência;
- tamanho de viewport como única heurística.

O primeiro perfil considerará:

- `prefers-reduced-motion`;
- `navigator.deviceMemory`, quando disponível;
- `navigator.hardwareConcurrency`, quando disponível;
- viewport apenas como sinal complementar;
- redução automática após frames instáveis.

### 3.4 Material

O primeiro portal não usará:

- render target;
- HDRI;
- pós-processamento;
- bloom;
- shader de refração da cena;
- noise procedural customizado;
- `MeshPhysicalMaterial` com transmissão.

Esses recursos só entram depois que forma, escala, câmera e narrativa forem
aprovadas. O protótipo usará geometria, material emissivo, luz e oclusão para
provar profundidade com custo controlado.

### 3.5 Máscara de copy

Não enviar bounding boxes de múltiplos textos para shader nesta etapa. A
legibilidade será garantida por composição:

- portal deslocado;
- área editorial com fundo controlado;
- redução global de luz por capítulo;
- copy estável em DOM.

Uma máscara espacial só será considerada se a composição não resolver o
contraste.

## 4. Dependências

### Aprovadas

| Dependência | Versão validada | Uso |
| --- | --- | --- |
| `three` | 0.185.0 | Cena, câmera, geometria, material e luz |
| `@react-three/fiber` | 9.6.1 | Integração declarativa com React 19 |
| `gsap` | 3.15.0 | Timeline e futura progressão com ScrollTrigger |

### Adiada

| Dependência | Motivo |
| --- | --- |
| `@react-three/drei` | O protótipo não precisa de helpers adicionais |

React Three Fiber 9 declara compatibilidade com React 19. As três dependências
aprovadas podem ser carregadas apenas no cliente. GSAP e ScrollTrigger serão
importados de forma explícita para permitir tree shaking e cleanup.

## 5. Escopo do protótipo da Etapa 2

### Incluído

- canvas persistente no hero;
- portal tridimensional;
- planos de profundidade;
- luz originada no portal;
- resposta lenta ao ponteiro em desktop;
- progressão Chegada para Reconhecimento pelo scroll;
- pausa quando fora do viewport ou com página oculta;
- fallback visual existente;
- `prefers-reduced-motion`;
- qualidade mobile reduzida;
- carregamento dinâmico sem SSR;
- captura e medição antes/depois.

### Excluído

- capítulos Escolha a Integração;
- cartas 3D;
- refração;
- render targets;
- pós-processamento;
- giroscópio;
- HDRI;
- alteração do fluxo de leitura;
- alteração de checkout ou autenticação;
- substituição definitiva do hero.

## 6. Critérios de aceite do protótipo

- O portal parece matéria com espessura, não glow circular.
- A cena possui pelo menos três planos distinguíveis.
- O portal cede espaço para a copy.
- Scroll e hash continuam funcionais.
- Não há canvas vazio ou flash preto.
- A home funciona integralmente sem WebGL.
- `prefers-reduced-motion` entrega composição completa.
- Não há erro de hidratação ou console.
- Mobile não piora o TBT atual.
- O bundle WebGL não bloqueia o HTML inicial.
- O protótipo pode ser removido sem afetar fluxos existentes.

## 7. Handoff para revisão do Claude

Quando o protótipo estiver pronto, enviar:

- screenshots desktop e mobile;
- gravação curta da transição;
- diff dos componentes de direção de arte;
- resultados Lighthouse antes/depois;
- lista de limitações conhecidas.

Claude aplicará `09-framework-critica-visual.md` sem editar `src/**`.
