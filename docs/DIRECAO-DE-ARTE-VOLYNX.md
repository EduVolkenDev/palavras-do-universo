# Palavras do Universo: Direção de Arte Volynx

Status: Etapas 0 e 1 concluídas; protótipo técnico da Etapa 2 concluído e aguardando aprovação visual  
Branch de experimentação: `codex/art-direction-experience`  
Worktree: `/Users/eduardovolkenair/palavras-do-universo-art-direction`  
Última atualização: 27 de junho de 2026

## 1. Propósito

Este documento é a fonte de verdade para transformar Palavras do Universo em
uma experiência digital contínua, espacial, emocional e reconhecível.

O objetivo não é adicionar mais efeitos a uma página convencional. O objetivo
é abandonar a lógica visual de uma sequência de caixas e construir uma
travessia na qual conteúdo, interação, movimento, profundidade e narrativa
tenham uma única direção de arte.

O projeto deve continuar:

- claro antes de ser espetacular;
- rápido antes de ser complexo;
- acessível antes de ser experimental;
- emocional sem ser fatalista;
- premium sem parecer ostentação genérica;
- mágico sem recorrer a partículas, halos e brilhos aleatórios;
- comercial sem interromper o ritual com pressão artificial.

## 2. Norte da experiência

### 2.1 A jornada

A página principal deve ser percebida como um único espaço:

```text
Chegada -> Reconhecimento -> Escolha -> Abertura -> Revelação -> Integração
```

Cada etapa possui uma função:

| Etapa | Pergunta do usuário | Resposta da experiência |
| --- | --- | --- |
| Chegada | Onde estou? | Apresenta o universo e estabelece confiança. |
| Reconhecimento | Isso fala comigo? | Reflete a fase e a intenção atual. |
| Escolha | O que posso fazer aqui? | Expõe caminhos sem catálogo confuso. |
| Abertura | O que acontece quando participo? | Transforma a ação em ritual. |
| Revelação | O que as cartas significam para mim? | Conecta pergunta, contexto e cartas. |
| Integração | O que faço com isso agora? | Entrega síntese, conselho e próximo passo. |

### 2.2 Regra principal

Magia sem orientação é ruído. Toda transformação visual deve cumprir pelo
menos uma destas funções:

1. indicar progressão;
2. explicar hierarquia;
3. responder a uma escolha;
4. preparar uma revelação;
5. reforçar o significado;
6. orientar para a próxima ação.

Se um efeito não cumprir nenhuma dessas funções, ele não entra no produto.

## 3. Assinatura visual Volynx

### 3.1 Portal vivo

O portal é o elemento espacial persistente da experiência. Ele não deve ser um
círculo brilhante aplicado como decoração.

Comportamentos esperados:

- começa distante e parcialmente oculto;
- reage discretamente à posição do ponteiro e à inclinação do dispositivo;
- muda de escala, material, abertura e luminosidade conforme o scroll;
- organiza a entrada e a saída dos símbolos;
- prepara o surgimento das cartas;
- perde intensidade quando o texto exige leitura;
- permanece reconhecível entre sessões, sem repetir exatamente a mesma cena.

### 3.2 Matéria simbólica

Cartas, ícones e símbolos devem parecer objetos pertencentes ao universo, não
imagens colocadas dentro de cards.

Características:

- presença física e escala protagonista;
- planos de profundidade diferentes;
- sombras, oclusão e refração coerentes;
- movimento com peso e desaceleração;
- resposta sutil ao usuário;
- posição vinculada à narrativa, não a uma grade rígida.

### 3.3 Luz narrativa

A iluminação representa o estado da jornada:

- chegada: luz baixa, foco distante;
- reconhecimento: contraste mais íntimo e localizado;
- escolha: caminhos visualmente distinguíveis;
- abertura: concentração de energia no portal;
- revelação: luz dirigida para cartas e significados;
- integração: composição calma, estável e legível.

A luz nunca deve reduzir contraste, esconder copy ou criar uma névoa constante.

### 3.4 Movimento com intenção

O sistema de movimento deve seguir estes princípios:

- entrada lenta, resposta imediata e saída suave;
- poucos movimentos simultâneos;
- objetos grandes se movem menos que detalhes pequenos;
- o scroll controla progressão, não reproduz vídeos;
- o usuário nunca perde o controle da página;
- hover e toque revelam informação, não apenas aumentam escala;
- transições preservam contexto entre o antes e o depois.

### 3.5 O que não faz parte da assinatura

