# Garagem Grau Car 096 — ambiente de desenvolvimento

Branch isolada: desenvolvimento/homologacao-integracoes. Não mesclar em produção antes de homologar.

## Executar

- `npm ci --ignore-scripts`
- `npm run dev` para uso local.
- `npm run build:dev` para gerar a versão de testes em `dist/`.
- Na Vercel: publicar como Preview. A configuração impede publicação desta branch como produção e usa o banco de desenvolvimento nos previews.

O destino de desenvolvimento é fixado em `src/development-config.js` com uma chave pública de frontend. Nenhuma chave OpenAI, Resend, Meta ou service_role deve ser adicionada a arquivos do frontend.

## Implementado nesta branch

- Código original preservado: clientes, veículos, serviços, equipe, agendamentos, histórico, caixa, usuários e relatórios.
- Banner de desenvolvimento e sessão separada do site em produção.
- Agenda visual e produção agrupadas por atendimento, com atualização a cada 20 segundos.
- Estoque: cadastro de material, entradas/saídas e histórico, com saldo atualizado pelo trigger transacional do banco.
- Financeiro: despesas, baixa de pagamento e resumo mensal separado do caixa original.
- Fidelidade: contas, créditos/resgates de pontos, histórico e níveis VIP calculados pelo banco.
- Assistente IA via integrations-gateway-dev e resumo operacional sem envio de dados à IA.
- Integrações: status, registro de consentimentos e consulta da fila, sem botão de envio.
- Manifesto e instalação PWA em navegadores compatíveis. Não há cache de dados de clientes nem funcionamento offline.
- Funções legadas de notificação e candidatura são simuladas no frontend de desenvolvimento.

## Validação realizada

- Build de desenvolvimento completo.
- OpenAI testada no backend: HTTP 200 após recarga.
- Resend testado com corpo vazio: HTTP 422 missing_required_field, sem destinatário e sem envio.
- ENABLE_LIVE_NOTIFICATIONS_DEV=false confirmado.
- Segurança do banco: sem alertas no advisor.

## Pendências antes de aprovar

1. Liberar o acesso à equipe Vercel lucas2952001-8185s-projects para publicar Preview.
2. Criar o primeiro usuário de desenvolvimento e atribuir administrador por operação autenticada de proprietário. O banco está vazio; não há conta/senha padrão e usuários de produção não foram copiados.
3. Homologar todos os fluxos autenticados pela interface, incluindo cadastro/edição, movimentações, anexos e relatórios. Build aprovado não significa homologação funcional concluída.
4. Configurar WhatsApp por último.
5. Backup automático externo e fechamento do caixa no servidor ainda precisam de implementação. O fechamento atual depende do aplicativo aberto às 23:59.
6. Agenda visual não muda horários por arraste e não calcula conflitos automaticamente nesta versão. Usar Agendamentos para alterações.
7. As telas novas consultam até 1000 registros por conjunto. Implementar paginação antes de ampliar o volume de homologação.

Não foram alterados banco de produção, domínio do site ou envios reais.
