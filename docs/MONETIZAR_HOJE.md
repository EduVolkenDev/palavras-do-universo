# Monetizar Hoje

Objetivo: colocar a oferta `Clareza Urgente` para vender com o menor risco
possivel.

## Oferta principal

- Produto: `Clareza Urgente`
- Preco: `R$19,90`
- Tipo: pagamento avulso
- Entrega: acesso imediato a leitura premium no `Meu Universo`
- Promessa: transformar urgencia emocional em eixo, limite e proximo passo
  possivel.

## Variaveis live obrigatorias

No ambiente de deploy, preencher:

```bash
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO
NEXT_PUBLIC_SUPPORT_EMAIL=
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
HEALTH_CHECK_TOKEN=
STRIPE_ENABLE_PIX=true
STRIPE_CHECKOUT_VERIFIED=false
STRIPE_CUSTOMER_PORTAL_VERIFIED=false
```

Nao colocar `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` ou
`STRIPE_WEBHOOK_SECRET` em codigo publico.

## Stripe live

1. Ativar o modo live na Stripe.
2. Ativar Pix em formas de pagamento da conta Stripe live.
   - Pix so entra nos produtos avulsos em BRL.
   - Assinatura continua sem Pix, porque Pix nao e forma recorrente.
   - So coloque `STRIPE_ENABLE_PIX=true` depois que a Stripe aceitar Pix na conta.
3. Criar webhook endpoint:

```text
https://SEU-DOMINIO/api/stripe/webhook
```

4. Eventos minimos:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

5. Copiar o `Signing secret` do webhook para `STRIPE_WEBHOOK_SECRET`.

## Teste antes de divulgar

1. Fazer deploy.
2. Abrir a home em producao.
3. Clicar em `Clareza Urgente`.
4. Confirmar que o Checkout mostra cartao e Pix.
5. Pagar uma compra real pequena, preferencialmente Pix primeiro.
6. Confirmar:
   - Stripe mostra pagamento aprovado.
   - `/meu-universo` mostra acesso ativo.
   - `?product=clareza_urgente` abre a leitura.
   - a leitura e salva no historico.
7. Depois do teste real, marcar:
   - `STRIPE_CHECKOUT_VERIFIED=true`
   - `STRIPE_CUSTOMER_PORTAL_VERIFIED=true` somente se o portal de assinatura abrir corretamente.

## Texto pronto para vender

```text
Voce nao precisa decidir no desespero.

Criei a Clareza Urgente: uma leitura simbolica premium para respirar,
entender o que esta pesando e escolher o proximo passo com mais firmeza.

Nao e previsao. E um espelho para recuperar eixo.

R$19,90. Entrega imediata.
```

## Link de divulgacao

Depois do deploy, usar:

```text
https://SEU-DOMINIO/#produtos
```

Se o dominio ainda nao estiver pronto, usar a URL de producao do deploy.
