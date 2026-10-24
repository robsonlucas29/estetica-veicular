# Garagem Grau Car 096 — homologação

Projeto autorizado: `hgmmabtixqaztuswmivv`. Branch: `desenvolvimento/homologacao-integracoes`.
Produção e domínio principal preservados. Envios reais desativados.

## Implementado

- Preview separado, login e perfil administrador de desenvolvimento.
- OpenAI e Resend em segredos de Edge Functions; nenhum segredo de provedor no frontend.
- CORS corrigido e OpenAI testada pela interface; resumo operacional sem envio dos dados à IA.
- Estoque, despesas, fidelidade, consentimentos e fila de notificações.
- Agenda visual com alteração de data/hora e arraste para horários, sujeito a confirmação.
- Bloqueio de conflitos de veículo ou funcionário no banco, usando duração do serviço.
- Gravação de agendamento e conclusão transacionais: falhas preservam o original; histórico e pagamento são gravados juntos. Conclusão duplicada bloqueada.
- Fechamento no servidor via pg_cron às 00:05 America/Belem (03:05 UTC), preservando fechamentos existentes e recuperando dias concluídos sem fechamento. A execução foi testada manualmente em transação; duas execuções naturais do cron constam como succeeded em 24/10/2026.
- Paginação das consultas de desenvolvimento, sem truncamento silencioso em 1.000 linhas. As páginas são reunidas em memória para preservar os relatórios; volumes maiores exigirão filtros no servidor.
- PWA instalável em navegadores compatíveis, sem cache de dados pessoais ou operação offline.

## Verificação de 22/10/2026

- Build Vite aprovado; alerta de bundle grande permanece, sem erro de compilação.
- 13 testes no banco aprovados: conflitos, reagendamento, estoque, pontos, despesas, consentimento, fechamento idempotente e permissões.
- 11 testes da transação de atendimento aprovados para administrador, gerente e administrativo; visualizador e anônimo bloqueados. Esses testes verificam a autorização da função usando auth.uid/perfil; não substituem login de cada perfil pela interface.
- Paginação verificada com 1.205 registros sintéticos em três páginas, sem perdas/duplicatas.
- Renderização inicial dos sete módulos aprovada.
- Todos os testes SQL sintéticos executados com ROLLBACK; conta real de desenvolvimento continua administradora.
- OpenAI: HTTP 200 e resposta autenticada na interface. Resend: validação HTTP 422 com corpo vazio e sem envio; não equivale a teste de entrega.
- Advisor: nenhuma advertência de banco/RLS; permanece aviso de proteção contra senhas vazadas desativada no Auth.

## Estado atual em 24/10/2026

- OpenAI: nova chamada sintética aprovada, HTTP 200.
- Resend: chamada ao simulador oficial delivered@resend.dev aprovada, HTTP 200. Nenhuma caixa de entrada real foi testada. ENABLE_LIVE_NOTIFICATIONS_DEV continua false.
- Prova dos provedores: https://github.com/robsonlucas29/graucar-dev-backup-runner/actions/runs/40112940568.
- Corrigidas as permissões explícitas de service_role: SELECT/INSERT/UPDATE em profiles e notification_outbox; SELECT em notification_consents. Esses acessos são necessários às funções de servidor. Grants de anon/authenticated e políticas RLS preservados. Advisor sem novos avisos de banco/RLS; proteção de senhas vazadas do Auth continua desativada.
- Backups reais: banco dos quatro schemas e um arquivo Storage enviados criptografados ao B2 privado, baixados e autenticados; restauração PostgreSQL isolada de 57 tabelas e 190 linhas aprovada. Executor separado: robsonlucas29/graucar-dev-backup-runner.
- Recuperação ampliada em Supabase descartável no executor: Auth, login dos quatro perfis, troca de senha, rejeição da senha antiga, RLS e recuperação HTTP dos arquivos já passaram nas etapas executadas. A rodada completa com função nativa de usuários e transações ainda está em andamento; não declarar aprovação integral antes do resultado verde.
- Build DEV, paginação de 1.205 registros e renderização dos sete módulos passaram novamente.
- Acesso visual em 24/10: a tentativa pelo formulário seguro retornou e-mail/senha inválidos. Conferência visual de criação/edição de usuários ainda pendente de acesso. Senha do banco não é senha da conta do sistema.
- Agendamento diário do backup permanece condicionado a ENABLE_DEV_BACKUPS=false até a cópia independente da chave de recuperação. Os cinco segredos estão salvos no executor; nunca imprimir ou registrar a chave em logs. A preparação de uma exportação criptografada de recuperação para logs foi bloqueada pela revisão automática e retirada, sem execução.
- WhatsApp adiado por instrução do usuário. Produção não alterada: main b89992b84f0e02169ee8236ccbe95cd4ee312368. Entrada em produção fora do escopo.

## Reproduzir verificações

`npm ci --ignore-scripts`, `npm run build:dev`, `node scripts/verify-development.mjs`.
SQL de instalação e testes em `supabase/sql/`; executar exclusivamente no projeto de desenvolvimento. Testes SQL usam a conta de homologação existente apenas dentro de uma transação revertida. Não executar em produção.

## Evidências da rodada pela interface

- Atendimento concluído de R$ 100,00 no histórico e caixa; sem mensagem e fila vazia.
- Estoque: +10 e -3 litros, saldo 7. Financeiro: receita R$ 100,00 e despesa paga R$ 25,00, saldo R$ 75,00. Fidelidade: +100 e -30 pontos, saldo 70.
- Segundo atendimento sintético, com imagem anexada, reagendado de 10h para 11h do dia 23/10/2026, confirmado por consulta ao servidor.
- Corrigida propagação dos agendamentos entre agenda visual e estado compartilhado das telas originais.
- Dados sintéticos desta rodada permanecem identificados como HOMOLOGAÇÃO no desenvolvimento para conferência; não são dados reais da operação.

- Verificação final: alteração de 12h para 13h refletida na tela original após a correção. Segundo atendimento concluído em 22/10/2026 às 13h, imagem transferida para o histórico, dois pagamentos fictícios de R$ 100,00 (R$ 200,00 totais), nenhum agendamento pendente e nenhuma notificação enviada.

## Recuperação e limites

Ver README e testes do repositório privado separado de backup. O pacote inclui public/private/auth/storage e os objetos do Storage. Não inclui segredos de Edge Functions, Vault, definições completas de roles globais, configurações de provedores, SMTP/OAuth, domínios ou instalação da plataforma. A recuperação em instância descartável de CI não é publicação em um novo projeto gerenciado da Supabase.

Chave B2 limitada ao bucket/prefixo de DEV, retenção de 30 dias visíveis mais um dia até exclusão e limite de pacote de 256 MiB. A chave do console também possui deleteFiles/configurações de bucket; o executor não usa essas operações. Renovação da chave B2 necessária antes de 21/01/2027. A chave OpenAI DEV precisa de renovação antes de 21/11/2026.
