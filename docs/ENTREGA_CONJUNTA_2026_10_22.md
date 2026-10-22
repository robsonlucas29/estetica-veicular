# Modernizacao — entrega conjunta de 22/10/2026

## Codigo integrado na branch de desenvolvimento
- Estoque: campo de unidade de medida e estoque minimo, contagem e destaque de itens abaixo do limite.
- Financeiro: acao com confirmacao para marcar despesa pendente como paga, preenchendo data do pagamento. O painel de fluxo de caixa existente consulta despesas pagas.
- Central de alertas operacionais: itens com saldo baixo, despesas vencidas e quantidade de agendamentos do dia. Trata-se de regras deterministicas; **nao e assistente de IA**.
- Consentimentos: trigger no banco que cancela automaticamente notificacoes pendentes quando o cliente revoga consentimento do canal. Nenhum envio externo foi ativado.
- Teste SQL sintetico com rollback comprovou cancelamento de mensagem pendente apos revogacao.
- Security Advisor do Supabase de desenvolvimento retornou zero alertas.

## Limitacoes que impedem conclusao integral
- A interface nao foi homologada com usuarios reais de teste por perfil; deploy READY significa build concluido, nao funcionalidade aprovada.
- Agenda e alertas usam heuristicas e filtros simples, nao um motor de planejamento com duracao real de servico.
- Assistente IA requer definicao de provedor, credenciais no servidor, politica de dados, ferramentas e testes de permissao.
- Mensagens automaticas requerem provedor e templates autorizados, consentimento validado novamente no momento de envio, opt-out e fila com retries.
- PWA exige icones PNG, validacao de instalacao e atualizacao em dispositivos.
- Backups exigem verificar configuracao/retencao no painel e ensaio de restauracao isolado.
- Gestao financeira ainda nao tem conciliacao integral, relatorios paginados e contabilidade.
- UI geral, testes end-to-end, performance, acessibilidade e auditoria de todas as regras ainda precisam de homologacao.
- Nunca promover para main ou banco de producao sem autorizacao expressa.

## Validacao sugerida
1. Usar contas de teste com cada perfil no Preview.
2. Cadastrar material com estoque minimo e verificar alerta apos saida.
3. Cadastrar despesa pendente, marcar como paga e atualizar fluxo de caixa.
4. Registrar consentimento de teste, simular enfileiramento e revogar.
5. Verificar isolamento das variaveis de ambiente Preview/Production e confirmar zero dados oficiais no projeto dev.
6. Executar npm ci, npm test e npm run build em CI; testar fluxos manualmente.
