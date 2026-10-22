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
- Fechamento no servidor via pg_cron às 00:05 America/Belem (03:05 UTC), preservando fechamentos existentes e recuperando dias concluídos sem fechamento. A primeira execução foi testada manualmente em transação; aguarda a próxima execução agendada para verificação natural do cron.
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

## Bloqueios reais para entrega definitiva

1. Login da aplicação expirou por inatividade; a tentativa segura seguinte foi recusada com “E-mail ou senha inválidos”. Necessário o usuário entrar manualmente para concluir homologação visual de cadastros, anexos e relatórios, além de novos usuários.
2. WhatsApp segue sem credenciais: login da Meta em ciclo. Não foi contornado nem ativado envio real.
3. Backup: o painel confirmou plano Free sem backups. Nenhum backup externo foi configurado ou restauração completa foi alegada. Necessário destino externo/credenciais próprias para backup ou plano compatível; código no GitHub não é backup dos dados e anexos.
4. Entrada em produção continua fora desta execução, respeitando a instrução original de não alterá-la.

## Reproduzir verificações

`npm ci --ignore-scripts`, `npm run build:dev`, `node scripts/verify-development.mjs`.
SQL de instalação e testes em `supabase/sql/`; executar exclusivamente no projeto de desenvolvimento. Testes SQL usam a conta de homologação existente apenas dentro de uma transação revertida. Não executar em produção.
