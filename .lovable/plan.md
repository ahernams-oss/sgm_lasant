# Migração para Supabase Auth + RLS restritiva

## Contexto

Hoje o sistema usa autenticação customizada (tabela `usuarios` + Edge Function `auth-login` + sessão em localStorage). Todas as chamadas ao banco usam a chave anon, e por isso `auth.uid()` é sempre `null` — o que obriga as policies de RLS a permitirem operações públicas. Isso é o que o scanner de segurança apontou: 11 tabelas com dados sensíveis (CPF, contas bancárias, exames médicos, lances de pregão, salários) acessíveis a qualquer visitante.

Para fechar essas vulnerabilidades de forma definitiva, vamos migrar o login para o **Supabase Auth** nativo, e em seguida aplicar RLS restritiva (`authenticated`-only) em todas as tabelas sensíveis.

## Estratégia: 3 fases

A migração é grande (~60 contextos consomem o `supabase` cliente). Vou dividir em fases pequenas e seguras. **Cada fase só vai pro ar depois de testada — não vou avançar sem sua aprovação entre fases.**

### Fase 1 — Infraestrutura de Auth (sem quebrar nada)

**Objetivo:** ter Supabase Auth funcionando em paralelo, sem mexer no login atual.

1. Adicionar coluna `auth_user_id uuid` (nullable, unique) em `public.usuarios`, com FK para `auth.users(id) ON DELETE SET NULL`.
2. Criar trigger `on_auth_user_created` que sincroniza `auth.users` → `public.usuarios.auth_user_id` quando alguém é criado no Auth.
3. Criar Edge Function `migrate-users-to-auth` (service role) que, para cada `usuarios` sem `auth_user_id`:
   - cria um usuário em `auth.users` com o mesmo email e senha aleatória forte
   - grava `auth_user_id` em `public.usuarios`
   - envia e-mail "Defina sua nova senha" (link `resetPasswordForEmail`) usando o template já existente
4. Criar página `/redefinir-senha` (rota pública) que processa o `type=recovery` e chama `supabase.auth.updateUser({ password })`.
5. Criar função SQL `has_role(_uid uuid)` e `current_usuario_id()` que retorna o `usuarios.id` a partir de `auth.uid()` via `auth_user_id`. Será usada em todas as policies da Fase 3.

**Resultado:** todos os usuários existentes ganham conta no Supabase Auth e recebem e-mail para definir senha. O login atual continua funcionando.

### Fase 2 — Cutover do Login

**Objetivo:** substituir o login customizado pelo Supabase Auth.

1. Reescrever `AuthContext.login()` para chamar `supabase.auth.signInWithPassword({ email, senha })`.
2. Substituir `localStorage["usuarioLogado"]` por `supabase.auth.getSession()` + listener `onAuthStateChange`. Manter o objeto `Usuario` enriquecido (com `cargoId`, `clientesPermitidos`, etc.) buscado de `public.usuarios` após login.
3. Atualizar `logout()` para chamar `supabase.auth.signOut()`.
4. Atualizar `resetSenha()` para usar `supabase.auth.resetPasswordForEmail()` com redirect para `/redefinir-senha`.
5. Atualizar `SupervisorPasswordDialog` (`verificarSenhaUsuario`) para validar via uma Edge Function que faz `signInWithPassword` num cliente isolado (sem sobrescrever a sessão atual).
6. Atualizar `auth-login` / `auth-set-password` Edge Functions: marcar como deprecated, manter compatibilidade durante 1 versão.
7. Migrar `clientes_credenciais`, `usuarios_credenciais`, `empresa_credenciais` para serem somente um espelho de status (`senha_status`), sem armazenar a senha real.

**Resultado:** todos os usuários passam a logar via Supabase Auth. JWT real, `auth.uid()` válido em todas as queries.

### Fase 3 — RLS restritiva nas tabelas sensíveis

**Objetivo:** fechar as 11 vulnerabilidades + bonus.

Para cada tabela abaixo, substituir as policies `USING (true)` por policies que exigem `authenticated`:

