# Recuperacao e publicacao do PDU — 18/10/2026

## Escopo

- Base: `3232850` na `main`, incluindo as interpretacoes especificas de transitos e aspectos PT/EN.
- Ajustes locais de contraste da assinatura, depoimentos e rodape incorporados.
- `AdminPageFrame` recuperado do snapshot `1eb17ab`, adaptado as seis entradas atuais: eventos, feedback, vouchers, mapas, atendimentos e checkout interno.
- Recuperadas a separacao de metricas/ruido no painel e a coleta mais precisa de falhas de midia/rolagem.
- Mantidas as funcoes atuais de vouchers, checkout de assinatura de teste, mapas privados, exportacao e lista de espera. Nao houve substituicao integral por arquivos antigos.
- Regras globais de impressao movidas para CSS global: o seletor `:global(body)` impedia o compilador de CSS Modules do localhost de abrir a pagina de mapas.

## Conferencia dos snapshots

Os snapshots `0142a94` e `1eb17ab` fazem parte da ancestralidade da `main`.
Na comparacao dos arquivos `src`/`public` de `1eb17ab` com a base atual, as ausencias eram o antigo favicon dentro de `src/app` (a familia atual fica em `public`) e `AdminPageFrame`, recuperado nesta entrega.
O inventario de funcoes de topo dos arquivos `src` alterados nesse snapshot identificou apenas dois auxiliares antigos ausentes: `buildLocalizedReadingText` e `astrologyImageSource`; a versao atual usa adaptacao contextual completa da leitura e paths de assets canonicos, sem restaurar esses auxiliares obsoletos.
Esta comparacao nao afirma equivalencia linha a linha de todas as funcionalidades historicas nem um teste autenticado de todos os fluxos.

## Validacao

- Seis telas reais renderizadas em uma rota temporaria com dados sinteticos e APIs interceptadas, em 390 px e 1440 px: uma `main`, um `h1`, seis links, sem overflow ou excecoes JavaScript.
- Filtros de incidentes tecnicos, metricas e ruido verificados com eventos sinteticos; metricas nao receberam botao de confirmar correcao.
- Home e tres CTAs de planos conferidos nos mesmos tamanhos; contraste sazonal e ausencia de overflow confirmados.
- Rota temporaria de QA removida antes do build/publicacao. Autorizacao das rotas de administracao permanece no servidor.
- Testes de regressao em `tests/recovered-dashboard.test.mjs` protegem a recuperacao sem remover funcoes mais recentes.

## Fora do deploy publico

- `output/` contem PDFs privados de clientes e nao entra no Git nem nos assets publicos.
- Materiais da campanha antiga continuam recuperaveis no snapshot `1eb17ab`; nao se restaurou um calendario operacional antigo nem se enviou conteudo as redes. A distribuicao permanece com o Muse, conforme orientacao do usuario.
- Nenhuma alteracao de credenciais, migracao de banco, compra, envio de email ou publicacao social e parte desta entrega.
