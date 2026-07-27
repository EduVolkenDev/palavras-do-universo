# Palavras do Universo Assets Audit

Data: 2026-07-27

## Objetivo

Introduzir melhor os assets personalizados de `public/assets` em todas as paginas do Palavras do Universo sem reabrir o problema de crash em mobile/Safari. A regra principal e: iconografia pequena e media pode entrar em varias superficies; artes grandes devem entrar com `sizes`, lazy loading e, quando necessario, versoes reduzidas.

## Inventario por uso

### Identidade e marca

- `palavras-symbol.webp` - 24 KB, 384x384. Seguro para header, login, legal, empty states, notificacoes.
- `pdu-new-wordmark-transparent-ofi.webp` - 1.3 MB, 3200x1000. Usar somente em header/brand lockup com tamanho controlado; ideal gerar variante menor depois.
- `palavrasuniverso-mobile.webp` - 210 KB, 900x900. Hero mobile.
- `palavrasuniverso-1600.webp` - 575 KB, 1600x1600. Hero desktop e avatars fallback.
- `palavrasuniverso.webp` - 18 MB, 5249x5249. Nao usar em runtime normal.

### Icones pequenos premium

Todos seguros para UI repetida, chips, cards compactos e estados vazios:

- `pdu-icon-book.webp`
- `pdu-icon-bookmark.webp`
- `pdu-icon-heart.webp`
- `pdu-icon-meditation.webp`
- `pdu-icon-moon.webp`
- `pdu-icon-shield.webp`
- `pdu-icon-sprout.webp`

### Produtos e experiencia

- `product-mensagem-do-dia.webp` - 1.2 MB, 2000x2000.
- `product-carta-do-dia.webp` - 2.0 MB, 2000x2000.
- `product-clareza-urgente.webp` - 28 KB, 503x520.
- `product-caminho-das-3-cartas.webp` - 2.4 MB, 1500x2700.
- `pdu-heart.webp` - 5.4 MB, 2132x2132. Usar para Sinais do Amor com cuidado.
- `pdu-ciclos.webp` - 2.2 MB, 1254x1254. Usar para Energia da Semana.
- `pdu-target.webp` - 4.5 MB, 2132x2132. Usar para Mapa do Momento com cuidado.

Observacao: corrigi o inventario para nao apontar mais para `product-sinais-do-amor.webp`, `product-energia-da-semana.webp` e `product-mapa-do-momento.webp`, que estavam ausentes.

### Editorial / simbolico

Usar como imagens de apoio em secoes especificas, nao em listas repetidas:

- `portal.webp` - travessia, entrada, leitura.
- `key.webp` - amor, vinculos, desbloqueio.
- `mirror.webp` - decisao, reflexao, verdade.
- `CRYSTAL.webp` - firmeza, grounding, clareza urgente.
- `direction.webp` - caminho, orientacao, tiradas.
- `candle.webp` - ritual, mensagem do dia.
- `allconnected.webp` - Meu Universo, memoria, conexoes.
- `mandalaspecial.webp` - assinatura/Circulo.
- `cards.webp` / `caminho3cartas.webp` - baralho, tiradas, leitura.

### Assets pesados para uso restrito

Nao colocar em mobile abaixo da dobra sem variante reduzida:

- `garrafa.webp` - 15 MB.
- `mandala2.webp` - 19 MB.
- `libelula.webp` - 7.7 MB.
- `lotus.webp` - 6.0 MB.
- `mirror.webp` - 5.6 MB.
- `pdu-heart.webp` - 5.4 MB.
- `butterfly.webp` - 4.9 MB.
- `pena.webp` - 4.6 MB.
- `firebase.webp` - 4.5 MB.
- `pdu-target.webp` - 4.5 MB.

## Auditoria por pagina

### `/`

Estado atual: pagina principal ja e a mais rica visualmente e ja usa `PDU_ASSETS` em hero, jornada, produtos, Meu Universo e Circulo.

Recomendacao:

