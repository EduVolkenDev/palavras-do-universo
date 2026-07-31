# Palavras do Universo Visual Assets Semantic Audit

Data: 2026-07-27

## Principio

Todos os assets passam a ter um papel semantico. Isso nao significa carregar todos na home: imagens acima de 2 MB devem entrar apenas quando representam diretamente a experiencia e com lazy loading, variante mobile ou uso pontual. Forcar todos os assets pesados no primeiro viewport aumentaria o risco de crash em Safari mobile.

## Ja aplicado

- `/tiradas` agora usa imagens reais dos produtos nos cards:
  - Carta do Dia -> `product-carta-do-dia-mobile.webp`
  - Caminho das 3 Cartas -> `product-caminho-das-3-cartas-mobile.webp`
  - Sinais do Amor -> `pdu-heart-mobile.webp`
  - Clareza Urgente -> `product-clareza-urgente.webp`
  - Energia da Semana -> `pdu-ciclos-mobile.webp`
  - Mapa do Momento -> `pdu-target-mobile.webp`
- `PDU_ASSETS.symbolic` agora cataloga os assets editoriais restantes por significado, para evitar uso improvisado.
- Home mobile ja usa `palavrasuniverso-mobile.webp` e o caminho de leitura usa `product-caminho-das-3-cartas-mobile.webp`.

## Mapa semantico dos assets

### Marca e sistema

- `palavras-symbol.webp`: selo de conta, legal, language switcher, estados de confianca.
- `palavrasuniverso-mobile.webp`: hero mobile.
- `palavrasuniverso-1600.webp`: hero desktop e fallback visual de avatar.
- `palavrasuniverso.webp`: arquivo fonte pesado; nao usar em runtime.
- `pdu-new-wordmark-transparent-ofi.webp`: wordmark controlado, nao repetir em listas.

### Icones pequenos

- `pdu-icon-book.webp`: leituras, termos, biblioteca.
- `pdu-icon-bookmark.webp`: salvos, reembolsos, guardar mensagem.
- `pdu-icon-heart.webp`: vinculos, amor, cuidado afetivo.
- `pdu-icon-meditation.webp`: perfil, tom, presenca.
- `pdu-icon-moon.webp`: ciclos, mapa, noite, carta do dia.
- `pdu-icon-shield.webp`: privacidade, acesso, seguranca.
- `pdu-icon-sprout.webp`: acao, crescimento, corrente.

### Produtos

- `product-mensagem-do-dia.webp`: ritual diario, abertura da home.
- `product-carta-do-dia.webp` / `product-carta-do-dia-mobile.webp`: Carta do Dia.
- `product-clareza-urgente.webp`: Clareza Urgente.
- `product-caminho-das-3-cartas.webp` / `product-caminho-das-3-cartas-mobile.webp`: leitura de 3 cartas.
- `pdu-heart.webp` / `pdu-heart-mobile.webp`: Sinais do Amor.
- `pdu-ciclos.webp` / `pdu-ciclos-mobile.webp`: Energia da Semana.
- `pdu-target.webp` / `pdu-target-mobile.webp`: Mapa do Momento.

### Editorial simbolico

- `AMPULHETA.webp`: tempo, espera, decisao que nao deve ser apressada.
- `CRYSTAL.webp`: clareza, aterramento, eixo.
- `allconnected.webp`: Meu Universo, memoria, padroes conectados.
- `bell.webp`: chamada, lembrete, notificacao.
- `bigeye.webp`: visao, percepcao, observar sem reagir.
- `biggem.webp`: valor interno, preciosidade, escolha fina.
- `butterfly.webp`: transicao, metamorfose, passagem.
- `calice.webp`: receptividade, emocao, cuidado.
- `caminho3cartas.webp`: editorial de tirada/spread.
- `candle.webp`: ritual, presenca, pausa.
- `cards.webp`: baralho, biblioteca, multiplicidade de cartas.
- `cetro.webp`: decisao, comando interno, soberania.
- `direction.webp`: caminho, orientacao, proximo passo.
- `filtrodossonhos.webp`: sono, sonho, simbolos sutis.
- `firebase.webp`: fogo, impulso, energia ativa.
- `garrafa.webp`: recipiente, mensagem guardada, conteudo preservado.
- `gueixa.webp`: delicadeza, presença, escuta estetica.
- `hand.webp`: gesto, acao real, escolha no corpo.
- `key.webp`: desbloqueio, amor, acesso, pergunta que abre porta.
- `libelula.webp`: leveza, mudanca rapida, sutileza.
- `lotus.webp`: cura, abertura, espiritualidade sem pressa.
- `magicbook.webp`: conhecimento simbolico, biblioteca, registro.
- `mandala.webp`: ritual base, centro, integracao.
- `mandala2.webp`: mandala profunda; usar apenas com variante reduzida.
- `mandalaspecial.webp`: Circulo do Universo, assinatura, continuidade.
- `meditation.webp`: calma, perfil, tom de orientacao.
- `mirror.webp`: reflexao, verdade, pergunta honesta.
- `oraculo.webp`: experiencia oracular geral.
- `pdu-consulta.webp`: profissionais, consulta humana, cuidado guiado.
- `pdu-dock.webp`: Meu Universo, painel, base pessoal.
- `pdu-essence.webp`: identidade interna, essencia, perfil.
- `pena.webp`: escrita, mensagem, diário.
- `pendulo.webp`: duvida, escolha, oscilacao.
- `portal.webp`: entrada, travessia, inicio de leitura.
- `wing-oracle.webp`: sinal, protecao, orientacao sutil.
- `zodiac.webp`: ciclos, mapa, tempo simbolico.

## Proximas aplicacoes recomendadas

1. `/baralho`: usar `cards.webp` ou `magicbook.webp` no hero, com variante mobile antes de ativar em mobile.
2. `/meu-universo`: usar `allconnected.webp` ou `pdu-dock.webp` como visual unico do mapa pessoal, lazy.
3. `/profissionais`: usar `pdu-consulta.webp` como visual de cuidado humano, sem repetir por card.
4. `/carta-do-dia`: usar `candle.webp` ou `bell.webp` como apoio de ritual, sem competir com a carta sorteada.
5. Fluxos de leitura: escolher editorial pelo padrao detectado da pergunta:
   - urgencia -> `AMPULHETA.webp` / `CRYSTAL.webp`
   - amor -> `key.webp` / `calice.webp`
   - transicao -> `butterfly.webp` / `libelula.webp`
   - trabalho/direcao -> `direction.webp` / `cetro.webp`
   - introspeccao -> `mirror.webp` / `lotus.webp`

## Guardrail

Antes de colocar qualquer asset acima de 2 MB em uma pagina publica, gerar variante `*-mobile.webp` e validar:

- status 200
- 0 imagens quebradas
- 0 overflow horizontal
- 0 console errors
- stress scroll mobile sem jump-to-top
