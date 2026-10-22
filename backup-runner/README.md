# Backblaze B2 — Garagem Grau Car DEV

**Estado: código preparado e testes locais aprovados; integração externa ainda não ativada.**
O painel B2 reteve o navegador na verificação Cloudflare. Não foi possível confirmar conta, criar bucket/chave, configurar segredos, executar pg_dump remoto ou enviar backup real. Nenhuma contratação foi realizada.

## Escopo e execução

Exclusivo de `hgmmabtixqaztuswmivv`, com PostgreSQL 17. A rotina é de leitura no Supabase e escrita somente no bucket dedicado B2. Não altera produção nem habilita notificações.

1. Confere vínculo do endereço PostgreSQL com o projeto de desenvolvimento e exige TLS com verificação do certificado.
2. Lista buckets e objetos do Supabase Storage; baixa as imagens/anexos com uma chave de servidor mantida em segredo.
3. Executa pg_dump em formato custom dos schemas `public`, `private`, `auth` e `storage`, preservando dados, funções, triggers, policies e ACLs presentes nesses schemas. Verifica se pg_restore consegue ler o arquivo.
4. Confere se o inventário de Storage mudou durante a cópia; se mudou, falha em vez de declarar sucesso.
5. Empacota dump, metadados dos buckets e manifesto com os hashes de cada arquivo. Os nomes originais e informações de clientes ficam dentro do pacote criptografado.
6. Criptografa localmente com AES-256-GCM e chave de 32 bytes. Envia ao B2 privado, com criptografia adicional do provedor. Não imprime credenciais nem dados.
7. Baixa integralmente o arquivo enviado, confere SHA-256, descriptografa e compara o pacote. Esse teste de integridade **não equivale a restaurar uma base completa**.

A senha do banco e a chave de criptografia nunca devem entrar no código, frontend, chat ou artefatos do GitHub. Guarde uma segunda cópia da chave de criptografia em cofre seguro: perdê-la impede recuperar os backups.

## Conta B2 e destino a provisionar

- Bucket exclusivo, privado (`allPrivate`); nome planejado `graucar-dev-backups-hgmmabtixqaztuswmivv`, sujeito à disponibilidade.
- Prefixo fixo: `graucar-dev/hgmmabtixqaztuswmivv/`.
- Chave exclusiva, restrita a esse bucket e prefixo, com `listBuckets`, `readFiles` e `writeFiles`. `listFiles`/`readBuckets` podem ser incluídas se exigidas pelo console. Sem exclusão de arquivos, gerenciamento de chaves/buckets ou bypass de retenção. A rotina rejeita credenciais amplas.
- Lifecycle exatamente nesse prefixo: `daysFromUploadingToHiding: 30`, `daysFromHidingToDeleting: 1`. Mantém 30 dias de cópias visíveis; a exclusão física pode ocorrer após o dia adicional e o processamento do provedor. A rotina não apaga arquivos diretamente.
- Não ativar Object Lock de compliance sem uma revisão separada do prazo e da cobrança.
- Conferir limites e alertas de cobrança na conta antes da ativação. A franquia gratuita não garante custo zero: há volume acumulado, recuperação e eventual uso por outros dados da conta.

## Executor privado separado

Copiar o **conteúdo desta pasta** para a raiz de um repositório GitHub **privado e separado**, por exemplo `graucar-dev-backup-runner`. Não instalar o workflow na branch principal da aplicação: ela publica produção.

O template `.github/workflows/backups.yml` prepara execução às **03:30, horário de São Paulo/Macapá**, e execução manual. O workflow só funciona quando instalado na branch padrão do repositório separado e a variável `ENABLE_DEV_BACKUPS` é `true`. **Nenhum desses passos foi ativado nesta entrega.**

Secrets necessários no executor:

| Nome | Conteúdo |
|---|---|
| `GRAUCAR_DEV_DATABASE_URL` | Conexão PostgreSQL privada do desenvolvimento: direta ou Session Pooler, com senha. Não usar Transaction Pooler. |
| `GRAUCAR_DEV_SERVICE_ROLE_KEY` | Chave de servidor do projeto DEV; usada apenas para cópia dos arquivos. |
| `GRAUCAR_BACKUP_ENCRYPTION_KEY` | 32 bytes aleatórios codificados em Base64, com cópia de recuperação em cofre. |
| `GRAUCAR_B2_KEY_ID` | Identificador da chave restrita B2. |
| `GRAUCAR_B2_APPLICATION_KEY` | Segredo da chave restrita B2. |

Variables necessárias: `GRAUCAR_B2_BUCKET_ID`, `GRAUCAR_B2_BUCKET_NAME`. Manter `ENABLE_DEV_BACKUPS=false` até validar tudo e revisar custos. Credenciais do backup pertencem ao executor, não às Edge Functions e nunca ao navegador da aplicação.

Limite inicial por execução: pacote comprimido de 256 MiB; cópias maiores falham para revisão. O limite não substitui controles de cobrança do provedor. Falhas deixam o workflow vermelho e não geram logs com dados/credenciais; habilitar notificações de falha do GitHub na conta do responsável.

## Recuperação e teste pendente

`python recover.py arquivo.gcb NOVO_DIRETORIO_PRIVADO` descriptografa, valida os hashes e a leitura do dump, e só então disponibiliza os arquivos. Não se conecta a banco e não altera dados.

Um teste completo ainda precisa de uma instância Supabase de homologação separada, compatível e descartável. Instalar extensões e roles necessárias; revisar o plano de restauração dos schemas gerenciados `auth` e `storage`; restaurar o dump sem sobrescrever o projeto de origem; recriar/copiar os objetos por bucket/nome indicados no manifesto; testar login, RLS, clientes, pagamentos e acesso aos anexos. Só marcar recuperação aprovada depois desse teste. O backup não contém segredos de Edge Functions, configurações do projeto/servidor, definições de roles globais ou segredos do Vault. Guardar configurações declarativas no Git e segredos em cofre separado.

## Testes locais

`python -m unittest discover -s tests -v`

Dez cenários aprovados com dados e respostas de API simulados: ida/volta AES-GCM; adulteração; chave errada; cabeçalho inválido; bloqueio de produção/hosts falsos; TLS; envio/baixa B2; bucket público; credencial irrestrita; corrupção remota. Não foram chamados serviços reais nesses testes.
