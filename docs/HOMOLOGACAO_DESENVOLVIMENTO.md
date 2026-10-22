# Homologacao segura — Garagem Grau Car 096

> Somente branch `desenvolvimento-modernizacao` e Supabase `hgmmabtixqaztuswmivv`.

## Ambiente

- [x] Branch isolada no GitHub
- [x] Variaveis Vercel de Preview especificas da branch (URL e chave publica do banco de desenvolvimento)
- [x] Bloqueio no frontend contra conexao ao Supabase oficial fora dos dominios oficiais
- [x] Tabelas legadas criadas no banco de desenvolvimento (sem dados de producao)
- [x] RLS nas tabelas e politicas iniciais por perfil
- [x] Bucket `service-images` criado no ambiente de desenvolvimento
- [x] Estruturas de fidelidade e estoque criadas sem acesso da API para usuarios finais
- [ ] Confirmar novo Preview construido apos configuracao das variaveis
- [ ] Verificar funcionamento de autenticacao e autorizacao com usuarios exclusivamente de teste
- [ ] Testar cadastro, edicao, agendamento, historico, caixa e anexos
- [ ] Revisar diferencas de constraints, funcoes e storage entre os ambientes
- [ ] Testar politicas RLS com cada perfil, inclusive tentativas negadas
- [ ] Rever privacidade das imagens do bucket publico
- [ ] Executar regressao completa antes de qualquer merge em main

## Regras

Nao copiar usuarios, senhas, clientes, veiculos, imagens nem pagamentos reais para o ambiente de testes. Nao reutilizar credenciais de producao. Nao fazer merge ou promover deploy sem autorizacao expressa.
