# Plano Palavras do Universo: Visual System Inspirado no Upscayl

Data: 2026-05-12

Objetivo: adaptar a disciplina visual do Upscayl para o Palavras do Universo sem copiar codigo, marca ou estrutura da Volynx. A direcao aqui e criar um santuario digital moderno: futurista, suave no scroll, organico, ritualistico e mobile-first.

## Veredito

Faz sentido usar a referencia do Upscayl como arquitetura de experiencia: header translucido, scroll suave, atmosfera interativa, cards vivos, componentes pequenos e uma camada global de efeitos.

Para o Palavras do Universo, o resultado nao deve parecer SaaS tecnico. Deve parecer:

- ritual diario de clareza
- tarot editorial premium
- app de bem-estar simbolico
- tecnologia suave, sem frieza corporativa
- experiencia bonita antes de parecer catalogo

## Principios

1. Nao conectar nada com Volynx.
2. Nao prometer previsao absoluta.
3. Comecar por experiencias de habito: Home, Carta do Dia, Baralho e Meu Universo.
4. Usar Tailwind como composicao e CSS proprio para tokens, atmosfera e motion.
5. Manter motion leve, respeitando `prefers-reduced-motion`.
6. Usar cartas e assets reais como sinal principal da marca.
7. Evitar clone visual: a referencia e fluidez, nao identidade.

## Adaptacao Tecnica

O plano original era para Astro/Volynx. Aqui o app e Next, entao a arquitetura vira:

```text
src/app/globals.css
src/styles/pdu.css
src/styles/tokens.css
src/styles/base.css
src/styles/components.css
src/styles/effects.css
```

Responsabilidades:

- `tokens.css`: cores, tipografia base, sombras, radius e tokens Tailwind.
- `base.css`: body, scroll, foco, selecao, texturas leves.
- `components.css`: shell visual, glass, cards, paineis, visuais de produto.
- `effects.css`: reveal, drift, halo, reduced motion.

## Ordem Recomendada

1. Home
2. Carta do Dia
3. Baralho
4. Leitura de 3 Cartas
5. Meu Universo
6. Círculo do Universo
7. Checkout
8. Blog/SEO

## Padroes Que Valem Adaptar

- Header fixo/translucido com blur.
- Scroll suave e seções com respiro.
- Hero com visual real, nao ilustracao generica.
- Spotlight sutil acompanhando o ponteiro.
- Cards com hover claro e performance leve.
- Busca/filtros elegantes para o baralho.
- Experiencias gratuitas antes da venda.
- Componentes pequenos em vez de CSS monolitico.

## O Que Nao Copiar

- Runtime, codigo ou identidade do Upscayl.
- Estrutura, rotas, catalogo ou pricing da Volynx.
- Estetica roxa mistica generica.
- Promessas de futuro, cura ou resultado garantido.
- Pop-up agressivo ou urgencia falsa.
- Reescrita total antes de validar o MVP.

## Primeiro Bloco Real De Execucao

1. Organizar a camada global de CSS em `src/styles`.
2. Preservar Home e Baralho funcionando.
3. Criar a rota real de `Carta do Dia`.
4. Linkar a Carta do Dia na Home.
5. Validar assets, lint, build e visual desktop/mobile.

## Criterios De Sucesso

- `npm run build` passa.
- As 78 cartas continuam validadas.
- Home e Baralho nao quebram.
- Carta do Dia fica pronta como experiencia gratuita forte.
- Mobile nao tem overlap.
- Scroll, hover e imagens parecem suaves, nao pesados.
- A linguagem continua etica: clareza, reflexao e acolhimento.