- chuva de partículas;
- bolinhas orbitando;
- bokeh decorativo;
- halo central genérico;
- gradiente roxo como sinônimo de magia;
- glassmorphism aplicado em toda superfície;
- cards para qualquer fragmento de conteúdo;
- animações independentes competindo pela atenção;
- parallax excessivo;
- scroll bloqueado ou artificial;
- texto entrando de todas as direções.

## 4. Arquitetura da página

### 4.1 Camadas

A experiência será organizada em quatro camadas independentes:

```text
Camada 1: conteúdo semântico e interativo em React/HTML
Camada 2: composição editorial e responsiva em CSS/Tailwind
Camada 3: coreografia e progressão em GSAP/ScrollTrigger
Camada 4: espaço, materiais e profundidade em Three.js/WebGL
```

Responsabilidades não devem se misturar:

- HTML mantém conteúdo, SEO, formulários e acessibilidade;
- CSS mantém layout, tipografia, contraste e estados;
- GSAP coordena tempo e relação com o scroll;
- Three.js renderiza somente o que exige profundidade real.

### 4.2 Cena persistente

A home deve possuir uma cena visual persistente atrás ou entre os conteúdos.
Ela atravessa a página e muda de estado por capítulos, em vez de reiniciar em
cada seção.

Estados iniciais propostos:

```ts
type SceneChapter =
  | "arrival"
  | "recognition"
  | "paths"
  | "opening"
  | "revelation"
  | "integration";
```

Cada capítulo define:

- posição e escala da câmera;
- estado do portal;
- símbolo ou carta em foco;
- intensidade da luz;
- resposta ao ponteiro;
- densidade visual permitida;
- transição para o próximo capítulo.

### 4.3 Conteúdo fora de caixas

O conteúdo deve usar:

- composição assimétrica;
- respiro vertical;
- elementos que atravessam limites entre capítulos;
- texto alinhado a objetos da cena;
- linhas editoriais e mudanças de escala;
- áreas abertas em vez de fundos retangulares;
- cards apenas para itens realmente independentes ou acionáveis.

Cards continuam válidos para:

- opções repetidas que exigem comparação;
- histórico individual;
- produtos em checkout;
- modais;
- estados que precisam de contorno interativo claro.

## 5. Arquitetura técnica proposta

### 5.1 Tecnologias

Proposta inicial, sujeita à validação do protótipo:

- `three`: renderização WebGL e futura evolução para WebGPU;
- `@react-three/fiber`: integração declarativa entre React e Three.js;
- `@react-three/drei`: utilitários selecionados, sem depender de presets visuais;
- `gsap` com `ScrollTrigger`: coreografia e progressão por scroll;
- React 19 e Next.js já presentes no projeto;
- Tailwind/CSS existente para composição editorial;
- `next/dynamic` para carregar a cena apenas no cliente;
- WebGL 2 como experiência completa;
- DOM/CSS como fallback funcional.

Antes da instalação, devem ser verificados:

1. compatibilidade com Next.js 16 e React 19;
2. impacto no bundle;
3. licença de cada dependência;
4. comportamento com SSR;
5. suporte a dispositivos móveis;
6. necessidade real de cada pacote.

### 5.2 Fronteiras sugeridas

Estrutura alvo inicial:

```text
src/
  components/
    art-direction/
      UniverseExperience.tsx
      UniverseCanvas.tsx
      ExperienceChapter.tsx
      ReducedMotionExperience.tsx
  lib/
    art-direction/
      chapters.ts
      quality.ts
      scene-state.ts
  styles/
    art-direction.css
```

Assets futuros:

```text
public/
  art-direction/
    models/
    textures/
    environment/
```

Não mover arquivos existentes apenas para satisfazer esta estrutura. Ela deve
ser adotada de forma incremental quando o protótipo justificar.

### 5.3 Carregamento progressivo

Ordem esperada:

1. HTML, navegação e copy aparecem imediatamente;
2. composição CSS estabiliza sem layout shift;
3. cena leve é carregada dinamicamente;
4. qualidade visual é escolhida pela capacidade do dispositivo;
5. texturas e objetos secundários entram sob demanda;
6. falhas de WebGL preservam a experiência funcional.

Não exibir canvas vazio, flash preto ou conteúdo antigo enquanto uma nova cena
é preparada.

### 5.4 Perfis de qualidade

```text
High: desktop potente, WebGL 2, DPR controlado
Balanced: notebooks e celulares modernos
Reduced: GPU limitada, economia de dados ou bateria
Static: sem WebGL ou prefers-reduced-motion
```

O perfil nunca deve depender apenas do tamanho da tela. Deve considerar
capacidade gráfica, memória disponível quando detectável, preferência de
movimento e estabilidade dos frames.

## 6. Roadmap executável

