# Garagem Grau Car 096 — modernização segura

## Restrições
- Não alterar logomarca, cores e identidade visual.
- Não modificar a branch `main`, o Supabase oficial nem a publicação de produção.
- Implementar somente na branch `desenvolvimento-modernizacao` e no projeto Supabase `grau-car-desenvolvimento`.
- Não copiar dados pessoais ou financeiros reais para testes.
- Não conectar Preview ao banco oficial; validar isolamento antes de testes de escrita.

## Sequência de entregas
1. Reproduzir esquema atual no Supabase de desenvolvimento, revisando migrações e RLS.
2. Configurar variáveis Preview com URL e chave pública do Supabase de desenvolvimento.
3. Modernizar componentes existentes sem alterar logomarca, cores ou fluxos.
4. Agenda visual inteligente e painel de produção em tempo real.
5. Fidelidade/VIP e controle de estoque.
6. Gestão financeira avançada.
7. PWA instalável e automações de atendimento.
8. Assistente de IA com acesso mínimo e controles de custo.
9. Testes de permissões, regressão, desempenho, backups e plano de reversão.

## Critérios de aceite
- Build passa sem erros.
- Login e perfis preservados.
- Clientes, veículos, agendamentos, histórico, anexos, caixa, relatórios e auditoria continuam funcionando.
- Cada módulo novo possui testes de autorização e de integração.
- Deploy de produção apenas após validação explícita.

## Status
Plano registrado. Nenhuma alteração no banco ou produção foi realizada por este documento.