- Manter o hero com `palavrasuniverso-mobile.webp` / `palavrasuniverso-1600.webp`.
- Manter produto com assets de produto, mas no mobile considerar trocar `pdu-heart`, `pdu-target` e `product-caminho-das-3-cartas` por variantes menores se crash persistir.
- Usar os `pdu-icon-*` para chips, provas e pequenos sinais, como ja esta acontecendo.
- Evitar reintroduzir animações continuas em mobile.

### `/tiradas`

Estado atual: usa quase so Lucide icons nos cards.

Recomendacao:

- Trocar icones grandes dos cards por assets do produto:
  - Carta do Dia -> `product-carta-do-dia.webp`
  - Caminho das 3 Cartas -> `product-caminho-das-3-cartas.webp` ou `caminho3cartas.webp`
  - Sinais do Amor -> `pdu-heart.webp` com lazy loading e `sizes` pequeno
  - Clareza Urgente -> `product-clareza-urgente.webp`
  - Energia da Semana -> `pdu-ciclos.webp`
  - Mapa do Momento -> `pdu-target.webp`
- Manter Lucide como micro-icone secundario, nao como visual principal.
- Adicionar fallback `pdu-icon-*` para mobile se os assets pesados causarem custo demais.

### `/carta-do-dia`

Estado atual: experiencia ja usa cartas de tarot e iconografia simples.

Recomendacao:

- Usar `product-carta-do-dia.webp` como selo/visual de entrada antes da carta sorteada.
- Usar `pdu-icon-bookmark.webp` no CTA de salvar.
- Usar `pdu-icon-moon.webp` para contexto diario.
- Nao competir visualmente com a carta sorteada; o asset deve ser entrada/selo, nao segundo protagonista.

### `/baralho`

Estado atual: cartas sao o conteudo principal.

Recomendacao:

- Usar `cards.webp` ou `caminho3cartas.webp` no hero/empty state.
- Usar `pdu-icon-moon.webp`, `pdu-icon-sprout.webp`, `pdu-icon-heart.webp` nos filtros de arcanos/naipes/temas, substituindo apenas os icones maiores.
- Nao carregar assets editoriais pesados dentro de cada carta.

### `/meu-universo`

Estado atual: muitos Lucide icons e cards funcionais.

Recomendacao:

- Header/hero: `allconnected.webp` ou `pdu-dock.webp` como visual do mapa pessoal.
- Stats:
  - Salvas -> `pdu-icon-bookmark.webp`
  - Leituras -> `pdu-icon-book.webp`
  - Acoes -> `pdu-icon-sprout.webp`
  - Assinatura/Circulo -> `pdu-icon-moon.webp`
- Empty states:
  - Leituras vazias -> `pdu-icon-book.webp`
  - Mensagens salvas vazias -> `pdu-icon-bookmark.webp`
  - Acoes vazias -> `pdu-icon-sprout.webp`
- Compra/assinatura: `mandalaspecial.webp` apenas como visual unico, lazy.

### `/entrar`

Estado atual: tela funcional com Lucide.

Recomendacao:

- Trocar o quadrado com `Sparkles` por `palavras-symbol.webp`.
- Quando houver produto no `next`, mostrar miniatura do produto:
  - `product-clareza-urgente.webp`, `product-caminho-das-3-cartas.webp`, etc.
- Para motivo `reading-history`, usar `pdu-icon-bookmark.webp`.
- Manter leve: login precisa ser rapido e confiavel.

### `/voucher/[code]`

Estado atual: usa Gift/Percent/Sparkles.

Recomendacao:

- Invite -> `pdu-icon-sprout.webp`
- Discount -> `pdu-icon-shield.webp` ou `pdu-icon-bookmark.webp`
- Acesso/beneficio -> `pdu-icon-moon.webp`
- Usar `palavras-symbol.webp` como selo de confianca no topo.

### `/acao/[token]`

Estado atual: usa HandHeart/Sparkles.

Recomendacao:

- Hero/estado principal -> `pdu-icon-sprout.webp` ou `pdu-heart.webp` se a pagina for afetiva.
- Progresso coletivo -> `allconnected.webp` em tamanho controlado.
- Confirmacao -> `pdu-icon-shield.webp`.

### `/profissionais`

Estado atual: marketplace mais utilitario; usa Lucide e avatar seed.

Recomendacao:

- Hero: `pdu-consulta.webp` ou `pdu-dock.webp` como simbolo de cuidado humano.
- Cards profissionais sem foto: usar `palavrasuniverso-1600.webp` ou `palavras-symbol.webp` como fallback, mas preferir avatar/foto real quando existir.
- Filtros:
  - Idioma/acesso -> `pdu-icon-shield.webp`
  - Afetivo/cuidado -> `pdu-icon-heart.webp`
  - Modalidade/ritual -> `pdu-icon-meditation.webp`
- Nao usar assets grandes repetidos em cada card; repetir so os `pdu-icon-*`.

### `/profissionais/[handle]`

Estado atual: perfil detalhado com foto/avatar.

Recomendacao:

- Fallback avatar -> `palavrasuniverso-1600.webp` ou `palavras-symbol.webp`.
- Oferta/servico -> `pdu-icon-book.webp`
- Etica/seguranca -> `pdu-icon-shield.webp`
- Amor/vinculo -> `pdu-icon-heart.webp`

### `/profissionais/me`

Estado atual: area de cadastro profissional.

Recomendacao:

- Onboarding profissional -> `pdu-consulta.webp`.
- Verificacao/estado aprovado -> `pdu-icon-shield.webp`.
- Perfil/identidade -> `palavras-symbol.webp`.
- Ofertas -> `pdu-icon-book.webp`.

### `/admin/codigos`

Estado atual: dashboard admin; deve continuar denso e funcional.

Recomendacao:

- Usar apenas `pdu-icon-*` pequenos em metricas e tipos de voucher.
- Evitar imagens editoriais grandes; admin nao deve ficar pesado.
- Tipo invite -> `pdu-icon-sprout.webp`; desconto -> `pdu-icon-bookmark.webp`; acesso -> `pdu-icon-shield.webp`.

### `/privacidade`, `/termos`, `/reembolsos`

Estado atual: todas usam `LegalPage` com `Sparkles`.

Recomendacao:

- Atualizar `LegalPage` para aceitar `visual`.
- Privacidade -> `pdu-icon-shield.webp`
- Termos -> `pdu-icon-book.webp`
- Reembolsos -> `pdu-icon-bookmark.webp`
- Usar os assets como selo de pagina, nao como decoracao grande.

## Fases recomendadas

Status atual: Fase 1 aplicada em 2026-07-27 para `LegalPage`, `/entrar`, `/voucher/[code]`, `/acao/[token]` e blocos principais de `/meu-universo`.

### Fase 1 - Baixo risco, alto impacto

1. Expandir `PDU_ASSETS` com aliases semanticos: `legal`, `account`, `voucher`, `actions`, `professionals`.
2. Trocar Lucide por `pdu-icon-*` em `LegalPage`, `/entrar`, `/voucher/[code]`, `/acao/[token]` e stats de `/meu-universo`.
3. Manter imagens pequenas, `width/height` explicitos e `loading="lazy"` quando abaixo da dobra.

### Fase 2 - Produto e marketplace

1. Atualizar `/tiradas` para usar imagens de produto como visual principal dos cards.
2. Atualizar `/profissionais` e `/profissionais/[handle]` com assets de consulta/cuidado, sem repetir imagens grandes por card.
3. Validar mobile com Playwright e checagem de 404.

### Fase 3 - Variantes mobile dos assets grandes

Gerar variantes leves para:

- `pdu-heart.webp`
- `pdu-target.webp`
- `pdu-consulta.webp`
- `pdu-essence.webp`
- `pdu-dock.webp`
- `mirror.webp`
- `libelula.webp`
- `lotus.webp`

Padrao sugerido:

- `*-mobile.webp`: max 720-900 px, qualidade 72-78.
- `*-1600.webp`: max 1400-1600 px, qualidade 78-84.

## Guardrails de performance

- Nunca usar assets acima de 2 MB em listas repetidas.
- Nunca usar `palavrasuniverso.webp` original em runtime normal.
- Para assets pesados em mobile, usar `<picture>` ou variante explicitamente menor.
- Qualquer nova imagem abaixo da dobra deve ser lazy.
- Rodar auditoria de requests quebrados depois de cada troca visual.
