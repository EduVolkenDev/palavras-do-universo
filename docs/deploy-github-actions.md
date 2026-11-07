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

## Verificar

```bash
curl -sI https://palavrasdouniverso.com/numeros | head -1
```

Esperado: `HTTP/2 200`.
