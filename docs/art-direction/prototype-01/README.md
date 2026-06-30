# Protótipo 01 - Assinatura espacial

Status: implementação técnica concluída; aprovação visual pendente.

## Objetivo

Provar a passagem entre os capítulos Chegada e Reconhecimento sem reconstruir
o restante da home. O protótipo mantém o DOM e os fluxos atuais, adicionando
uma cena tridimensional progressiva ao hero.

## Implementação

- portal tridimensional com espessura e geometria assimétrica;
- quatro planos internos de profundidade;
- luz direcional, ambiente e luz originada no portal;
- transformação vinculada ao scroll com GSAP ScrollTrigger;
- resposta sutil ao ponteiro em dispositivos compatíveis;
- perfis de qualidade high, balanced e reduced;
- pausa fora do viewport e quando a página fica oculta;
- carregamento dinâmico apenas no cliente;
- fallback visual existente para WebGL indisponível ou movimento reduzido;
- correção do acesso direto por hash às seções reveladas.

Arquivos principais:

- `src/components/art-direction/UniverseExperience.tsx`
- `src/components/art-direction/UniverseCanvas.tsx`
- `src/lib/ui/usePduAtmosphere.ts`
- `src/styles/components.css`
- `src/app/page.tsx`

## Validação

- ESLint completo: aprovado;
- TypeScript `--noEmit`: aprovado;
- 78 assets de tarot: aprovados;
- build de produção: 29 de 29 rotas geradas;
- console do servidor: sem avisos do Three.js após compatibilização;
- desktop 1440x900: sem overflow horizontal;
- mobile 390x844: sem overflow horizontal;
- `#produtos`: conteúdo visível após navegação direta por hash;
- acessibilidade Lighthouse mobile: 100.

## Lighthouse mobile

| Métrica | Baseline | Protótipo 01 |
| --- | ---: | ---: |
| Performance | 40 | 65 |
| FCP | 1,8 s | 1,2 s |
| LCP | 6,0 s | 3,7 s |
| TBT | 5.640 ms | 1.130 ms |
| CLS | 0,015 | 0,001 |
| Speed Index | 7,4 s | 3,8 s |
| Peso total | 585 KiB | 858 KiB |

O peso aumentou devido ao runtime WebGL. A melhora das métricas não elimina a
necessidade de reduzir o custo da cena antes de expandi-la para os seis
capítulos.

Relatórios:

- `../baseline/lighthouse-mobile.json`
- `./lighthouse-mobile.json`

## Capturas finais

- `desktop-arrival-final.jpg`
- `desktop-recognition-final-v2.jpg`
- `mobile-arrival-final.jpg`
- `desktop-hash-produtos.jpg`

## Limitações conhecidas

- o protótipo cobre somente Chegada e Reconhecimento;
- ainda não há símbolo 3D independente do portal;
- FPS sustentado precisa ser medido em hardware móvel real;
- a versão estática reutiliza a arte existente, não uma renderização equivalente
  dedicada;
- o bundle WebGL ainda deve ser auditado e reduzido;
- a assinatura visual depende de aprovação antes de ser replicada.

## Revisão do Claude

Aplicar `../claude/09-framework-critica-visual.md` ao diff e às capturas. A revisão
deve avaliar hierarquia, materialidade, cessão de espaço para a copy, coerência
entre desktop e mobile, efeitos proibidos e custo visual por capítulo.
