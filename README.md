# Palavras do Universo

Experiência diária de clareza emocional, tarot simbólico e ritual pessoal.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Validação

```bash
npm run lint
ANTHROPIC_API_KEY=dummy-build-key npm run build
```

## Ambiente

Copie as variáveis documentadas em `.env.example` para um arquivo `.env.local`.
Nunca versione chaves reais.

## Produção

- Site: https://palavrasdouniverso.com
- Hosting: Vercel
- Banco: Supabase
- Pagamentos: Stripe

Antes de monetizar, conclua a verificação em
[`MONETIZATION-READINESS.md`](./MONETIZATION-READINESS.md) e confirme
`GET /api/health/commerce` no ambiente final.
