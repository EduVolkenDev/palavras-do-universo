# Guardar no Diário

O botão `SaveToDiaryButton` aparece nas ações da leitura pronta em `ReadingExperience`. Abre uma prévia no Diário e envia apenas o snapshot selecionado, nunca tokens, histórico inteiro ou dados da conta PDU. O texto “Leitura enviada” confirma recebimento da prévia, não salvamento no banco.

`src/lib/client/diary-transfer.ts` define o contrato versionado e valida destino/tamanho. O destino padrão é `https://diario.palavrasdouniverso.com`. `NEXT_PUBLIC_DIARY_ORIGIN` é explicitamente incluída no bundle por `next.config.ts`, inclusive no Vinext. Em desenvolvimento pode ser uma origem HTTP local exata; no Diário, `PUBLIC_PDU_ORIGIN` deve corresponder à origem local do PDU, incluindo porta.

O handshake exige origem exata, janela e nonce aleatório. A URL contém somente nonce no fragmento. A abertura precisa preservar `window.opener`; manter o COOP existente `same-origin-allow-popups` e não adicionar `noopener` a essa abertura. O Diário trata qualquer conteúdo recebido como dados e exige confirmação em sua própria conta independente.

O ID da leitura ou fingerprint do conteúdo dá a chave de deduplicação por dono no Diário. Um snapshot não é prova de compra ou de identidade e não concede entitlement. O conteúdo guardado não é sincronizado de volta ao PDU.

Publicação autorizada em 31/10/2026, com a migração de origem já aplicada ao Supabase do Diário. Publicar a interface receptora antes do botão no PDU. O teste em Chromium usou o botão real e duas abas com servidores locais mapeados às origens oficiais: conteúdo, nome original da tiragem, recarga com anotação e exigência de login nas larguras 1440, 768 e 390px, sem overflow ou erro de JavaScript. Não usou uma conta real nem confirma OAuth/salvamento final em produção.

A versão de publicação foi preparada num checkout isolado a partir de `62fdc75`, com a integração e a identidade visual já publicada. Os 11 arquivos de logos, ícones e manifest são byte a byte iguais aos de produção; a camada sazonal existente foi mantida. Rascunhos de email, newsletter e continuidade astrológica do checkout original não foram incluídos. O checkout isolado passou nos 70 testes, typecheck e build Vinext. O teste autenticado em dispositivo real continua uma verificação separada.
