# Céu diário por e-mail

O boletim é opt-in separado de `profiles.marketing_opt_in`. O formulário em `/ceu-por-email` grava uma inscrição pendente e envia um link de confirmação válido por 24 horas. Apenas inscrições confirmadas entram no envio. Cada mensagem inclui um link de cancelamento; o envio HTTP da Brevo ainda não foi validado para cabeçalho de unsubscribe em um clique, portanto não o declaramos ativo. Leituras são gerais, calculadas a partir de posições do céu, não do mapa natal do destinatário.

## Entrega

- O Cloudflare Cron Trigger em `wrangler.daily-sky-scheduler.jsonc` consulta a rota protegida a cada 15 minutos de 07:00 a 10:59 UTC. A rota só envia entre 08:00 e 10:59 no fuso Europe/London, cobrindo as mudanças de horário de verão. O Worker de agendamento é separado da aplicação vinext para não modificar o entrypoint do site.
- Cada chamada reclama até 20 destinatários não processados naquela data. A restrição única `(subscription_id, local_date)` evita duplicação entre chamadas concorrentes. Erros não são reenviados automaticamente, porque um timeout pode acontecer depois de o provedor aceitar a mensagem.
- O Worker da aplicação envia diretamente para a API HTTP da Brevo com `BREVO_API_KEY`. O boletim não depende da Vercel. A chave SMTP **não** autentica a API HTTP. Vouchers mantêm o caminho transacional existente; a migração experimental para API não foi incluída.
- `daily_sky_email_deliveries.status = accepted` significa que o provedor aceitou a mensagem, não que ela chegou à caixa de entrada. Brevo e inbox são a evidência final de entrega.

## Checklist de publicação

1. A versão remota `20261013141445` foi lida na tabela de histórico do Supabase e reproduzida fielmente no arquivo local correspondente. Confirmar essa reconciliação no review. Não executar `db push --include-all`: há outras migrações locais não aplicadas.
2. Aplicar apenas `supabase/migrations/20261103175107_daily_sky_email_consent.sql` pelo fluxo de migração aprovado, confirmar tabelas, função e RLS com consulta de teste.
3. Cadastrar `BREVO_API_KEY` como segredo do Worker da aplicação na Cloudflare (não é a chave SMTP), mantendo `PDU_EMAIL_FROM`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET`. Publicar a aplicação no Cloudflare; não copiar valores para o repositório.
4. Testar com um único endereço próprio: voucher pelo caminho API, inscrição, confirmação, idioma PT/EN, registro no Supabase, aceitação na Brevo, recebimento real e cancelamento. Não habilitar o Cron antes desse teste.
5. Configurar `PDU_CRON_SECRET` no Worker de agendamento com o mesmo valor de `CRON_SECRET` da aplicação e publicar `wrangler.daily-sky-scheduler.jsonc`. O segredo antes cadastrado no GitHub não é usado por este agendador; remover o workflow/segredo antigo somente depois de confirmar o Cron Event na Cloudflare e a ausência de duplicação.
6. Após prova de vouchers e boletim pela API, remover `PDU_SMTP_RELAY_URL`, `BREVO_SMTP_KEY` e `BREVO_SMTP_USER` do Worker da aplicação e redeployar. Só apos confirmar todos os fluxos de e-mail, aposentar o relay da Vercel. O fluxo de inscrição, confirmação e cancelamento foi publicado em 3 de novembro de 2026. Consulte `daily-sky-email-release.md` para a migração aplicada, chave configurada, prova real e limite do redirecionamento da Brevo. O agendador diário não faz parte dessa publicação.

Não incluir usuários existentes sem consentimento específico. Em caso de falha, pausar o workflow e consultar o `provider_message_id` no Brevo antes de qualquer reenvio manual.

## Publicação de 4 de novembro de 2026

Convite no Meu Universo somente para contas conectadas, com link ao formulário existente, sem importar contatos ou enviar convites por e-mail. A rota diária exige `PDU_DAILY_SKY_EMAIL_ENABLED=true`; o padrão é desativado e o Worker de agendamento não é publicado nesta atualização. A Brevo confirmou a validação do canal de marketing; um novo teste do link rastreado ainda é necessário.
