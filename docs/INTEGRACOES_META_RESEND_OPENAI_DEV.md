# Integrações de desenvolvimento — Meta, Resend e OpenAI

Projeto isolado: Supabase `hgmmabtixqaztuswmivv`; branch `desenvolvimento-modernizacao`.
Não instalar segredos em arquivos `VITE_*`, GitHub, SQL, console ou navegador.

## Estado verificado em 22/10/2026
- Vercel Preview branch: apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` foram encontrados, com valores ocultos. Não há variáveis de Meta, Resend ou OpenAI nesse escopo.
- Supabase Edge Functions anteriores: somente `operational-insights-dev`; agora criadas `integrations-gateway-dev` e `notification-delivery-dev` com `verify_jwt=true`.
- Ferramentas conectadas não expõem uma API de listagem/configuração de segredos das Edge Functions; portanto, **não foi possível confirmar se as credenciais dos três provedores já existem no ambiente Supabase**. O painel de Integrações consulta a presença delas em tempo de execução após login gestor.
- Security Advisor: zero alertas no momento da consulta.

## Credenciais a configurar como segredos no Supabase DEV
- OpenAI: `OPENAI_API_KEY` (obrigatório); `OPENAI_MODEL` (opcional, padrão `gpt-4.1-mini`).
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (endereço de domínio verificado).
- Meta WhatsApp Cloud API: `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`, `META_TEMPLATE_NAME` (template aprovado); opcionais `META_TEMPLATE_LANGUAGE=pt_BR`, `META_GRAPH_VERSION=v22.0`.
- `ENABLE_LIVE_NOTIFICATIONS_DEV`: **não definir como true até homologar**. A ausência do segredo mantém envio real desativado.
- Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no runtime; verificar presença no painel sem copiar valores.

## Componentes
- `integrations-gateway-dev`: JWT + validação do usuário no Auth + perfil gestor. `action=status` retorna apenas booleanos sobre credenciais, sem revelar valores. `action=ask` envia somente a pergunta fornecida à API Responses da OpenAI (`store:false`) se a chave existir. Não consulta dados de clientes, financeiro nem executa operações.
- `notification-delivery-dev`: `action=preview` verifica consentimento e credenciais sem enviar; `action=send` só permite envio quando `ENABLE_LIVE_NOTIFICATIONS_DEV=true` e há credenciais. Antes de enviar, revalida opt-in; bloqueia duplicação concorrente por estado `processing`. Meta usa template configurado, Resend usa cabeçalho de idempotência. **Não há worker cron automático**; não há botão de envio no painel.
- `supabase/modernizacao/05_notification_delivery_dev.sql` adiciona estado `processing`, aplicado apenas em desenvolvimento.
- Interface `Integrações` visível somente para gestor, com status de provedores, IA para perguntas gerais e prévia de fila. Destinos são mascarados.

## Limites e riscos pendentes
- Teste real de conexão aos provedores não executado: credenciais não acessíveis por ferramentas, e o gateway exige JWT de gestor.
- Provedores podem exigir domínio verificado, número WhatsApp aprovado, template aprovado, limites de conta, faturamento e permissões de API.
- Envio real continua desativado; testes de ponta a ponta com destinatários de teste e contas reais ainda pendentes.
- O fluxo de mensagens automáticas exige gatilhos de negócio, retentativas com backoff, limites por canal, logs de entrega e tratamento de falhas ambíguas antes de ativação.
- Consentimento precisa ser registrado de forma verificável e rechecado imediatamente antes de enviar. Uma revogação concorrente à requisição externa não garante cancelamento de mensagem já entregue ao provedor.
- A resposta de IA pode conter erros; não fornecer dados pessoais no prompt.
- PWA, backup/restore, homologação por perfil e UI completa ainda pendentes.

## Homologação recomendada
1. Entrar com conta de administrador no Preview; abrir Integrações e clicar Verificar provedores e fila.
2. Configurar segredos faltantes **somente no Supabase DEV**; conferir presença no painel sem expor chaves.
3. Testar IA com pergunta genérica, sem dados pessoais.
4. Criar destinatário de teste, registrar consentimento, criar notificação de teste na fila, consultar Prévia; verificar que nenhuma mensagem foi enviada.
5. Ativar envio real somente após validar Meta/Resend, com teste controlado e aprovação específica do destinatário.
6. Executar `npm ci`, `node --test tests/*.test.js`, `npm run build` e testes de navegador com quatro perfis.
