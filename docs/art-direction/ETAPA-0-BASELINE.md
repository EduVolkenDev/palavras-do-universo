# Etapa 0: Baseline e proteção

Data: 27 de junho de 2026  
Branch: `codex/art-direction-experience`  
Worktree: `/Users/eduardovolkenair/palavras-do-universo-art-direction`  
Status: concluída com pendências explícitas

## 1. Objetivo

Registrar o estado visual, estrutural e técnico anterior à introdução de
Three.js, React Three Fiber e GSAP. Este baseline é a referência para impedir
que a nova direção de arte melhore a aparência enquanto reduz clareza,
acessibilidade, desempenho ou confiabilidade.

Nenhuma dependência de direção de arte foi instalada nesta etapa.

## 2. Proteção do estado atual

- O repositório original permanece em
  `/Users/eduardovolkenair/palavras-do-universo`.
- O trabalho experimental acontece somente no worktree indicado acima.
- A branch experimental parte do mesmo commit `caff300`.
- As alterações visuais locais anteriores foram replicadas no worktree.
- Nenhum commit, push, merge ou deploy foi realizado.
- O `.env.local` do projeto original é reutilizado por link simbólico local e
  continua ignorado pelo Git.

## 3. Arquitetura atual

### 3.1 Aplicação

- Next.js 16.2.6;
- React 19.2.3;
- Tailwind CSS 4;
- CSS próprio dividido em `src/styles`;
- Anthropic para geração;
- Supabase para autenticação e persistência;
- Stripe para pagamentos;
- Web Push para notificações.

Não existem atualmente dependências de Three.js, React Three Fiber, GSAP,
Motion ou Lenis.

### 3.2 Rotas de interface

```text
/
/acao/[token]
/baralho
/carta-do-dia
/entrar
/meu-universo
/privacidade
/reembolsos
/termos
```

A build também validou rotas dinâmicas para leitura, mensagem diária, carta
diária, perfil, histórico, ações, push, checkout, billing e Stripe webhook.

### 3.3 Dimensão do código principal

| Arquivo | Linhas |
| --- | ---: |
| `src/app/page.tsx` | 2.767 |
| `src/styles/components.css` | 3.415 |
| `src/lib/i18n/translations.ts` | 380 |

A home e sua direção visual estão concentradas em arquivos grandes. A nova
camada espacial deve ser modular, sem aumentar essa concentração.

## 4. Estrutura visual medida

### 4.1 Desktop 1440 x 900

| Bloco semântico | Altura aproximada |
| --- | ---: |
| `#topo` | 2.117 px |
| `#produtos` | 4.683 px |
| Meu Universo | 784 px |
| `#circulo` | 1.007 px |
| Prova social e encerramento | 575 px |
| Documento completo | 9.446 px |

### 4.2 Mobile 390 x 844

| Bloco semântico | Altura aproximada |
| --- | ---: |
| `#topo` | 3.605 px |
| `#produtos` | 6.239 px |
| Meu Universo | 1.105 px |
| `#circulo` | 1.785 px |
| Prova social e encerramento | 1.283 px |
| Documento completo | 14.450 px |

O documento não apresenta overflow horizontal global. Elementos orbitais e o
marquee ultrapassam o viewport internamente, mas permanecem recortados pelo
container.

### 4.3 Superfície interativa inicial

- 24 botões;
- 17 links;
- 1 campo de entrada;
- 5 grandes blocos semânticos na home.

Isso confirma que a dificuldade não é falta de conteúdo. O problema central é
hierarquia: muitas ações e experiências dividem o mesmo plano visual.

## 5. Jornada e CTAs existentes

```text
Hero
-> Mensagem do Dia
-> Explicação em três passos
-> Escolha de intenção
-> Energia diária
-> Pergunta
-> Leitura de três cartas
-> Ação prática
-> Catálogo de experiências
-> Meu Universo
-> Comparação de acesso
-> Prova social
```

CTAs principais identificados:

- receber mensagem do dia;
- conhecer leituras;
- ativar notificação;
- escolher intenção;
- fazer leitura;
- salvar e compartilhar leitura;
- escolher ação prática;
- experimentar gratuitamente;
- abrir Carta do Dia;
- comprar leitura avulsa;
- abrir Meu Universo;
- entrar no Círculo.

A nova direção não deve apenas animar esta sequência. Ela deve reduzir a
competição entre ações e transformar a jornada em capítulos com um foco por
vez.

## 6. Baseline de desempenho

As medições foram executadas contra uma build local de produção com Lighthouse.
Elas representam um laboratório controlado, não dados reais de usuários.

### 6.1 Mobile

| Métrica | Resultado |
| --- | ---: |
| Performance | 40 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1,8 s |
| LCP | 6,0 s |
| Speed Index | 7,4 s |
| TBT | 5.640 ms |
| TTI | 8,9 s |
| CLS | 0,015 |
| Transferência total | 585 KiB |
| Trabalho na main thread | 12,8 s |

O mobile é o principal risco técnico. Foram detectadas 20 tarefas longas. Uma
delas ocupa aproximadamente 2,5 segundos, e o principal chunk da aplicação
concentra várias tarefas entre 190 ms e 1,3 segundo.

O primeiro acesso também abre o onboarding após 1,8 segundo. Essa transição e
as animações existentes participam da medição e precisam ser consideradas na
arquitetura, não escondidas do teste.

### 6.2 Desktop

