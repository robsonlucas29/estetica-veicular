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

1. Acesso restabelecido. Homologação visual de cliente, categoria, veículo, serviço, equipe, agendamento, conclusão, caixa, estoque, despesas, pontos e upload de imagem executada com dados fictícios. PDF e Excel do caixa gerados e conteúdo conferido. Resta verificar criação de novos usuários (senha deve ser criada pelo usuário), perfil de cada login. A transferência do anexo na conclusão também foi verificada.
2. WhatsApp segue sem credenciais: login da Meta em ciclo. Não foi contornado nem ativado envio real.
3. Backup: o painel confirmou plano Free sem backups. Nenhum backup externo foi configurado ou restauração completa foi alegada. Necessário destino externo/credenciais próprias para backup ou plano compatível; código no GitHub não é backup dos dados e anexos.
4. Entrada em produção continua fora desta execução, respeitando a instrução original de não alterá-la.

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

## Backblaze B2 — preparação

Implementação isolada em `backup-runner/`: cópia de banco e Storage, AES-256-GCM antes do envio, bucket privado e chave restrita, validação do download remoto e template de execução diária em repositório privado separado. Dez testes locais com API simulada passaram. O painel B2 bloqueou este navegador na verificação Cloudflare. Conta/bucket/chave/segredos e executor ainda não foram provisionados; nenhum backup real, agendamento ativo ou teste de restauração completa foi alegado. Detalhes e exclusões estão no README da rotina.
