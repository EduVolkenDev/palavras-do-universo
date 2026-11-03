# Publicação do consentimento do Céu por e-mail

Publicação autorizada em 3 de novembro de 2026, preparada em checkout isolado a partir da versão mais recente de `origin/main`. As correções de vouchers publicadas durante a tarefa foram preservadas.

## Escopo

- `/ceu-por-email`: formulário PT/EN com checkbox desmarcado e autorização específica para o boletim, separada da preferência de cookies.
- API de inscrição, confirmação por POST explícito e cancelamento por POST explícito. Abrir links por GET não altera a assinatura.
- Registro privado no Supabase de texto e versão do consentimento, origem, idioma, datas e identificador da mensagem de confirmação.
- Domínio `palavrasdouniverso.com` e remetente verificado `suporte@palavrasdouniverso.com`.
- Chave API `PDU boletim`, restrita ao escopo de e-mails transacionais e guardada no segredo `BREVO_API_KEY` do Worker existente. Nenhum valor secreto foi incluído no código.
- Controle de cookies/diagnósticos publicado, com recusa, revogação e bloqueio da telemetria sem autorização. Endereços de confirmação e cancelamento são omitidos do campo de rota da telemetria.

## Banco e operação

Migração remota `20261103175107_daily_sky_email_consent`. RLS habilitada e privilégios de `anon` e `authenticated` revogados. Escrita apenas pelo servidor. Não executar `db push --include-all`: o checkout principal contém outras migrações de outras tarefas.

O remetente do boletim é definido nessa integração; a configuração e o relay dos vouchers foram preservados. O endpoint de envio diário e o Worker agendador não fazem parte desta publicação. A página informa que os envios estão em preparação.

## Evidência do provedor

O teste real chegou à pasta de spam do iCloud. A Brevo reescreveu o botão para um endereço `sendibt2.com` que exibiu “This link is temporarily unavailable”. Cabeçalhos personalizados não impediram essa reescrita; não declaramos tracking desativado. A versão revisada da mensagem inclui os endereços originais visíveis para copiar e abrir, para confirmação e cancelamento. O incidente do botão foi encaminhado ao suporte; não se deve declarar esse redirecionamento resolvido sem nova prova.

As páginas que recebem tokens usam `Referrer-Policy: strict-origin`: isso omite caminho/query do Referer e mantém a origem do POST de formulário. A política `no-referrer` produz `Origin: null` nesse fluxo nativo e conflita com a proteção existente do proxy. O proxy não foi flexibilizado.

Referência técnica: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy

## Verificação

Testes de rota cobrem consentimento obrigatório, armazenamento do texto/versão, inscrição pendente, confirmação explícita, replay, expiração, falha do provedor e cancelamento. O HTML também é testado para preservar endereços originais visíveis. Validações gerais, TypeScript, lint e build Vinext concluídos antes de publicar. Evidências visuais e logs ficam em `output/pdu-email-release-2026-11-03` no checkout principal, sem tokens ativos em relatórios compartilhados.

## Resultado real em produção

Versão final do Worker: `8d9403d4-5e5e-4b3c-bc2c-b0ab02845ac1`.

Teste no endereço da própria conta: consentimento registrado às 18:03:15 UTC, confirmação às 18:06:01 UTC e cancelamento às 18:06:21 UTC em 3 de novembro de 2026. O registro terminou `unsubscribed`, preservando a data de confirmação. A confirmação e o cancelamento foram feitos pelos endereços originais visíveis na mensagem recebida; o botão reescrito pela Brevo não foi considerado aprovado.

A suíte final passou em 79 testes; TypeScript, lint e build Vinext passaram. O formulário público foi revisado em desktop e celular; o checkbox começa desmarcado e o botão exige a escolha afirmativa. O controle de cookies foi recusado sem impedir a inscrição específica no boletim.

O suporte recebeu a resposta no chamado `#5650700`, com confirmação explícita do uso de marketing e quatro anexos: formulário publicado, confirmação, cancelamento e falha do link da Brevo. Foi solicitada a validação manual, a correção do redirecionamento e a análise da entrega em spam. Não há confirmação de liberação do marketing nem de correção desse redirecionamento.
