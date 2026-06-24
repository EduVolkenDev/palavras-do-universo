# Push Notifications — Setup

## 1. Gerar VAPID keys (uma vez só)

```bash
npx web-push generate-vapid-keys
```

Copie o output e adicione no `.env.local` (e nas envs do deploy):

```env
VAPID_PUBLIC_KEY=seu_public_key_aqui
VAPID_PRIVATE_KEY=seu_private_key_aqui
VAPID_EMAIL=mailto:contato@palavrasdouniverso.com

# Protege o endpoint /api/push/send contra chamadas externas
CRON_SECRET=uma_string_aleatoria_longa
```

---

## 2. Rodar no Supabase (SQL Editor)

```sql
-- Subscriptions de usuários anônimos
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para cleanup de subscriptions expiradas
create index if not exists idx_push_subscriptions_endpoint
  on push_subscriptions (endpoint);

-- Coluna de subscription no perfil de usuários autenticados
alter table profiles
  add column if not exists push_subscription jsonb,
  add column if not exists push_subscribed_at timestamptz;
```

---

## 3. Configurar cron diário

Chame `POST /api/push/send` todo dia às 8h com o header de autenticação:

```bash
curl -X POST https://palavrasdouniverso.com/api/push/send \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"title": "Palavras do Universo", "body": "Sua mensagem de hoje está pronta.", "url": "/"}'
```

### Opções de cron

**Cloudflare Workers (recomendado — já usa Cloudflare Pages):**
Crie um Worker com trigger `cron` (`0 11 * * *` = 8h BRT = 11h UTC) que faz o fetch acima.

**Vercel Cron** (se migrar para Vercel):
Em `vercel.json`:
```json
{
  "crons": [{ "path": "/api/push/send", "schedule": "0 11 * * *" }]
}
```
Não precisa do header `Authorization` nesse caso — Vercel injeta automaticamente.

**GitHub Actions:**
```yaml
on:
  schedule:
    - cron: '0 11 * * *'
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/push/send \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"body": "Sua mensagem de hoje está pronta."}'
```

---

## O que já está implementado (sem você tocar)

- `public/sw.js` — service worker que recebe e exibe a notificação
- `src/lib/push/usePushNotifications.ts` — hook React de subscribe/unsubscribe
- `src/app/api/push/subscribe/route.ts` — salva subscription no Supabase
- `src/app/api/push/send/route.ts` — envia para todos os subscribers
- Banner na homepage — aparece só se permissão ainda não foi concedida/negada
