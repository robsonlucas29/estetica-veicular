# Fidelidade, preferências e conferência financeira — 26/10/2026

## Fidelidade

- Adesão automática para todos os clientes, inclusive novos cadastros.
- Regra inicial: 1 ponto por R$ 1 final cobrado em cada serviço concluído. Desconto já está embutido em `charged_amount`; valor zero rende zero. Frações são truncadas por serviço.
- O administrador pode alterar pontos por real e limites VIP. Nova taxa vale para novos serviços; cada crédito anterior conserva a taxa original ao ser corrigido.
- Histórico de serviços concluídos apurado uma vez. Créditos manuais anteriores preservados. Repetir a sincronização não duplica pontos.
- Alteração de valor, cancelamento, exclusão e troca do cliente do veículo ajustam o saldo. Estorno após um resgate pode gerar ajuste pendente, compensado em créditos futuros. Resgates sem saldo são rejeitados.
- VIP por atendimentos distintos (grupo de serviços conta uma visita), nos últimos 90 dias de Macapá: Regular abaixo de 3, Prata a partir de 3, Ouro a partir de 6, Diamante a partir de 10. Limites e janela editáveis. Resgates não alteram categoria. A visão consulta a recorrência atual; o saldo materializado da categoria é atualizado diariamente às 00:10 de Macapá.
- Benefícios: 1.000 lavagem simples sem cera; 1.350 simples com cera; 1.700 técnica; 2.050 técnica do motor ou baixo; acima de 2.450 (a partir de 2.451) desconto em serviço maior.
- Desconto maior não teve valor definido pelo proprietário: exige observação do desconto acordado. Resgate movimenta pontos, sem inventar percentual nem lançar desconto financeiro automaticamente.

## Preferências de comunicação

- E-mail e WhatsApp inicialmente marcados no cadastro e em Integrações, preservando recusas já registradas.
- Preferências ficam em `clients` e são espelhadas transacionalmente em `notification_consents` nos dois sentidos. Valores padrão são identificados como preferência da gestão, não como comprovação individual de consentimento.
- Alterar uma preferência não envia mensagens. WhatsApp continua sem integração/sem envio real. E-mail de conclusão permanece ativo em produção; DEV permanece bloqueado.

## Valores

Dashboard, Caixa e Financeiro usam a mesma soma de `payments.amount`, por `paid_at` na zona America/Belem (Macapá). Pagamentos parciais, divididos em formas ou em dias diferentes são contados uma vez cada. Serviços concluídos têm indicador separado com `charged_amount`, preservando zero sem substituir pelo preço de tabela. Não foram criados pagamentos para forçar igualdade com serviços realizados. Fechamentos históricos não foram sobrescritos; diferenças para o critério atual continuam visíveis para conferência.

## Navegação

Agenda visual incorporada em Agendamentos, como segunda aba, preservando o formulário ao alternar. Fidelidade e clientes VIP, Assistente de IA, Integrações, Financeiro e Estoque ficam na parte inferior do menu. Auditoria permanece por último. Permissões de acesso preservadas.

## Validação

- Testes transacionais sintéticos em DEV, com rollback: adesão/pontos automáticos, preferências nos dois sentidos, arredondamento, idempotência, correções, cancelamento, resgate, estorno após resgate, ajuste pendente, nova taxa vs taxa original, serviço gratuito, agrupamento de visitas, recorrência, limite temporal, conciliação do extrato e rejeição de créditos diretos.
- Testes JS de recebimentos/serviços, múltiplos pagamentos, virada do mês às 03:00 UTC, zero, cancelamento e faixas de benefício.
- Sete módulos renderizados e build DEV verificado.
- Migração aplicada em DEV e produção; 35 contas e 236 créditos de origem apurados na consulta de validação; divergências entre extrato e saldo: zero. Produção continua recebendo lançamentos reais, então quantidades podem crescer.
- Auditoria de segurança sem novos alertas de banco/RLS; aviso preexistente de senha vazada do Auth no plano atual permanece fora desta alteração.

## Atualização — resgate integrado e participação opcional

Esta seção substitui a adesão obrigatória e o resgate avulso descritos acima.

- `clients.loyalty_enabled` é editável no cadastro, ao lado de e-mail e WhatsApp, com padrão marcado para novos clientes. Os nove nomes empresariais solicitados tiveram seus dez cadastros desativados (LOCALIZA ALUGUEL possui dois). Correspondência por nome completo normalizando acentos, caixa e espaços; nenhum outro cliente foi excluído por suposição.
- Clientes desativados ficam fora da lista de pontos, não recebem novos créditos e não podem reservar benefícios. Saldo/extrato anteriores são preservados para auditoria e eventual reativação. Desativar a fidelidade não altera preferências de contato.
- Tabela de participantes e seletor de clientes ordenados por saldo decrescente; benefícios na tabela também em ordem decrescente. Só clientes elegíveis para pelo menos um benefício aparecem no formulário. Benefícios acima do saldo ficam indisponíveis. Saldo/participação/dívida são conferidos novamente sob bloqueio no servidor.
- `create_loyalty_redemption` cria reserva de pontos e agendamento em uma transação. Campos: benefício, veículo do cliente, lavador(es), data, hora em 24h e status. Benefícios em serviço têm cobrança zero, sem campo de desconto; para 2.050 pontos escolhe-se motor ou baixo. Benefícios em desconto exigem serviço válido para a categoria do veículo, percentual/valor coerentes e forma de pagamento.
- Serviços gratuitos específicos da categoria são criados no catálogo como benefícios de fidelidade e não aparecem no seletor normal de novos agendamentos. A forma de pagamento Fideli­dade (resgate) registra apenas o valor zero; nenhum valor financeiro é inventado.
- Edição de um resgate em Agendamentos preserva cliente, veículo, benefício e condições reservadas, permitindo lavadores, data, hora, status e observação. Concluir usa o mesmo fluxo transacional do agendamento normal, com vínculo do resgate nos históricos de serviços/cliente/veículo e no histórico de resgates. Valores pagos em um benefício de desconto entram no Caixa/Financeiro como pagamentos reais e geram pontos somente pelo valor final cobrado; serviço gratuito rende zero.
- Pontos são reservados no agendamento, evitando múltiplos resgates do mesmo saldo. Cancelamento ou exclusão do agendamento antes da conclusão devolve uma única vez os pontos. A edição normal apaga/reinsere linhas, mas a conferência diferida distingue isso de uma exclusão definitiva. Exclusão posterior de serviço concluído não concede de volta um benefício já prestado.
- Créditos/reservas/estornos mantêm extrato conciliado. Requisição repetida com o mesmo identificador não debita novamente. Conflito de agenda desfaz o débito e o cadastro do resgate. O antigo RPC de débito avulso passa a rejeitar solicitações.
- Validação sintética transacional DEV, com rollback: cliente de 100 pontos rejeitado no benefício de 1.000; reserva/duplicação/conflito; proteção contra alteração de cobrança; edição sem devolução; conclusão e vínculos; devolução por exclusão; desconto de 20% em serviço de R$ 1.000, pagamento de R$ 800; exclusão/reativação no programa; bloqueio de créditos e reservas diretas; extrato conciliado. Testes JS/SSR verificam elegibilidade, ordenação, cliente excluído, campos e botão desativado. Nenhuma mensagem real foi enviada pelos testes.
