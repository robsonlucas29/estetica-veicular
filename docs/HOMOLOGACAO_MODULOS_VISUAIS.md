# Homologacao — segunda rodada de interfaces

Branch: `desenvolvimento-modernizacao`. Projeto Supabase: `hgmmabtixqaztuswmivv`.

## Implementado
- Agenda visual mensal com agrupamento por `appointment_group_id`, filtro de atendimentos nao concluidos e atalho para agendamento existente.
- Painel de producao do dia, com agrupamento por atendimento, etapas e total de servicos concluidos.
- Fidelidade: cadastro de conta e lancamento manual de pontos.
- Estoque: cadastro, entradas, saidas e historico.
- Despesas: cadastro e listagem inicial.
- Movimentacoes de estoque e pontos em triggers transacionais com checagem de saldo nao negativo.
- Menu integrado e CSS responsivo, preservando a identidade existente.
- Manifesto web vinculado no HTML; ainda faltam icones apropriados, service worker e testes de instalacao.
- Auditor de seguranca Supabase sem lints apos a rodada.

## Limites conhecidos
- O painel de producao atualiza seu relogio a cada 30 segundos, mas NAO faz sincronizacao automatica dos registros; depende do carregamento dos dados do aplicativo. Nao apresentar como tempo real validado.
- A agenda visual e apenas de consulta, sem arrastar/soltar ou deteccao de conflitos.
- A fidelidade nao possui regras automaticas de pontuacao ou calculo automatico de VIP.
- Despesas ainda nao incluem conciliacao, fluxo de caixa completo ou relatorios novos.
- O aplicativo instalavel esta incompleto.
- Automacoes de atendimento e assistente IA ainda nao implementados.
- Falta testar com usuarios de teste por perfil e executar regressao funcional completa.
- Nenhuma dessas alteracoes foi promovida a producao.

## Verificacao necessaria
1. Acessar Preview com conta de teste criada no projeto de desenvolvimento.
2. Verificar login, menus e RLS de cada perfil.
3. Cadastrar dados sinteticos, agendar, concluir e verificar historico.
4. Testar entrada, saida e saldo insuficiente em estoque.
5. Testar pontos positivos, resgates e saldo insuficiente em fidelidade.
6. Testar despesas, anexos e restricao financeira do Administrativo.
7. Revisar warnings de desempenho, acessibilidade e backups.
8. Somente propor merge apos testes completos e autorizacao expressa.
