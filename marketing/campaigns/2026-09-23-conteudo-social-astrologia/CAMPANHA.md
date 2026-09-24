# Campanha social — Astrologia PDU

Objetivo: publicar conteúdo completo no Instagram, TikTok, Instagram Stories e WhatsApp Status sem enviar mensagens individuais.

## Onde estão os posts

Use somente a pasta `PUBLICAR`.

- `PUBLICAR/00_COMECE_AQUI.md`: o que publicar primeiro.
- `PUBLICAR/CALENDARIO_4_SEMANAS.md`: sequência de 16 posts durante quatro semanas.
- `PUBLICAR/VISAO_GERAL.jpg`: visão rápida de todas as peças.
- `PUBLICAR/SEMANA_1` a `SEMANA_4`: posts organizados por semana.

Cada pasta de post contém somente o necessário:

- `ARTE_FEED.jpg` ou `CARROSSEL/` ou `VIDEO.mp4`;
- `LEGENDA.md`;
- `STATUS.jpg`;
- `CAPA.jpg`, quando o conteúdo é vídeo.

## Oferta apresentada

| Opção | Preço | Modelo |
| --- | ---: | --- |
| Mapa Astral Completo | R$39,90 | Pagamento único |
| Círculo do Universo | R$49,90/mês | Assinatura mensal |

O mapa completo está incluído no Círculo enquanto a assinatura estiver ativa. A primeira camada com Sol, Lua e Ascendente pode ser conhecida gratuitamente.

## Direção editorial

O céu não decide por você. Ele ajuda você a se ler.

- Toda explicação deve mostrar o elemento citado em escala de protagonista: planeta, signo, mapa, casas ou aspectos.
- Não prometer destino, cura ou transformação garantida.
- Não criar falsa urgência, desconto ou prazo inexistente.
- Usar imagens e textos diferentes conforme o tema; a identidade continua consistente, mas os posts não repetem um único layout.
- Os 12 signos possuem assets individuais em `public/assets/astrology/zodiac-signs` e aparecem distribuídos pela campanha.

## Arquivo técnico

`generate-assets.mjs` recria e organiza todas as peças. Ele não é necessário para publicar.
