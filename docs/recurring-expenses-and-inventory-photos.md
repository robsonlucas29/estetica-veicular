# Despesas fixas e fotos do estoque

Financeiro permite despesas avulsas e recorrências mensais, com primeira e última competência opcional, dia de vencimento e observações. A rotina diária das 00:20 de Macapá mantém lançamentos até doze meses à frente. Vencimentos nos dias 29–31 são ajustados ao último dia de meses mais curtos. A geração é idempotente.

A edição pode afetar somente o mês, os meses pendentes seguintes ou todos os meses pendentes. Alterações em série substituem exceções pendentes do escopo; parcelas pagas e canceladas ficam preservadas. Para corrigir uma parcela paga é preciso reabri-la, removendo sua baixa até novo pagamento. Há controle de concorrência por versão e auditoria. Encerrar a série cancela somente parcelas futuras pendentes; reativar restaura apenas cancelamentos causados pelo encerramento.

Os indicadores separam competência de fluxo de caixa: recebido e pago usam datas efetivas; pendências usam a competência selecionada. A geração de parcelas não cria pagamentos.

Fotos podem ser anexadas ao cadastrar ou posteriormente, trocadas e removidas. JPG, PNG e WebP de até 5 MB são validados por MIME e assinatura. Armazenamento privado com acesso restrito a administrador/gerente e URLs temporárias. O saldo de estoque continua protegido pelo fluxo de movimentação.

Verificação: scripts/verify-inventory-photos.mjs e supabase/sql/verify-recurring-expenses-and-photos.sql. O segundo usa dados sintéticos e ROLLBACK, cobrindo recorrência, reajustes, encerramento, reativação, permissões e concorrência.
