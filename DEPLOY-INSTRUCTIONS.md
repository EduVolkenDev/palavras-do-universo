# 🚀 Palavras do Universo - Instruções de Deploy para Produção

## 📋 Pré-requisitos

Antes de fazer deploy, você precisa ter:

1. ✅ Conta Anthropic com creditos ativos
2. ✅ Projeto Supabase criado e configurado
3. ✅ Conta Stripe com keys de produção (live)
4. ✅ Domínio registrado (ex: palavrasdouniverso.com.br)
5. ✅ Conta em provider de hosting (Vercel, Netlify, ou similar)

---

## 🔐 Variáveis de Ambiente - Configuração

### 1️⃣ Anthropic API Key

**Como obter:**
1. Acesse https://platform.claude.com/settings/keys
2. Clique em "Create new secret key"
3. Copie a key (comeca com `sk-ant-...`)

**Configurar:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ANTHROPIC_MODEL=claude-sonnet-4-6
```

⚠️ **IMPORTANTE**: Certifique-se de ter creditos disponiveis na Anthropic.

---

### 2️⃣ Supabase - Backend & Database

**Como obter:**
1. Acesse seu projeto: https://matykrddzfjcswqjanly.supabase.co
2. Vá em **Settings** → **API**
3. Copie as 3 keys necessárias

**Configurar:**
```bash
SUPABASE_URL=https://matykrddzfjcswqjanly.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://matykrddzfjcswqjanly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXX...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXX...
```

📝 **Nota**: As keys `NEXT_PUBLIC_*` são seguras para uso no frontend.

---

### 3️⃣ URL do Site em Produção

**Configurar com seu domínio real:**
```bash
NEXT_PUBLIC_SITE_URL=https://palavrasdouniverso.com.br
```

⚠️ **IMPORTANTE**: 
- Sempre usar HTTPS em produção
- Sem barra `/` no final
- Este URL é usado por checkout, retorno pós-pagamento e URLs absolutas do app

---

### 4️⃣ Stripe - Pagamentos

**Como obter as keys LIVE:**
1. Acesse https://dashboard.stripe.com/apikeys
2. Alterne para **Live mode** (toggle no canto superior direito)
3. Copie as keys de produção

**Configurar:**
```bash
STRIPE_SECRET_KEY=<STRIPE_SECRET_KEY>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Como configurar Webhook:**
1. Vá em https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL do endpoint: `https://SEU-DOMINIO/api/stripe/webhook`
4. Selecione eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copie o "Signing secret"

```bash
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 5️⃣ PIX (Opcional - Brasil)

Se quiser aceitar pagamentos via Pix:

1. Configure Pix no Stripe Brasil
2. Ative a flag:

```bash
STRIPE_ENABLE_PIX=true
```

Se não, deixe `false` (apenas cartão).

---

## 🌐 Deploy em Vercel (Recomendado)

### Passo 1: Push do código para GitHub
```bash
cd /Users/eduardovolken_1/palavras-do-universo
git add -A
git commit -m "feat: prepare for production deployment"
git push origin main
```

### Passo 2: Importar projeto na Vercel
1. Acesse https://vercel.com
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Passo 3: Adicionar variáveis de ambiente
Na Vercel Dashboard → Settings → Environment Variables:

Adicione **TODAS** as variáveis do arquivo `.env.production.template`:
- ANTHROPIC_API_KEY
- ANTHROPIC_MODEL
- SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SITE_URL
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_ENABLE_PIX

### Passo 4: Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Acesse o domínio gerado (ex: `palavras-do-universo.vercel.app`)

### Passo 5: Configurar domínio customizado
1. Na Vercel → Settings → Domains
2. Adicione seu domínio: `palavrasdouniverso.com.br`
3. Configure DNS conforme instruções da Vercel
4. **IMPORTANTE**: Atualize a variável `NEXT_PUBLIC_SITE_URL` com o novo domínio
5. Faça um novo deploy

---

## 🌐 Deploy em Netlify

### Passo 1: Push do código para GitHub
```bash
cd /Users/eduardovolken_1/palavras-do-universo
git add -A
git commit -m "feat: prepare for production deployment"
git push origin main
```

### Passo 2: Importar projeto na Netlify
1. Acesse https://app.netlify.com
2. Clique em "Add new site" → "Import an existing project"
3. Conecte ao GitHub e selecione o repositório
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

### Passo 3: Adicionar variáveis de ambiente
Site settings → Environment → Environment variables

Adicione todas as variáveis do `.env.production.template`

### Passo 4: Deploy
1. Clique em "Deploy site"
2. Aguarde o build completar
3. Configure domínio customizado em Settings → Domain management

---

## ✅ Checklist Final - Antes de Lançar

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Anthropic com creditos suficientes e modelo configurado disponivel
- [ ] Supabase database migrado e populado
- [ ] Stripe webhook configurado e testado
- [ ] Domínio customizado apontando corretamente
- [ ] `NEXT_PUBLIC_SITE_URL` atualizado com domínio final
- [ ] SSL/HTTPS ativo (automático na Vercel/Netlify)
- [ ] Teste de leitura gratuita funcionando
- [ ] Teste de checkout e pagamento funcionando
- [ ] `/meu-universo` mostra o acesso comprado
- [ ] Leitura comprada abre e salva no histórico

---

## 🚨 Segurança - Importante

### ❌ NUNCA faça isso:
- Commitar arquivos `.env` com values reais ao git
- Expor `STRIPE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Usar keys de teste (test/dev) em produção
- Compartilhar keys em mensagens/emails

### ✅ Sempre faça isso:
- Usar variáveis de ambiente do provider de hosting
- Rotacionar keys periodicamente
- Monitorar uso de APIs (Anthropic, Stripe)
- Ter backup do database (Supabase)
- Configurar alertas de billing (Anthropic, Stripe)

---

## 📞 Suporte

Se tiver problemas no deploy:
1. Verifique logs do build no provider (Vercel/Netlify)
2. Teste variáveis localmente com `.env.local`
3. Verifique se todas as keys estão válidas e ativas
4. Confirme que webhook do Stripe está recebendo eventos

---

## 📝 Arquivos de Referência

- `.env.production.template` → Template limpo para produção
- `.env.example` → Template de desenvolvimento
- `.env.local` → Variáveis locais (NÃO commitar)
- `.env.live.local` → Backup das keys live (NÃO commitar)

---

**Última atualização:** 03/06/2026  
**Projeto:** Palavras do Universo  
**Stack:** Next.js 16 + Supabase + Stripe + Anthropic
