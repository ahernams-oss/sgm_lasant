
# Portal do Funcionário

Estender o portal existente (`/portal`) para atender também o **funcionário efetivado**, mantendo o mesmo login (CPF + senha) usado como candidato — o sistema detecta automaticamente se o usuário é candidato ou funcionário e roteia para a área correta.

## Fluxo de acesso (Opção A)

```text
Login em /portal (CPF + senha)
        │
        ├── Existe em `funcionarios` com status Ativo? → /portal/funcionario/*
        │
        └── Senão → /portal/candidato/* (fluxo atual)
```

Ao efetivar a contratação (RH clica "Finalizar Contratação"):
- Credencial em `portal_credenciais` é **preservada** (mesmo CPF/senha).
- Novo tipo `funcionario` é gravado no token JWT.
- Disparo automático via WhatsApp: *"Parabéns, sua contratação foi concluída! Acesse o portal em app.lasant.com.br/portal com seu CPF e a senha que você já usa."*

## Áreas do Portal do Funcionário

Menu lateral com 7 seções:

1. **Início** — cards de resumo (próximas férias, holerite disponível, avisos não lidos, EPIs pendentes de assinatura).
2. **Holerites** (`/portal/funcionario/holerites`) — lista mês/ano, download PDF via URL assinada (bucket `portal-holerites`).
3. **Férias** (`/portal/funcionario/ferias`) — saldo de dias, histórico, botão "Solicitar férias" que grava em `ferias` com status `solicitada`.
4. **Meus Documentos** (`/portal/funcionario/documentos`) — ASO, contratos, exames periódicos, documentos pessoais aprovados na admissão. Somente leitura + download.
5. **EPIs** (`/portal/funcionario/epis`) — histórico de recebimentos (tabela `epis_recebimentos`) e link direto para assinar novos recebimentos pendentes (fluxo facial já existe).
6. **Treinamentos** (`/portal/funcionario/treinamentos`) — certificados e treinamentos pendentes (`portal_treinamentos`).
7. **Solicitações RH** (`/portal/funcionario/solicitacoes`) — abrir chamado ao RH (declaração de vínculo, alteração cadastral, atestado, outros). Nova tabela `portal_solicitacoes_rh`.
8. **Avisos** (`/portal/funcionario/avisos`) — comunicados internos direcionados a funcionários (reaproveita `comunicacao_avisos` + `comunicacao_avisos_leitura`).

## Backend

**Nova tabela** `portal_solicitacoes_rh`:
- `id`, `funcionario_id`, `tipo` (declaracao/alteracao/atestado/outro), `assunto`, `descricao`, `anexo_url`, `status` (aberta/em_analise/concluida/rejeitada), `resposta_rh`, `respondido_por`, `respondido_em`, `created_at`.
- RLS pública (padrão do projeto), GRANTs completos.

**Edge function `portal-api`** — novas actions:
- `funcionario.perfil` — retorna dados básicos + cargo + admissão.
- `funcionario.holerites.list` / `funcionario.holerites.url`
- `funcionario.ferias.list` / `funcionario.ferias.solicitar`
- `funcionario.documentos.list` / `funcionario.documentos.url`
- `funcionario.epis.list`
- `funcionario.treinamentos.list`
- `funcionario.solicitacoes.list` / `.criar` / `.upload`
- `funcionario.avisos.list` / `.marcarLida`

**`portal-api/login`** — após autenticar, procura em `funcionarios` pelo CPF; se ativo, retorna `tipo: 'funcionario'` no JWT (senão mantém `tipo: 'candidato'`).

## Frontend

Estrutura de arquivos:

```text
src/pages/portal/
  PortalLogin.tsx          (roteia por tipo após login)
  funcionario/
    PortalFuncLayout.tsx   (sidebar + header com foto e nome)
    PortalFuncHome.tsx
    PortalFuncHolerites.tsx
    PortalFuncFerias.tsx
    PortalFuncDocumentos.tsx
    PortalFuncEpis.tsx
    PortalFuncTreinamentos.tsx
    PortalFuncSolicitacoes.tsx
    PortalFuncAvisos.tsx
```

- Layout segue o padrão visual do portal do candidato (logo Lasant + glassmorphism no login; sidebar clara nas telas internas).
- `PortalAuthContext` ganha campo `tipo` ('candidato' | 'funcionario') e o `<PortalRoute>` redireciona automaticamente conforme o tipo.
- Rotas registradas em `src/App.tsx` sob `/portal/funcionario/*`.

## Efetivação

No `ProcessoSeletivo.tsx`, após gravar o funcionário:
- Não recriar credencial (reaproveita a existente do candidato).
- Disparar mensagem WhatsApp de boas-vindas com o link do portal.

## Fora do escopo (para depois)

- Marcação de ponto pelo portal (fica em módulo próprio, já existe integração PontoMais).
- Aprovação de férias pelo gestor no portal (fica no ERP).
- Chat direto com RH em tempo real (por ora, solicitações são assíncronas).

Se aprovar, implemento em uma leva só: migração da tabela nova + edge function + telas do funcionário + roteamento por tipo + notificação WhatsApp na efetivação.
