# Campanha social — Astrologia PDU

Objetivo: fazer as redes funcionarem como uma extensão da experiência do Palavras do Universo — com curiosidade, aprendizado, identificação, pausa e conversa — e deixar a venda como consequência do vínculo.

## Onde estão os posts

Use somente a pasta `PUBLICAR`.

- `PUBLICAR/00_COMECE_AQUI.md`: o que publicar primeiro.
- `PUBLICAR/CALENDARIO_DIARIO.md`: sequência de 16 publicações diárias.
- `PUBLICAR/VISAO_GERAL.jpg`: visão rápida de todas as peças.
- `PUBLICAR/SEMANA_1` a `SEMANA_4`: posts organizados por semana.

Cada pasta de post contém somente o necessário:

- `ARTE_FEED_PT.jpg` e `ARTE_FEED_EN.jpg`, `CARROSSEL_PT/` e `CARROSSEL_EN/`, ou `VIDEO_PT.mp4` e `VIDEO_EN.mp4`;
- `LEGENDA.md`;
- `STATUS_PT.jpg` e `STATUS_EN.jpg`;
- `CAPA_PT.jpg` e `CAPA_EN.jpg`, quando o conteúdo é vídeo.

## Arquitetura editorial

| Pilar | Quantidade | Função |
| --- | ---: | --- |
| Experiência | 5 | Fazer a pessoa sentir o ritmo, a proposta e o manifesto do PDU |
| Educação | 4 | Ensinar astrologia com clareza e sem jargão |
| Curiosidade | 3 | Despertar identificação, conversa e compartilhamento |
| Confiança | 1 | Explicar a abordagem ética e não determinista |
| Interação | 1 | Convidar a audiência a participar sem pressão |
| Oferta | 2 | Apresentar caminhos pagos depois de valor entregue |

Somente os posts 01 e 15 apresentam preço. Nos demais, a chamada principal é perceber, responder, salvar, compartilhar ou experimentar.

## Direção editorial

O céu não decide por você. Ele ajuda você a se ler.

- Toda explicação deve mostrar o elemento citado em escala de protagonista: planeta, signo, mapa, casas ou aspectos.
- Não prometer destino, cura ou transformação garantida.
- Não criar falsa urgência, desconto ou prazo inexistente.
- Não acrescentar preço, comparação comercial ou CTA de compra a um conteúdo editorial.
- Encerrar posts de experiência e curiosidade com uma pergunta ou gesto possível, não com uma vitrine.
- Mostrar que o PDU também é carta do dia, leituras, Lume, Meu Universo e continuidade — não apenas mapa astral.
- Usar imagens e textos diferentes conforme o tema; a identidade continua consistente, mas os posts não repetem um único layout.
- Os 12 signos possuem assets individuais em `public/assets/astrology/zodiac-signs` e aparecem distribuídos pela campanha.

## Arquivo técnico

`generate-assets.mjs` recria e organiza todas as peças. Ele não é necessário para publicar.
