# Palavras do Universo End-to-End Audit

Data: 2026-07-27

## Escopo

Auditoria local de estabilidade, crash-risk mobile, rotas publicas, leitura de 3 cartas, Carta do Dia, assets, build, lint e limites de integracoes externas.

## Resultado executivo

- UI publica local: passou nos fluxos principais auditados.
- Crash/jump-to-top mobile: nao reproduzido no stress test local.
- Assets mobile: risco reduzido; o caminho auditado deixou de carregar asset acima de 2 MB.
- Leitura de 3 cartas: passou em desktop e mobile com API mockada.
- Carta do Dia: corrigido 401 de visitante anonimo no console.
- Supabase/Stripe/webhook/entitlements reais: nao comprovados no localhost atual porque faltam variaveis server-side.

## Evidencias locais

### Validacoes de codigo

- `npm run lint`: passou com 0 erros. Restou 1 warning em `src/app/page.tsx` por uso intencional de `<img>` dentro de `<picture>` para controlar asset mobile.
- `npm run build`: passou. Next compilou TypeScript e gerou 42 rotas.
- `npm run validate:tarot-assets`: passou com 78 cartas WebP completas.
- `npm run validate:fallback`: passou com 24 variantes de usuario, 4 modos, 7 produtos e combinacoes estruturais validas.

### Rotas publicas

Auditadas em desktop EN e mobile PT:

- `/`
- `/carta-do-dia`
- `/baralho`
- `/tiradas`
- `/profissionais`
- `/profissionais/me` redirecionando para login quando anonimo
- `/meu-universo`
- `/entrar`
- `/termos`
- `/privacidade`
- `/reembolsos`

Resultado do audit por rotas antes do ultimo patch:

- Status 200 nas rotas auditadas.
- `document.documentElement.lang` correto para EN/PT.
- 0 overflow horizontal.
- 0 imagens quebradas.
- O unico problema encontrado foi console 401 em `/carta-do-dia`, corrigido depois no `SaveDailyCardButton`.

### Fluxo de leitura

Fluxo testado com `/api/reading/create` mockado:

- Home abriu em desktop e mobile.
- Pergunta preenchida.
- Botao `open-reading-button` acionado.
- Secao `#reading-opened` apareceu.
- 3 cartas renderizadas.
- 0 overflow horizontal.
- 0 imagens quebradas.
- 0 failed requests.
- 0 console errors.

### Stress mobile de scroll

Teste em viewport 390x844:

- Scroll repetido pela home.
- Reload em posicao profunda.
- Sem erro de console.
- Sem page error.
- Sem failed request.
- Sem imagem quebrada.
- Sem overflow horizontal.
- Scroll foi restaurado apos reload: antes `scrollY=6361`, depois `scrollY=9602`.
- Nenhum asset acima de 2 MB carregou no caminho auditado apos otimizacao.

Assets carregados no caminho auditado apos otimizacao:

- `/assets/palavrasuniverso-mobile.webp` - 214996 bytes.
- `/assets/palavras-symbol.webp` - 23162 bytes.
- `/assets/product-caminho-das-3-cartas-mobile.webp` - 47660 bytes.

## Correcoes aplicadas

### 1. Variantes mobile para produtos pesados

Criadas:

- `public/assets/product-caminho-das-3-cartas-mobile.webp` - 500x900, 48 KB.
- `public/assets/pdu-heart-mobile.webp` - 900x900, 152 KB.
- `public/assets/pdu-target-mobile.webp` - 900x900, 84 KB.
- `public/assets/pdu-ciclos-mobile.webp` - 900x900, 152 KB.
- `public/assets/product-carta-do-dia-mobile.webp` - 900x900, 48 KB.

### 2. Homepage usando asset leve no caminho critico mobile

- `src/lib/pdu-assets.ts` ganhou aliases mobile.
- `src/app/page.tsx` passou a usar `product-caminho-das-3-cartas-mobile.webp` no header visual da leitura e no `<picture>` do card de produto Caminho das 3 Cartas em mobile.

### 3. Carta do Dia sem 401 anonimo no console

- `src/components/SaveDailyCardButton.tsx` agora so consulta `/api/saved-messages` quando existe usuario autenticado no Supabase client.
- Visitante anonimo continua podendo salvar localmente sem gerar 401 no carregamento.

## Limites nao comprovados

Nao foi possivel chamar o produto de perfeito end-to-end real porque o localhost atual nao tem as variaveis server-side necessarias:

- `SUPABASE_SERVICE_ROLE_KEY`: ausente.
- `SUPABASE_URL`: ausente.
- `STRIPE_SECRET_KEY`: ausente.
- `STRIPE_WEBHOOK_SECRET`: ausente.
- `NEXT_PUBLIC_SITE_URL`: ausente.

Consequencias:

- Magic link/inbox real nao foi comprovado.
- Checkout Stripe real nao foi comprovado.
- Webhook Stripe -> entitlement nao foi comprovado.
- Vouchers/admin/entitlements remotos nao foram comprovados.
- RLS/security_invoker remoto nao foi comprovado.

## Recomendacao antes de dizer "end-to-end perfeito"

1. Configurar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `NEXT_PUBLIC_SITE_URL` no ambiente local ou staging.
2. Rodar teste real: magic link -> login -> checkout -> pagamento controlado -> webhook -> entitlement -> Meu Universo.
3. Repetir stress em Safari iPhone real apos deploy, porque Chrome mobile emulado nao prova ausencia absoluta de crash no Safari.
4. Revalidar producao em `https://palavrasdouniverso.com` depois do deploy.
