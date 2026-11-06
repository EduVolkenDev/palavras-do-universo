# Avisos financeiros ao proprietário

O webhook Stripe assinado envia avisos operacionais via Brevo para o segredo `PDU_OWNER_NOTIFICATION_EMAIL`. O remetente é `suporte@palavrasdouniverso.com`. Isso não inscreve o proprietário ou clientes no boletim.

Eventos: `charge.succeeded` (inclusive renovações), checkouts pagos ou sem cobrança, `charge.refunded`, `payout.paid`, `payout.failed`. Adicionar os eventos de Charge e payout ao endpoint existente, preservando todos os eventos anteriores. Checkouts de assinaturas com valor positivo são notificados pelo Charge para evitar dois avisos da mesma cobrança.

A tabela server-only `owner_payment_notifications` guarda chave canônica por pagamento, tentativa, destinatário e ID aceito pela Brevo. Checkout e Charge compartilham a mesma chave PaymentIntent. O lease SQL evita envios concorrentes. Falha no aviso resulta em HTTP 500 para a Stripe repetir a entrega, sem alterar o valor cobrado. Fulfillment existente permanece idempotente.

Aceitação pela Brevo não comprova chegada à caixa de entrada. Não existe garantia absoluta de entrega nem de exatamente uma mensagem: uma falha de rede após aceitação pode deixar o resultado ambíguo. A chave de idempotência Brevo vale 15 minutos; leases ambíguos acima de 14 minutos entram em `review` sem reenvio automático. Conferir o log Brevo antes de qualquer reenvio manual. Não marcar `accepted` sem confirmação do provedor. Monitorar registros `review`, `failed` e leases antigos; a Stripe deixa de repetir eventos após sua janela de tentativas.

Diagnóstico de 6/11/2026: repasse `po_1UYEGU7HKwQp7jpakMoBzdqp`, R$12,00, conciliado pela Stripe com venda `ch_3UO1YR7HKwQp7jpa1iPDueXl` de R$12,90 em 7/10/2026 menos R$0,90 de taxa. Compra Caminho de 3 Cartas registrada paga, entregue e utilizada. Não houve uma nova venda de R$12 em novembro. O código anterior não possuía avisos operacionais ao proprietário.

## Verificação de assinatura no Worker

O bundle Vinext resolve Stripe com Web Crypto. Usar `constructEventAsync` com `Stripe.createSubtleCryptoProvider()`, mantendo o body bruto e a tolerância normal da Stripe. A API síncrona pode recusar assinaturas válidas nesse runtime antes de qualquer gravação no banco. O teste `stripe-webhook-runtime.test.mjs` assina com Web Crypto real e cobre assinatura válida, body adulterado e repetição de aviso após fulfillment já processado.