| Tabela | Nova policy SELECT | Nova policy WRITE |
|---|---|---|
| `funcionarios` | `auth.role() = 'authenticated'` | `authenticated` + `has_module('funcionarios')` |
| `fin_contas_bancarias` | `authenticated` + `has_module('financeiro')` | mesmo |
| `exames_periodicos` | `authenticated` + `has_module('exames')` | mesmo |
| `juridico_decisoes_pagamentos` | `authenticated` + `has_module('juridico')` | mesmo |
| `processos_trabalhistas` | mesmo | mesmo |
| `usuarios` + `perfis_acesso` | `authenticated` | apenas usuários com `has_module('usuarios')` |
| `comunicacao_mensagens` | participante da conversa | autor |
| `comunicacao_notificacoes` | `auth.uid() = destinatario_auth_id` | sistema |
| `lancamentos` | `authenticated` + `has_module('lancamentos')` | mesmo |
| `processos_seletivos` | `authenticated` + `has_module('processo_seletivo')` | mesmo |
| `pregao_propostas_fechadas` | só pregoeiro OU `revelada=true` | só via Edge Function |

Adicionalmente:
- Remover `pregao_lances` e `pregao_mensagens` da publication `supabase_realtime`. Substituir consumo no front por polling via Edge Function que filtra por participante autenticado.
- Auditar outras ~115 tabelas e ajustar policies para `authenticated`-only (mantendo `anon` SELECT apenas onde realmente necessário — ex.: `clientes` no portal do fornecedor, se aplicável).

### Fase 4 — Limpeza (opcional, depois)

- Remover `usuarios_credenciais.senha` (passar a usar somente Supabase Auth).
- Remover Edge Functions `auth-login` / `auth-set-password`.
- Remover `verifySenha.ts` legado.

## Riscos & mitigações

- **Login quebrar para todo mundo na Fase 2.** → Antes do cutover, executo a Fase 1 e confirmo que 100% dos usuários têm `auth_user_id`. Mantenho `auth-login` antiga como fallback por 1 release.
- **Senhas atuais perdidas.** → Inevitável: o Supabase Auth não aceita importação de bcrypt customizado sem hash compatível. Cada usuário precisa redefinir a senha via e-mail (link enviado na Fase 1).
- **Portal do Fornecedor / Portal do Candidato** usam credenciais separadas (`clientes_credenciais`). → Decidir se mantemos esses portais com auth customizada (escopo limitado a tabelas do portal) ou também migramos. Recomendo manter por ora.
- **Edge Functions com `verify_jwt = false`** que recebem o `usuario.id` no body precisam validar JWT do chamador. → Refator nas funções afetadas na Fase 2.

## O que preciso de você

1. **Confirma a estratégia em 3 fases?** Posso começar pela Fase 1 hoje (não quebra nada) e te chamo antes de avançar para a Fase 2.
2. **Portal do Fornecedor/Candidato:** mantém com auth própria (recomendado) ou migra junto?
3. **Comunicar usuários:** posso disparar o e-mail "defina sua nova senha" para todos os ~N usuários no fim da Fase 1, ou prefere disparar em lotes/manualmente?

## Detalhes técnicos

- Migrations criadas em ordem para que cada uma seja idempotente.
- `current_usuario_id()` será `SECURITY DEFINER` e `STABLE`, com `SET search_path=public`, retornando `(SELECT id FROM usuarios WHERE auth_user_id = auth.uid())`.
- `has_module(text)` será `SECURITY DEFINER`, consultando `perfis_acesso.modulos` JSONB com `current_usuario_id()`. Evita recursão de RLS em `perfis_acesso`.
- Cargos com acesso total (`Diretor`, `Gerente Executivo`, `Coordenador`) continuam com bypass via função `is_acesso_total()`.
- Confirmação de e-mail: vou desabilitar `auto_confirm_email` apenas para signups normais; o `migrate-users-to-auth` cria usuários já confirmados via `auth.admin.createUser({ email_confirm: true })`.
