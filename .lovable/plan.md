# Mecanismo de Criação de Grupos WhatsApp (JID @g.us)

## Objetivo

Permitir criar e gerenciar grupos WhatsApp diretamente do sistema, obtendo o JID (`123456789-1234567890@g.us`) para usar nos disparos automáticos (mudança de status de PC, alertas de RP, licitações, etc.), sem precisar copiar manualmente do celular.

## O que será entregue

### 1. Edge Function `plugsend-groups`

Nova função que expõe as operações de grupo da API uazapi (via mesmo token PlugSend já cadastrado). Recebe um `action` no body e roteia:

| Action | Endpoint uazapi | Uso |
|---|---|---|
| `create` | POST /group/create | Cria grupo com nome + participantes iniciais |
| `list` | GET /group/list | Lista todos os grupos da instância |
| `info` | POST /group/info | Detalhes de um grupo específico |
| `addParticipants` | POST /group/updateParticipants (action: add) | Adiciona membros |
| `removeParticipants` | POST /group/updateParticipants (action: remove) | Remove membros |
| `updateName` | POST /group/updateName | Renomeia o grupo |
| `leave` | POST /group/leave | Sai do grupo |

Sempre relaya status e corpo de erro do provider (padrão já usado na `send-plugsend`).

### 2. Página "Grupos WhatsApp" — `src/pages/ComunicacaoGruposWhatsapp.tsx`

Nova página em **Comunicação → Grupos WhatsApp**, seguindo o padrão visual Berry (rounded, primary #673ab7, filtros persistidos, paginação 10/20/50).

Componentes:

- **Grid principal** listando grupos existentes: nome, JID (com botão copiar), qtd. participantes, ações (ver/editar/sair)
- Botão **"Atualizar cache"** (chama list com `force=true`)
- Botão **"Novo Grupo"** abre dialog:
  - Nome (1–100 chars)
  - Participantes: campo multi-tag com máscara BR (aceita `(11) 99999-9999` e limpa para `5511999999999`); mínimo 1, máximo 50
  - Botão auxiliar "Adicionar de Clientes/Fornecedores/Funcionários" — busca via Combobox e injeta os telefones cadastrados
  - Ao criar com sucesso, mostra o JID gerado com botão **"Copiar JID"** e **"Usar como grupo padrão de cliente…"** (Combobox de clientes → grava em `clientes.grupoWhatsapp` — campo já existente)
- **Dialog Detalhes/Editar**: renomear, adicionar/remover participantes, mostrar todos os membros

### 3. Rota + Sidebar

- Adiciona rota `/comunicacao/grupos-whatsapp` em `App.tsx`
- Adiciona item no `AppSidebar.tsx` no grupo **Comunicação**, com controle de permissão via `perfil.permissoes.comunicacao_grupos_whatsapp`

### 4. Helper cliente `src/lib/plugsendGroups.ts`

Wrapper tipado para invocar a edge function do frontend, com as mesmas ações acima.

## Detalhes técnicos

- **Autenticação PlugSend**: já usa `PLUGSEND_TOKEN` cadastrado; a instância uazapi é a mesma dos disparos atuais
- **Formato de telefone**: sanitiza para dígitos internacionais antes de enviar (mesma regra `replace(/\D/g, "")` que já usamos)
- **Persistência**: os grupos vivem no WhatsApp — não precisamos de tabela nova. O JID retornado é apenas colado no campo `grupoWhatsapp` já existente em `clientes` quando o usuário quiser vincular
- **Feedback**: toasts de sucesso/erro relayando o corpo de erro do provider (missing participants, número inválido, etc.)
- **Segurança**: função com `verify_jwt = false` (padrão do projeto — auth custom), CORS liberado, validação Zod-lite dos inputs

## Fora do escopo

- Envio de mensagens para o grupo pela nova tela (já disponível: basta usar o JID no campo `grupoWhatsapp` do cliente; o disparo automático em mudança de status de PC já respeita esse campo)
- Sincronização periódica automática dos grupos (usuário aciona "Atualizar cache" manualmente)
- Aprovações de entrada, comunidades, tópicos