| Métrica | Resultado |
| --- | ---: |
| Performance | 93 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0,3 s |
| LCP | 0,8 s |
| Speed Index | 2,4 s |
| TBT | 0 ms |
| TTI | 0,8 s |
| CLS | 0,075 |
| Transferência total | 539 KiB |
| Trabalho na main thread | 0,7 s |

### 6.3 Oportunidades registradas

- aproximadamente 139 KiB de economia potencial em imagens no mobile;
- imagem principal entregue em resolução acima da área exibida;
- ícones do onboarding solicitados maiores que a apresentação real;
- aproximadamente 46 KiB de JavaScript potencialmente não utilizado;
- CSS bloqueando a primeira renderização;
- discrepância entre label visível e nome acessível em pelo menos um elemento;
- forte diferença entre desktop e mobile na execução da main thread.

Relatórios completos:

- [`lighthouse-mobile.json`](./baseline/lighthouse-mobile.json)
- [`lighthouse-desktop.json`](./baseline/lighthouse-desktop.json)

## 7. Findings visuais e funcionais

### P0 - Entrada direta por hash pode resultar em viewport vazio

Ao abrir diretamente `/#produtos` ou outros pontos internos em uma sessão nova,
os elementos controlados pelo sistema de reveal podem permanecer transparentes
no viewport inicial. Pelo fluxo normal, clicar em "Leituras" ativa corretamente
os elementos.

Impacto:

- links compartilhados podem parecer quebrados;
- retorno de checkout para `#produtos` pode perder contexto;
- a futura arquitetura de capítulos não pode depender apenas de eventos de
  scroll progressivo.

Requisito:

- sincronizar capítulo, hash, posição e visibilidade no primeiro frame estável.

### P0 - Orçamento mobile já está comprometido antes do WebGL

O TBT de 5.640 ms e o LCP de 6,0 s impedem adicionar um canvas contínuo sem
estratégia adaptativa.

Requisito:

- o protótipo deve substituir trabalho visual existente, não apenas somar uma
  nova camada;
- o canvas deve ser carregado depois do conteúdo essencial;
- o perfil mobile precisa reduzir DPR, materiais, pós-processamento e frequência
  de renderização;
- animações fora do viewport devem pausar.

### P1 - Página extensa com poucos capítulos reais

Produtos ocupam quase metade da home no desktop e mais de 6.000 px no mobile.
Embora os ícones tenham presença, a experiência ainda é percebida como uma
lista longa.

Requisito:

- reorganizar experiências por intenção e momento;
- usar progressão espacial para revelar opções sem apresentar tudo no mesmo
  plano;
- preservar acesso direto e comparação comercial.

### P1 - Hero forte, continuidade fraca

O hero possui imagem protagonista e atmosfera definida. Ao entrar nas áreas
claras, a continuidade espacial é interrompida e o produto retorna a uma
composição editorial convencional.

Requisito:

- o portal precisa atravessar a mudança de capítulos;
- luz, câmera e materiais devem conectar áreas escuras e claras;
- a cena não pode reiniciar visualmente em cada seção.

### P1 - Onboarding participa do caminho crítico

O onboarding aparece automaticamente depois de 1,8 segundo e utiliza múltiplos
assets grandes. Em primeiro acesso, ele compete com o hero e com o carregamento
inicial.

Requisito:

- decidir se o onboarding pertence ao capítulo de reconhecimento;
- carregar somente o primeiro estado necessário;
- impedir que assets não visíveis prejudiquem o LCP;
- preservar foco, scroll interno e fechamento no mobile.

## 8. Evidências visuais

Capturas válidas:

- [`desktop-topo-1440x900.png`](./baseline/desktop-topo-1440x900.png)
- [`desktop-topo-1920x1080.png`](./baseline/desktop-topo-1920x1080.png)
- [`desktop-produtos-via-navigation-1440x900.png`](./baseline/desktop-produtos-via-navigation-1440x900.png)
- [`desktop-social-proof-1440x900.png`](./baseline/desktop-social-proof-1440x900.png)
- [`mobile-root-390x844.png`](./baseline/mobile-root-390x844.png)
- [`mobile-root-430x932.png`](./baseline/mobile-root-430x932.png)
- [`lighthouse-mobile-final.jpg`](./baseline/lighthouse-mobile-final.jpg)

Capturas full-page foram descartadas porque o navegador repetiu elementos
fixos durante a composição da imagem, tornando a evidência inválida.

## 9. Validações executadas

- `npm ci`: 391 pacotes, zero vulnerabilidades reportadas;
- build de produção: concluída;
- TypeScript: concluído pela build;
- 29 páginas/rotas geradas ou validadas;
- inspeção em 1440 x 900;
- inspeção em 1920 x 1080;
- inspeção em 390 x 844;
- inspeção em 430 x 932;
- console inicial sem warnings ou erros no modo de produção;
- Lighthouse mobile e desktop;
- verificação de overflow horizontal;
- navegação normal até `#produtos`;
- entrada direta por hash.

## 10. Pendências antes da Etapa 2

Estas pendências não impedem a Etapa 1, que é documental:

- gravar o fluxo completo da leitura atual;
- testar leitura com resposta real e fallback;
- auditar todas as traduções PT/EN visíveis;
- medir uma sessão mobile após onboarding concluído;
- identificar o chunk responsável pelas tarefas longas;
- transformar referências visuais em storyboard aprovado.

## 11. Próximo passo

Executar a Etapa 1 em paralelo:

- Claude produz referências classificadas, storyboard e proposta de materiais;
- Codex transforma o baseline em restrições técnicas, define orçamento do
  protótipo e valida a arquitetura de dependências;
- nenhuma implementação WebGL começa antes da revisão conjunta do storyboard.
