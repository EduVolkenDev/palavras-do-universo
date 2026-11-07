# Deploy automático (GitHub Actions → Cloudflare)

O workflow `.github/workflows/deploy-cloudflare.yml` publica o site na cada push na branch `main`.

## Secrets no GitHub

Em **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Origem |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers** (conta Volynx + zona `palavrasdouniverso.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API, ou o mesmo valor já no Worker |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → anon public key, ou o mesmo secret no Worker |

Opcional: `CLOUDFLARE_ACCOUNT_ID` (`3167dcdb5b0aba19f14c67fea20fe77e`). Se omitido, o workflow usa esse id.

## Disparar manualmente

**Actions → Deploy Cloudflare → Run workflow**

## Cadastrar via CLI (no repo)

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://matykrddzfjcswqjanly.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
```

O comando pede o valor (cole a anon key do Supabase — **não** a service_role).

## Se o e-mail de falha chegou

1. Abra **Actions → Deploy Cloudflare →** o run vermelho.
2. Se o log for `Missing GitHub Actions secret`, cadastre os três secrets acima.
3. **Actions → Deploy Cloudflare → Run workflow** para tentar de novo.

## Verificar

```bash
curl -sI https://palavrasdouniverso.com/numeros | head -1
```

Esperado: `HTTP/2 200`.
