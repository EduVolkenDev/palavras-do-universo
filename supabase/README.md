# Supabase

O banco de produção deve ser alterado somente por migrations revisadas nesta
pasta.

## Aplicação

1. Revise a migration e faça backup do projeto.
2. Aplique primeiro em um projeto Supabase de homologação.
3. Valide login, leitura gratuita, checkout, webhook e acesso entregue.
4. Só então aplique em produção.

A aplicação usa o `service role` exclusivamente no servidor para fulfillment e
operações administrativas. Sessões de usuário usam o `anon key` e políticas
RLS.