### Etapa 0 - Baseline e proteção

Objetivo: registrar o estado atual e impedir regressões invisíveis.

Entregáveis:

- [x] capturas desktop em 1440x900 e 1920x1080;
- [x] capturas mobile em 390x844 e 430x932;
- [x] inventário das seções e CTAs existentes;
- [x] medição inicial de LCP, CLS e peso de JavaScript;
- [ ] medição de INP com dados reais de campo;
- [ ] gravação do fluxo da leitura atual;
- [ ] lista dos textos e traduções PT/EN presentes;
- [x] confirmação de que o worktree isolado executa localmente.

Resultados e evidências:

- [`art-direction/ETAPA-0-BASELINE.md`](./art-direction/ETAPA-0-BASELINE.md)

Critérios de aceite:

- o estado atual pode ser comparado visualmente;
- os fluxos comerciais e de leitura estão documentados;
- nenhum arquivo da branch estável foi alterado.

### Etapa 1 - Bíblia de direção de arte

Objetivo: fechar a linguagem antes de construir efeitos.

Entregáveis:

- [x] paleta por capítulo;
- [x] regras de luz e contraste;
- [x] escala e função de cada família de ícones;
- [x] materiais do portal e das cartas;
- [x] referências de movimento, sem copiar identidade;
- [x] storyboard com 6 a 8 quadros;
- [x] lista explícita do que não será usado.

Critérios de aceite:

- cada quadro mostra objetivo, ação e transição;
- portal, cartas e copy possuem hierarquia inequívoca;
- a composição não depende de cards para funcionar;
- mobile possui storyboard próprio, não uma redução do desktop.

Revisão técnica:

- [`art-direction/ETAPA-1-REVISAO-CODEX.md`](./art-direction/ETAPA-1-REVISAO-CODEX.md)

### Etapa 2 - Protótipo da assinatura

Objetivo: provar a linguagem com uma única cena antes de reformar a home.

Escopo:

- portal persistente;
- um ícone protagonista;
- três planos de profundidade;
- transformação vinculada ao scroll;
- resposta sutil ao ponteiro;
- transição entre dois capítulos;
- fallback estático equivalente.

Fora do escopo:

- refazer toda a copy;
- migrar todas as seções;
- criar o ritual completo;
- instalar efeitos adicionais;
- alterar checkout ou autenticação.

Critérios de aceite:

- a cena comunica profundidade sem partículas;
- o ícone é protagonista e permanece legível;
- a copy mantém contraste durante toda a transição;
- não há scroll horizontal ou layout shift;
- o protótipo sustenta 55-60 FPS em desktop de referência;
- o perfil reduzido permanece suave em mobile;
- `prefers-reduced-motion` entrega uma composição completa.

Checkpoint: somente após aprovação visual desta etapa a linguagem será
replicada no restante da home.

Implementação e evidências:

- [`art-direction/prototype-01/README.md`](./art-direction/prototype-01/README.md)
- portal persistente e progressão Chegada para Reconhecimento implementados;
- fallback, movimento reduzido e perfis de qualidade implementados;
- build, navegação por hash, desktop e mobile validados;
- aprovação visual e medição em hardware móvel real ainda pendentes.

### Etapa 3 - Sistema de capítulos

Objetivo: transformar a home em uma narrativa contínua.

Entregáveis:

- [ ] estado central dos capítulos;
- [ ] transições de câmera;
- [ ] coreografia de portal, símbolos e luz;
- [ ] marcadores semânticos no DOM;
- [ ] sistema de entrada e saída da copy;
- [ ] navegação direta que posiciona cena e conteúdo corretamente;
- [ ] recuperação após resize e mudança de orientação.

Critérios de aceite:

- cada capítulo possui começo, foco e conclusão;
- scroll rápido não deixa animações pela metade;
- voltar a uma seção restaura o estado correto;
- links com hash continuam funcionais;
- o usuário entende a próxima ação sem instrução adicional.

### Etapa 4 - Reconstrução editorial da home

Objetivo: remover a sensação de página quadrada.

Entregáveis:

- [ ] hero integrado à cena;
- [ ] caminhos de entrada reorganizados;
- [ ] produtos apresentados como experiências;
- [ ] Círculo integrado à narrativa;
- [ ] prova de valor sem tabela genérica;
- [ ] ícones reposicionados como objetos espaciais;
- [ ] remoção de caixas sem função;
- [ ] i18n PT/EN para toda copy nova ou alterada.

Critérios de aceite:

- nenhuma área parece vazia por falta de composição;
- nenhum container parece perdido;
- elementos decorativos não competem com CTAs;
- a oferta gratuita, avulsa e recorrente continua compreensível;
- os dois idiomas mantêm hierarquia e encaixe equivalentes.

