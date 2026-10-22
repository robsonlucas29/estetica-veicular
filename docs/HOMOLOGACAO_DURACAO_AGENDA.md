# Homologacao de agenda com duracoes configuraveis

Projeto isolado: Supabase desenvolvimento hgmmabtixqaztuswmivv.
Branch isolada: desenvolvimento-modernizacao.

## Entregas
- Adicionada coluna service_types.duration_minutes com default 60, CHECK 5..720 no banco de desenvolvimento.
- Gestores (administrador e gerente) podem configurar a duracao estimada por servico na Agenda Visual.
- Deteccao de conflito calcula intervalo de inicio e fim de cada atendimento; servicos do mesmo appointment_group_id somam duracoes.
- A agenda nao altera nem remarca automaticamente agendamentos; alertas sao consultivos.
- Dois testes adicionais cobrem duracao acima de 60 minutos e atendimento composto de multiplos servicos.
- Migration versionada em supabase/modernizacao/04_duracao_servicos_dev.sql.
- Auditor Supabase Security Advisor sem alertas; 22 tabelas publicas com RLS.

## Pendente para aceitar
- Validar em navegador real que service_types e appointments sao carregados corretamente.
- Confirmar duracoes em agendamentos de funcionarios simultaneos, grupos de servicos e intervalos entre atendimentos.
- Revalidar as permissoes de gerente, administrador e perfis de leitura com contas de teste.
- Executar testes CI e testes ponta a ponta. Build READY isoladamente nao prova ausencia de regressao.
- Nao modificar producao sem homologacao e autorizacao explicita.

## Outros grandes itens ainda pendentes
- IA com provedor e credenciais de servidor, politica LGPD e testes de autorizacao.
- Envio real de email/WhatsApp com provedor, worker, consentimento no momento do envio, retentativas e observabilidade.
- Backup/restore de banco e Storage, PWA multiplataforma, modernizacao global de UI, conciliacao financeira e regressao completa.
