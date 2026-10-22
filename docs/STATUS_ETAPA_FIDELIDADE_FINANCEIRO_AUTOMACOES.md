# Etapa de desenvolvimento — fidelidade, financeiro e notificacoes

Projeto Supabase exclusivo: `hgmmabtixqaztuswmivv`.
Branch exclusiva: `desenvolvimento-modernizacao`.

## Implementado e verificado
- Classificacao automatica VIP por saldo: regular (0-299), prata (300-999), ouro (1000-1999), diamante (2000+). Trigger em `private.recalculate_vip_tier`.
- Teste transacional sintetico: 350 pontos => prata, com rollback.
- Restricao de saldo inicial zero ao criar conta de fidelidade ou material pelo aplicativo.
- Bloqueio de edicao direta de saldo de pontos e estoque, preservando operacoes via trigger.
- Novo resumo financeiro por periodo: pagamentos recebidos, despesas pagas, saldo e exportacao CSV. Consulta limitada a 1000 registros por conjunto, sem paginacao completa.
- Fila `notification_outbox` com unicidade de evento, canal e destinatario; RLS habilitada e leitura restrita a administrador e gerente.
- NENHUM trabalhador/worker de envio foi ativado. Nao existe disparo de mensagens a clientes.
- Auditoria Supabase: zero alertas de seguranca; 21 tabelas publicas, todas com RLS; 63 politicas publicas; 2 tabelas incluidas na publicacao Realtime.
- Preview Vercel com o codigo financeiro no commit `5e5343f3` marcado READY.

## Limitacoes e proximas entregas
- Necessario confirmar login e comportamento da UI em navegador real com contas de teste.
- Testes RLS de cada perfil com dados de teste nao concluidos.
- Fluxo financeiro nao concilia automaticamente com fechamento de caixa e nao faz paginacao integral.
- VIP nao atribui pontos automaticamente apos conclusao de servico; requer regra de negocio aprovada.
- Fila de notificacoes ainda nao tem consumidor, templates homologados, consentimento ou provedores.
- Assistente IA nao integrado; nao cadastrar credenciais no cliente.
- PWA: faltam icones PNG, testes multiplataforma e estrategia de atualizacao segura.
- Backups: ainda falta verificar configuracao e realizar ensaio de restauracao.
- Modernizacao visual global e testes de regressao completos pendentes.

Nenhuma mudanca na branch main, Supabase oficial ou deploy de producao.