### Etapa 5 - Ritual de leitura

Objetivo: transformar carregamento e resultado em uma sequência coerente.

Fluxo:

```text
Pergunta -> preparação -> abertura -> surgimento das cartas
-> significado individual -> conexão com a pergunta
-> síntese -> conselho -> afirmação -> próximo passo
```

Entregáveis:

- [ ] pergunta posicionada antes das cartas;
- [ ] transição que oculta integralmente o spread anterior;
- [ ] estado de preparação legível;
- [ ] abertura do portal;
- [ ] surgimento progressivo das três cartas;
- [ ] significado específico de cada carta;
- [ ] interpretação conectada à pergunta e ao perfil;
- [ ] conselho e afirmação derivados da mesma leitura;
- [ ] tratamento de erro que não simula resultado;
- [ ] i18n integral do fluxo.

Critérios de aceite:

- cartas antigas nunca aparecem durante nova leitura;
- nenhum placeholder genérico é apresentado como significado;
- pergunta, cartas, síntese, conselho e afirmação são consistentes;
- falha de API preserva a pergunta e oferece recuperação;
- a animação não atrasa artificialmente uma resposta pronta;
- teclado, leitor de tela e movimento reduzido funcionam.

### Etapa 6 - Personalização e continuidade

Objetivo: fazer a experiência reconhecer a jornada sem invadir privacidade.

Entregáveis:

- [ ] contexto do onboarding integrado à narrativa;
- [ ] preferências editáveis;
- [ ] memória explícita e transparente;
- [ ] referências a leituras anteriores somente quando relevantes;
- [ ] estado vazio com orientação real;
- [ ] continuidade entre mensagem diária, leitura e Meu Universo.

Critérios de aceite:

- personalização não inventa fatos sobre o usuário;
- dados usados são visíveis e controláveis;
- a experiência funciona sem perfil completo;
- mensagens repetidas não parecem cache ou erro de carregamento.

### Etapa 7 - Conversão integrada

Objetivo: monetizar sem quebrar a atmosfera.

Entregáveis:

- [ ] ofertas apresentadas no momento de valor percebido;
- [ ] distinção clara entre gratuito, avulso e Círculo;
- [ ] CTA contextual após integração da leitura;
- [ ] acesso do assinante reconhecido sem atraso;
- [ ] estados de checkout, retorno e erro consistentes;
- [ ] prova de valor concreta e verificável.

Critérios de aceite:

- nenhum paywall interrompe uma promessa já iniciada;
- preços e recorrência são explícitos;
- assinatura não depende de linguagem manipulativa;
- checkout e entitlement são validados separadamente da cena visual.

### Etapa 8 - Performance e acessibilidade

Objetivo: garantir que premium signifique qualidade percebida em qualquer
dispositivo compatível.

Orçamentos iniciais, a confirmar após baseline:

- LCP móvel: até 2,5 s no percentil 75;
- CLS: até 0,1;
- INP: até 200 ms;
- canvas sem bloquear interação principal;
- DPR do canvas limitado;
- texturas comprimidas e carregadas sob demanda;
- experiência sem WebGL totalmente utilizável;
- contraste conforme WCAG AA;
- foco visível e ordem de teclado coerente.

Testes obrigatórios:

- [ ] rede móvel lenta;
- [ ] GPU integrada;
- [ ] iPhone Safari;
- [ ] Android Chrome;
- [ ] desktop Chrome, Safari e Firefox;
- [ ] zoom em 200%;
- [ ] teclado;
- [ ] leitor de tela;
- [ ] `prefers-reduced-motion`;
- [ ] falha proposital do canvas.

### Etapa 9 - Auditoria visual e funcional

Objetivo: provar o produto completo antes do merge.

Checklist:

- [ ] nenhuma sobreposição em desktop ou mobile;
- [ ] nenhuma copy misturada ao fundo;
- [ ] nenhum ícone cortado;
- [ ] nenhum ícone repetido sem justificativa;
- [ ] nenhum estado antigo visível durante carregamento;
- [ ] nenhum CTA sem resposta;
- [ ] nenhuma seção visualmente inacabada;
- [ ] nenhuma tradução ausente;
- [ ] nenhum erro no console;
- [ ] nenhum request crítico falhando;
- [ ] autenticação, leitura, histórico e assinatura testados;
- [ ] páginas sem WebGL continuam intactas.

### Etapa 10 - Aprovação, commit e merge

Objetivo: integrar somente após validação explícita.

Ordem:

