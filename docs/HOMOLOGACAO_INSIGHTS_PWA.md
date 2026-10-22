# Etapa de desenvolvimento: resumo protegido e instalacao PWA

## Concluido
- Implantada somente no Supabase de desenvolvimento a Edge Function `operational-insights-dev` (verify_jwt=true).
- Funcao exige JWT, verifica o usuario no Auth e restringe acesso aos perfis administrador/gerente.
- Usa a chave publica/anon com JWT do proprio usuario, preservando RLS. Nao utiliza service-role no frontend.
- Retorna resumo deterministico de estoque baixo, despesas vencidas e atendimentos do dia, com limite de 1.000 linhas por conjunto.
- Nao chama modelo de IA externo, nao modifica banco e nao envia notificacoes.
- Codigo da Edge Function versionado em `supabase/functions/operational-insights-dev/index.ts`.
- Central de alertas ganhou botao `Resumo seguro do servidor`, com mensagem de erro se a funcao nao responder.
- Adicionados testes estaticos de autorizacao e ausencia de escrita na funcao.
- Botao `Instalar aplicativo` no cabecalho aparece somente se o navegador oferecer o evento beforeinstallprompt; sem alegar suporte no iOS.
- Supabase Security Advisor sem alertas no momento da consulta.

## Nao concluido
- Integracao com modelo de IA externo: depende de provedor, chave segura, politica de tratamento de dados, custos, limites e testes.
- Automacao real de WhatsApp e email: depende de provedores e autorizacoes; a fila permanece sem worker de envio.
- Instalacao PWA em Android/iOS/desktop: ainda precisa de icones PNG/maskable e testes em dispositivos.
- Testes funcionais da Edge Function com contas reais de desenvolvimento e JWT validos.
- Backups e restauracao de banco e Storage; nenhum ensaio executado.
- Homologacao ponta a ponta dos quatro perfis, performance e regressao.
- Build READY nao substitui testes completos.

## Isolamento
Branch `desenvolvimento-modernizacao`, Supabase `hgmmabtixqaztuswmivv`; producao e main intactas.
