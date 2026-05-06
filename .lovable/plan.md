# Fase 1 — Fortalecimento de Senhas

Endurecer o sistema de autenticação atual sem quebrar o fluxo existente. Tudo é retrocompatível: senhas antigas (texto puro) continuam funcionando até o próximo login, quando são migradas automaticamente para hash.

## O que será entregue

### 1. Hash de senhas com bcrypt (Edge Functions)
Criar duas Edge Functions seguras (com `verify_jwt = false`, validação Zod):
- **`auth-login`** — recebe email + senha, busca o usuário, valida (bcrypt OU texto puro legado), e se for legado faz a migração automática para hash. Retorna o objeto `usuario` (sem a senha).
- **`auth-set-password`** — recebe `userId` + `novaSenha`, valida política de complexidade, gera hash bcrypt e grava.

As senhas no banco passarão a ser armazenadas como hash bcrypt (`$2a$...`). Senhas antigas em texto puro continuam funcionando uma única vez — no próximo login, são re-hasheadas.

### 2. Política de complexidade
Validação via Zod, aplicada no cadastro, edição e reset:
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

Aplicada em:
- Cadastro de Usuários (`Usuarios.tsx`)
- Reset de senha (`AuthContext.resetSenha`)
- Edge Function `auth-set-password` (validação server-side)

### 3. Refatoração do AuthContext
- `login()` passa a chamar a Edge Function `auth-login` em vez de comparar senha em texto puro localmente.
- `resetSenha()` passa a chamar `auth-set-password` para gravar a nova senha já hasheada.
- O cadastro de usuário também passa a chamar `auth-set-password` ao definir/alterar senha.

### 4. Relatório de usuários sem senha
Nova tela em **Cadastros → Usuários**: botão "Auditoria de Acessos" que mostra:
- Usuários sem senha cadastrada (NULL ou vazio)
- Usuários ainda em senha legada (texto puro, não hasheada)
- Botão para "Forçar redefinição" (limpa senha + dispara e-mail de recuperação)

### 5. Indicador de força de senha
Componente visual no formulário de senha (barra colorida fraca/média/forte) para guiar o usuário.

## Detalhes técnicos

**Stack:** bcrypt via `https://deno.land/x/bcrypt` nas Edge Functions. Frontend não manipula hash.

**Migração:**
```text
Login flow:
  1. Frontend envia email + senha → auth-login
  2. Edge Function busca usuário
  3. Se senha começa com "$2" → bcrypt.compare
  4. Senão → comparação direta (legado) + se OK, re-hash e UPDATE
  5. Retorna usuário (sem senha)
```

**Compatibilidade:**
- Nenhuma migração de schema necessária (campo `senha` continua TEXT).
- Usuários atuais não precisam fazer nada — migração é transparente no próximo login.
- `SENHA_TESTE = "102030"` (modo teste em assinaturas) continua funcionando — não é afetado.

**Não incluído nesta fase (ficará para Fase 2/3):**
- Bloqueio por tentativas de login
- Tabela `auth_logs` de auditoria
- Expiração de senha a cada 90 dias
- Migração para Supabase Auth nativo

## Arquivos afetados

- **Novos:** `supabase/functions/auth-login/index.ts`, `supabase/functions/auth-set-password/index.ts`, `src/lib/passwordPolicy.ts`, `src/components/PasswordStrengthMeter.tsx`, `src/components/AuditoriaAcessosDialog.tsx`
- **Editados:** `src/contexts/AuthContext.tsx`, `src/pages/Usuarios.tsx`

Posso prosseguir com a implementação?
