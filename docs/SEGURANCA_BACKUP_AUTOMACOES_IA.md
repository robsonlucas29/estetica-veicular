# Segurança operacional, backups, automações e IA — homologação

## Situação
Somente desenvolvimento. Nenhum segredo de provedor de IA, WhatsApp ou e-mail deve ser incluído no frontend ou em commits.

## Backups
- [ ] Confirmar política de backups automáticos do plano Supabase e período de retenção na conta de desenvolvimento.
- [ ] Definir política de recuperação para banco e Storage; o backup do banco não implica backup de arquivos.
- [ ] Testar restauração em ambiente temporário, usando apenas dados sintéticos.
- [ ] Documentar RPO e RTO aprovados.
- [ ] Não executar restore, dump de dados reais ou alteração do projeto oficial sem autorização específica.

## Automação de atendimento
- [ ] Usar Edge Functions com credenciais de provedores apenas em secrets do servidor.
- [ ] Criar outbox idempotente com chave única por evento/canal/destinatário, retries e limites.
- [ ] Respeitar consentimento do cliente e horário de envio.
- [ ] Não enviar mensagens em duplicidade por atualizações repetidas do mesmo serviço.
- [ ] Implementar opt-out e auditoria dos envios.
- [ ] Homologar provedores e templates de mensagens antes de ativar.

## Assistente IA
- [ ] Definir tarefas autorizadas: dúvidas de agenda, análise de produção, resumo de estoque.
- [ ] Aplicar controle de acesso por perfil também nas ferramentas e no backend.
- [ ] Não enviar dados pessoais ou financeiros a um provedor externo sem base legal e revisão LGPD.
- [ ] Não permitir que respostas da IA alterem caixa, estoque, clientes ou agendamentos sem confirmação e autorização.
- [ ] Proteger segredos em Edge Functions; implementar limites de custo e registros sem dados sensíveis.
- [ ] Validar resultados com dados sintéticos antes de disponibilizar.

## PWA
- [x] Manifesto e ícone SVG.
- [x] Service worker mínimo sem interceptar nem armazenar dados privados.
- [ ] Gerar ícones PNG 192/512 e variante maskable para compatibilidade ampla.
- [ ] Testar instalação em Android, iOS e desktop.
- [ ] Validar atualização de versão, logout e ausência de dados sensíveis em caches.
- [ ] Não anunciar funcionamento offline sem implementar e testar estratégia segura.

## Produção
A branch main, o Supabase oficial e o domínio oficial permanecem fora do escopo de alterações.