1. revisar diff completo;
2. remover experimentos abandonados;
3. executar lint e typecheck;
4. executar testes focados;
5. executar build de produção uma vez;
6. validar localhost em desktop e mobile;
7. obter aprovação do responsável pelo produto;
8. criar commits organizados;
9. atualizar a branch remota;
10. abrir revisão ou realizar merge controlado;
11. validar preview;
12. validar produção após deploy.

Não fazer commit, push ou merge durante ajustes intermediários sem aprovação.

## 7. Protocolo Codex + Claude

Dois agentes podem acelerar exploração e revisão, mas editar o mesmo conjunto
de arquivos em paralelo aumenta muito o risco de regressão. A colaboração deve
seguir ownership explícito.

### 7.1 Fonte de verdade

Antes de cada bloco de trabalho:

1. ler este documento;
2. consultar o estado do Git;
3. registrar etapa e escopo ativo;
4. identificar arquivos sob responsabilidade;
5. declarar o que não será alterado.

Este documento define direção e critérios. O código do worktree define o estado
real da implementação.

### 7.2 Divisão recomendada

Codex:

- arquitetura de componentes;
- integração Next.js/React;
- Three.js e estratégia de carregamento;
- performance, acessibilidade e fallbacks;
- testes, auditoria e integração final.

Claude:

- exploração de referências e alternativas de direção de arte;
- storyboard textual;
- crítica de composição e narrativa;
- revisão de copy PT/EN;
- revisão independente do plano e dos diffs.

A divisão pode mudar por etapa, desde que apenas um agente seja o editor de um
arquivo em cada checkpoint.

### 7.3 Regra de edição

Para cada tarefa, registrar:

```text
Etapa:
Objetivo:
Agente responsável:
Arquivos permitidos:
Arquivos bloqueados:
Critérios de aceite:
Validações:
Resultado:
```

Nunca:

- trabalhar no mesmo arquivo simultaneamente;
- aceitar código sem verificar o diff;
- sobrescrever alterações locais;
- misturar protótipo visual com correção de produção;
- instalar dependência sem registrar a razão;
- declarar sucesso apenas porque o build passou.

### 7.4 Handoff entre agentes

Todo handoff deve informar:

1. problema tratado;
2. decisão tomada e por quê;
3. arquivos alterados;
4. comportamento esperado;
5. validações executadas;
6. limitações conhecidas;
7. próximo passo recomendado;
8. estado atual do Git.

### 7.5 Revisão cruzada

O agente que não implementou deve revisar:

- coerência com esta direção de arte;
- complexidade desnecessária;
- acessibilidade;
- responsividade;
- performance;
- copy e i18n;
- regressões em fluxos;
- aderência aos critérios da etapa.

A revisão não substitui validação no navegador.

## 8. Registro de decisões

Toda decisão estrutural deve ser registrada nesta tabela:

| Data | Decisão | Evidência | Impacto | Responsável |
| --- | --- | --- | --- | --- |
| 2026-06-27 | Criar worktree e branch isolados. | Proteção do estado atual e merge controlado. | Sem risco direto para `main`. | Codex |
| 2026-06-27 | Tratar a home como cena contínua. | Cards e efeitos isolados não produziram a profundidade desejada. | Exige protótipo espacial antes da reconstrução. | Produto + Codex |
| 2026-06-27 | Proibir partículas e halos genéricos como linguagem principal. | Não comunicam a assinatura premium desejada. | Portal deve depender de material, luz e movimento. | Produto |

Novas decisões devem explicar evidência e impacto. Preferência estética isolada
não deve ser registrada como fato técnico.

## 9. Critérios globais de conclusão

O projeto estará pronto para merge quando:

- a página for percebida como uma experiência contínua;
- portal, cartas e ícones possuírem presença espacial real;
- cada movimento tiver função narrativa;
- o fluxo de leitura estiver claro do início à integração;
- PT e EN estiverem completos;
- mobile não parecer uma versão reduzida ou quebrada;
- a experiência reduzida continuar premium;
- métricas de desempenho estiverem dentro do orçamento;
- fluxos de autenticação, leitura e monetização estiverem preservados;
- auditoria visual e funcional não encontrar bloqueadores;
- o responsável pelo produto aprovar explicitamente o resultado.

## 10. Próxima ação

Executar somente a Etapa 0:

1. iniciar o worktree isolado;
2. capturar baseline visual;
3. medir desempenho atual;
4. inventariar capítulos, CTAs e fluxos;
5. registrar os resultados;
6. iniciar a Bíblia de Direção de Arte apenas após o baseline.

O primeiro código WebGL só deve ser escrito depois que storyboard, função do
portal e critérios do protótipo estiverem aprovados.
