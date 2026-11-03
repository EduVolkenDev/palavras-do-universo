# Cookies e privacidade

Implementação preparada em 2 de novembro e publicada com o formulário do Céu por e-mail em 3 de novembro de 2026. Consulte `daily-sky-email-release.md` para escopo e verificações.

O controle global em `PrivacyConsent` oferece escolhas equivalentes de somente essenciais e diagnósticos opcionais. A escolha é guardada em `pdu_privacy_consent_v1` por até 180 dias, com versão, data e valor booleano. Sem armazenamento disponível, vale apenas na sessão. A preferência pode ser revista pelo mesmo botão em todas as páginas.

## Inventário e comportamento

- Autenticação, idioma, moeda, rascunhos, leituras e contexto que a pessoa escolhe guardar continuam com seus mecanismos existentes de cookies e armazenamento local.
- A telemetria própria em `siteEvents.ts` depende de `diagnosticsAllowed()` antes de normalizar qualquer evento, obter identificadores, ler o contexto da leitura ou enviar `/api/events`. A captura da última interação também verifica a autorização.
- Revogar bloqueia novos eventos e remove `pdu_telemetry_id`, `pdu_site_event_rate` e a última ação em memória. Não apaga leituras nem registros já recebidos pelo servidor.
- Versões inválidas, escolhas ausentes, datas futuras e escolhas expiradas bloqueiam diagnósticos.
- A escolha de cookies não inscreve em e-mails. O boletim tem checkbox específico e confirmação por link, em fluxo separado.
- A busca no código não encontrou integração direta de pixels publicitários. Novos serviços opcionais devem respeitar a mesma autorização antes de carregar; scripts eventualmente injetados pelo provedor de hospedagem precisam de auditoria na publicação.

## Validação e publicação

Testes exercitam consentimento inválido/expirado, armazenamento indisponível, atualização entre abas, remoção dos identificadores e eventos efetivamente enviados somente após consentimento. Navegador local: recusa, persistência após recarregar, reabertura, aceitação e revogação. Revisão visual em desktop e viewport de 390 × 844; português e inglês.

Referência consultada: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/

Antes de publicar, revisar o diff da tarefa junto às alterações anteriores do checkout. Após publicar, confirmar o banner no domínio canônico e ausência de telemetria sem consentimento. Esta implementação não comprova conformidade integral nem entrega real dos e-mails.
