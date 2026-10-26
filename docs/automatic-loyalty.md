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
