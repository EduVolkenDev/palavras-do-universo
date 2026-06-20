# ⚡ Quick Start - Deploy Palavras do Universo

## 📦 O que você precisa configurar

Para colocar o site no ar, configure as variaveis de ambiente abaixo no provider de hosting:

```bash
# 1. Anthropic (para gerar as leituras)
ANTHROPIC_API_KEY=sk-ant-XXXXXXXX
ANTHROPIC_MODEL=claude-sonnet-4-6

# 2-5. Supabase (database + entitlements)
SUPABASE_URL=https://matykrddzfjcswqjanly.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://matykrddzfjcswqjanly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXXXXX

# 6. URL do seu site
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com.br

# 7-9. Stripe (pagamentos)
STRIPE_SECRET_KEY=<STRIPE_SECRET_KEY>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX

# 10. Pix (opcional)
STRIPE_ENABLE_PIX=true
```

---

## 🚀 Passo a Passo Rápido

### 1️⃣ Inicializar Git (se ainda não fez)
```bash
cd /Users/eduardovolken_1/palavras-do-universo
git init
git add .
git commit -m "feat: initial commit - palavras do universo"
```

### 2️⃣ Criar repositório no GitHub
1. Acesse https://github.com/new
2. Nome: `palavras-do-universo`
3. Visibilidade: Private (recomendado)
4. NÃO inicialize com README, .gitignore ou license (já temos)
5. Clique em "Create repository"

### 3️⃣ Push para GitHub
```bash
# Substitua SEU-USUARIO pelo seu username do GitHub
git branch -M main
git remote add origin git@github.com:SEU-USUARIO/palavras-do-universo.git
git push -u origin main
```

### 4️⃣ Deploy na Vercel
1. Acesse https://vercel.com
2. Clique em "New Project"
3. Importe o repo do GitHub
4. Configure as variáveis de ambiente (copie de `.env.production.template`)
5. Clique em "Deploy"

---

## 📋 Onde conseguir cada variável

### Anthropic
- Acesse: https://platform.claude.com/settings/keys
- Crie uma nova key
- Confirme que a conta possui creditos disponiveis

### Supabase
- Acesse: https://matykrddzfjcswqjanly.supabase.co
- Vá em **Settings** → **API**
- Copie: URL, anon key, service_role key

### Stripe
- Acesse: https://dashboard.stripe.com/apikeys
- Alterne para **Live Mode** (toggle superior direito)
- Copie: Secret Key, Publishable Key
- Configure webhook em: https://dashboard.stripe.com/webhooks
  - URL: `https://SEU-DOMINIO/api/stripe/webhook`
  - Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Copie o Signing Secret

---

## ✅ Checklist Final

Antes de lançar, teste:
- [ ] Leitura gratuita funciona
- [ ] Checkout abre corretamente
- [ ] Pagamento Stripe processa
- [ ] Webhook recebe evento
- [ ] `/meu-universo` mostra o acesso comprado
- [ ] Leitura comprada abre e salva no histórico
- [ ] Domínio customizado ativo

---

## 📞 Próximos Passos

1. **Configure as keys** seguindo este guia
2. **Faça o deploy** na Vercel
3. **Teste tudo** antes de divulgar
4. **Configure domínio** próprio se quiser

📖 **Documentação completa**: Veja `DEPLOY-INSTRUCTIONS.md` para detalhes

---

**Última atualização:** 03/06/2026  
**Stack:** Next.js 16 + Supabase + Stripe + Anthropic
