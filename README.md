# Estética Veicular v2.1 — Web + Desktop

Esta versão corrige o acesso ao sistema. Agora o painel **nunca abre sem login**.

## O que foi corrigido

- Login obrigatório com Supabase Authentication.
- Sessão persistente: se o usuário ainda estiver autenticado, continua conectado ao atualizar a página.
- Botão Sair encerra a sessão.
- Sem `.env` válido, o sistema mostra erro de configuração e não abre o painel.
- Gerente, Administrativo e Visualizador possuem permissões diferentes.
- Menus exclusivos do gerente ficam ocultos para os demais perfis.
- Regras de segurança também são aplicadas no banco de dados (RLS).
- O gerente cria novos usuários pela tela Usuários do próprio sistema.
- Auditoria é restrita ao gerente.

---

# PASSO A PASSO — PRIMEIRA INSTALAÇÃO

## 1. Instalar as dependências

Abra o CMD dentro da pasta do projeto e execute:

```bash
npm install
```

Depois execute:

```bash
npm run dev
```

Ainda não abra o sistema antes de concluir o Supabase abaixo.

## 2. Configurar o arquivo `.env`

Na pasta principal do projeto, crie um arquivo chamado exatamente:

```text
.env
```

Use o arquivo `.env.example` como modelo.

Conteúdo:

```text
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

Depois de salvar o `.env`, pare o servidor com `Ctrl + C` e execute novamente:

```bash
npm run dev
```

## 3. Criar as tabelas no Supabase

No Supabase, abra:

**SQL Editor > New query**

Abra o arquivo:

```text
supabase/schema.sql
```

Copie todo o conteúdo, cole no SQL Editor e clique em **Run**.

## 4. Criar o primeiro usuário

No Supabase, abra:

**Authentication > Users > Add user**

Crie o seu usuário com e-mail e senha.

## 5. Transformar esse usuário em Gerente

Abra o arquivo:

```text
supabase/PRIMEIRO_GERENTE.sql
```

Troque as duas ocorrências de:

```text
SEU_EMAIL@EXEMPLO.COM
```

pelo mesmo e-mail que você acabou de cadastrar.

Copie o arquivo inteiro, cole no **SQL Editor** do Supabase e clique em **Run**.

No resultado deve aparecer seu usuário com:

```text
role = gerente
```

## 6. Fazer login

Volte ao sistema no navegador, normalmente:

```text
http://localhost:5173
```

Agora deve aparecer a tela **Acesso ao sistema**.

Entre com o e-mail e senha criados no passo 4.

## 7. Ativar a criação de usuários dentro do sistema

Para o botão **Usuários > Criar usuário** funcionar, publique a Edge Function que já está no projeto:

```text
supabase/functions/create-user/index.ts
```

Com o Supabase CLI instalado e autenticado, dentro da pasta do projeto execute:

```bash
npx supabase login
```

Depois vincule o projeto:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
```

O `SEU_PROJECT_REF` é a parte inicial da URL do seu projeto. Exemplo:

```text
https://abcdefghijk.supabase.co
```

Nesse caso o project ref é:

```text
abcdefghijk
```

Depois publique a função:

```bash
npx supabase functions deploy create-user
```

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas automaticamente pelo ambiente da Edge Function do Supabase.

Depois disso, faça login como Gerente e abra:

**Usuários > Nome > E-mail > Senha inicial > Perfil > Criar usuário**

Os novos usuários não precisam ser cadastrados manualmente no painel Authentication.

---

# Perfis de acesso

## Gerente
Acesso total a usuários, clientes, veículos, serviços, histórico, agendamentos, equipe, comissões, caixa, relatórios e auditoria.

## Administrativo
Pode trabalhar com clientes, veículos, agendamentos e histórico/execução dos serviços, sem acesso às áreas administrativas exclusivas do gerente.

## Visualizador
Acesso de consulta, sem permissão para alterações.

---

# Aplicativo Desktop

Para testar como aplicativo desktop:

```bash
npm run desktop:dev
```

Para gerar o instalador Windows:

```bash
npm run desktop:build
```

O instalador será gerado na pasta:

```text
release
```

# Publicação Web

Depois que o sistema funcionar localmente, ele pode ser publicado no Vercel. Cadastre no Vercel as mesmas variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca coloque a `SUPABASE_SERVICE_ROLE_KEY` no `.env` do Vite, no GitHub ou no navegador.
