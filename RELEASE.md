# Publicação das melhorias — 24/10/2026

Autorização de produção recebida após a homologação DEV. WhatsApp e envios reais continuam desativados.

## Versão candidata

- Branch `release/modernizacao-2026-10`; origem DEV `9f693d5c6833b5b18271b65c4dd39f2ce32249b6`.
- Produção Supabase: `upurwxqorziaakucrstm`; Preview/DEV: `hgmmabtixqaztuswmivv`.
- Vercel: `estetica-veicular`, projeto `prj_ya29fZzjgzBW1PfmSWkMt42Ow1tN`, equipe `team_XqXTDnWgbZomjNwryi4C7hQg`.
- Destino do frontend: configuração de ambiente validada em build e execução; chave deve ser anon do projeto correspondente. Nenhuma credencial de servidor no cliente.
- Novos módulos disponíveis também no modo de produção. Preview continua no DEV. Funções e RPCs usam nomes separados por ambiente.
- Fechamento no servidor às 00:05 Macapá; preserva fechamentos existentes. A soma dos serviços não é multiplicada quando há vários pagamentos no atendimento.

## Migração preparada, ainda não aplicada

`supabase/migrations/20261024213656_production_modernization.sql` adiciona oito tabelas com RLS e duração dos serviços, instala funções transacionais, substitui políticas antigas pelo modelo homologado e agenda o fechamento no servidor. Não copia dados sintéticos do DEV nem remove registros da operação. A alteração de políticas retira de gerentes a edição direta de perfis e impede escalada de privilégio; criação/edição permitida usa a Edge Function.

Antes de aplicar: backup independente e recuperável da produção, incluindo esquema/políticas atuais, dados, Auth e arquivos Storage. O backup B2 existente continua exclusivamente DEV e não protege a produção.

## Funções de produção preparadas

- `integrations-gateway` e `operational-insights`: alvo de produção explícito; gestão autenticada. O status sempre informa envio desativado.
- O arquivo `create-user-production/index.ts` deve ser implantado no slug **create-user** do projeto de produção; não no slug create-user-production. Regras de gestão iguais às homologadas, com alvo de produção explícito.
- `service-completed-notification`, `notification-delivery` e `job-application`: handlers sem chamadas externas. O envio de candidatura informa indisponibilidade em vez de afirmar que enviou e-mail.
- Não substituir as funções DEV pela versão de produção.
- Antes de sobrescrever qualquer função existente, guardar a versão anterior no pacote privado de recuperação. Não habilitar mensagens por variável, pois esta release tem bloqueio explícito.
- Verificar presença e validade de credenciais de produção nos segredos do servidor. Não presumir que uma credencial DEV esteja autorizada ou configurada em produção. OpenAI de produção ainda não validada; Resend validado anteriormente apenas no DEV/simulador.

## Verificações concluídas

- `npm run build:dev`: aprovado; `node scripts/verify-development.mjs`: paginação de 1.205 registros e sete módulos aprovados.
- `node scripts/verify-release.mjs`: separação de ambientes, rejeição de service_role no frontend, seleção de funções/RPCs e bloqueio dos três handlers de envio aprovados.
- Build de produção com chave sintética **sem validade de autenticação**, usada somente no teste de compilação: aprovado. Não constitui teste das variáveis reais da Vercel ou do login de produção.
- Migração executada no DEV sobre cópia temporária da estrutura real de produção (14 tabelas, nenhum dado de cliente copiado), com cron excluído desse teste. As oito novas tabelas e 24 verificações de regras de negócio/transações passaram. Tudo revertido por ROLLBACK. Script em `supabase/sql/verify-production-release-isolated.sql`; não executar em produção.
- Nenhuma alteração no banco ou nas Edge Functions de produção foi aplicada nesta preparação.
- Aviso de bundle grande permanece; não houve erro de build.

## Ordem da publicação

1. Restabelecer acesso à equipe Vercel e ao painel Supabase para conferir backup e segredos, sem enviar valores no chat.
2. Criar e validar o backup independente de produção. Guardar a chave de recuperação em cofre; não usar o bucket DEV para dados de produção.
3. Conferir as variáveis reais de produção, preservar a versão anterior das funções e preparar credenciais de produção faltantes.
4. Aplicar a migração em transação; conferir advisors, políticas, concessões e totais antes/depois, sem imprimir registros de clientes. Validar cron em separado sem fechar dias manualmente.
5. Implantar as funções de produção e confirmar bloqueio de envio e autenticação. Verificar a IA com pergunta sintética, sem dados privados.
6. Criar build de produção sem promover domínios; verificar login e consultas reais somente em leitura. Não usar o preview DEV como se fosse build de produção testado.
7. Promover a versão testada e conferir domínio, site, sistema, login e módulos. Atualizar este documento com SHA, URL, execução e evidências.

## Retorno

Frontend anterior: commit `b89992b84f0e02169ee8236ccbe95cd4ee312368`. Restaurar o deployment anterior se a publicação apresentar falha. Retorno do frontend não reverte tabelas, políticas, funções ou cron; guardar as definições anteriores e o backup antes da migração. As novas tabelas devem permanecer durante o retorno para não perder lançamentos novos. Não reativar handlers antigos de envio enquanto mensagens estiverem proibidas.

## Bloqueios atuais

- Conector Vercel retorna 403 e exige concessão de acesso à equipe pelo titular.
- Painel Supabase está deslogado; backups e segredos de produção ainda não foram conferidos.
- Publicação, teste das credenciais reais e homologação pós-publicação continuam pendentes. O rascunho não deve ser mesclado enquanto estes itens não forem resolvidos.
