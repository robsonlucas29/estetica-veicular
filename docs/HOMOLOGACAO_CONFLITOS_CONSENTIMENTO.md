# Homologacao da etapa — conflitos, consentimento e isolamento

Data: 22/10/2026.

## Implementado nesta etapa
- Comparacao de metadados (somente leitura) entre Supabase oficial e desenvolvimento para sete tabelas centrais: appointments, employees, payments, profiles, service_orders, service_types, vehicles. Colunas e tipos observados sao equivalentes, embora ordem e restricoes nao tenham sido comparadas integralmente.
- Agenda visual: deteccao de possivel sobreposicao de funcionario usando janela estimada de 60 minutos. Alertas informativos, sem bloquear agendamentos nem alterar o banco.
- Testes unitarios para agrupamento de multiplos servicos, status cancelado/concluido, sobreposicao e multiplos funcionarios.
- Banco de desenvolvimento: tabela notification_consents com autorizacoes separadas para email e WhatsApp, padrao opt-out.
- Trigger que impede inserir item na fila notification_outbox sem consentimento registrado para o canal solicitado.
- Interface de consentimentos no menu gerencial, sem envio real de notificacoes.
- Teste SQL sintetico com rollback: consentimento presente permite enfileirar; consentimento ausente impede enfileirar.
- Supabase Security Advisor sem alertas. 22 tabelas publicas, todas com RLS.

## Pendencias e riscos
- Duracao real de servico ainda nao integra a deteccao de conflitos; 60 minutos e somente hipotese.
- Interface ainda nao testada com conta real de desenvolvimento, incluindo permissoes de gerente/administrador.
- A autorizacao e registrada manualmente; exige comprovacao da origem do consentimento.
- O registro do consentimento nao e envio de mensagem; fila permanece sem consumidor e sem provedores.
- Backups e restauracao ainda nao testados.
- Assistente IA ainda nao integrado; dependente de backend, segredos e politica de dados.
- PWA ainda nao homologado nos dispositivos.
- Revisao de todas as constraints e politicas do banco legado, testes end-to-end e performance continuam pendentes.

Nao executar deploy em producao nem copiar dados reais para testes.
