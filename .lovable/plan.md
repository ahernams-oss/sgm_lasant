
# Portal do Funcionário e Candidato

Portal público único (rota `/portal`) com login por CPF+senha que direciona para dois fluxos: funcionário contratado ou candidato em processo de contratação.

## Arquitetura

```text
/portal                    → Login (CPF + senha)
/portal/cadastrar-senha    → 1º acesso (CPF + Data Nasc. + define senha)
/portal/esqueci-senha      → Reset via WhatsApp/e-mail
/portal/funcionario        → Home do funcionário contratado
  ├─ /holerites            → Ver/baixar holerites e comprovantes
  ├─ /epis                 → Confirmar recebimento facial (integra fluxo existente)
  ├─ /documentos           → ASO, exames, advertências, dados cadastrais
  └─ /perfil               → Alterar senha, dados de contato
/portal/candidato          → Home do candidato em contratação
  ├─ /ficha                → Ficha cadastral (pessoais/endereço/bancário/dependentes)
  ├─ /documentos           → Upload de RG, CPF, CTPS, comprovantes
  ├─ /termos               → Assinatura eletrônica de contrato, LGPD, código conduta
  └─ /admissional          → Agendar exame admissional + treinamentos integração
```

## Banco de dados

Nova tabela `portal_credenciais` (CPF único, senha bcrypt, vínculo a `funcionarios` ou `processos_seletivos`, tipo de acesso, flags de reset).

Nova tabela `portal_holerites` (funcionario_id, mês/ano, tipo — folha/13º/férias/rescisão, arquivo, disponibilizado_em).

Nova tabela `portal_ficha_admissao` (candidato_id, dados_pessoais JSONB, endereço JSONB, bancário JSONB, dependentes JSONB, status).

Nova tabela `portal_documentos_candidato` (candidato_id, tipo_documento, storage_path, status validação, revisor).

Nova tabela `portal_termos_assinados` (candidato_id/funcionario_id, tipo_termo, hash_sha256, ip, timestamp, aceite_texto).

Nova tabela `portal_treinamentos` (candidato_id, tipo, concluído_em, nota, certificado_path).

Nova tabela `portal_acessos_log` (auditoria de login e ações sensíveis).

Novos buckets storage: `portal-holerites` (privado), `portal-candidato-docs` (privado), `portal-termos-assinados` (privado), `portal-treinamentos-cert` (privado).

## Edge Functions

- `portal-auth-login` — valida CPF+senha, retorna token de sessão.
- `portal-auth-signup` — 1º acesso: valida CPF+Data Nasc. contra `funcionarios`/`processos_seletivos`, cria credencial.
- `portal-auth-reset` — envia link via WhatsApp (PlugSend) e e-mail.
- `portal-holerite-download` — URL assinada com auditoria.
- `portal-candidato-submit` — grava ficha, dispara notificação ao RH.
- `portal-termo-assinar` — gera hash SHA-256, salva assinatura.

## Frontend

- Novo `PortalAuthContext` isolado do `AuthContext` interno.
- Layout dedicado `PortalLayout` com branding LASANT, mobile-first.
- Todas as rotas do portal ficam fora do `AppLayout` interno.
- Reaproveitar componentes existentes: viewCEP, upload de imagem, captura facial de EPI.

## Administração interna (dentro do SGM existente)

- Nova página `/rh/portal` (permissão `portal_admin`) para:
  - Upload em lote de holerites (por competência).
  - Aprovar/reprovar documentos do candidato.
  - Ver ficha preenchida e converter candidato em funcionário.
  - Ver termos assinados com hash.
  - Botão "Enviar link do portal" (WhatsApp) em Funcionários e em Processos Seletivos.
- Nova permissão `portal_admin` em `PerfisAcessoContext`.

## Segurança

- Senha bcrypt (custo 10), política mínima (8 caracteres, 1 número, 1 letra).
- Rate-limiting no login (5 tentativas / 15min por CPF+IP).
- Logs completos em `portal_acessos_log`.
- Buckets privados; downloads sempre via signed URL de curta duração emitida pelo edge function após validar sessão.
- RLS bloqueia acesso direto do `anon`; toda leitura passa por edge function que valida o token de sessão.

## Sequência de entrega (dentro desta entrega única)

1. Migração completa do banco + buckets + RLS + grants.
2. Edge functions de auth.
3. `PortalAuthContext` + rotas + layout.
4. Telas do funcionário (holerites, EPIs redirecionando p/ fluxo existente, documentos, perfil).
5. Telas do candidato (ficha, documentos, termos com hash, treinamentos).
6. Página admin `/rh/portal` + botões "Enviar link" nas telas existentes.
7. Permissão `portal_admin` no perfil de acesso.

## Detalhes técnicos

- Token de sessão: JWT curto (1h) assinado com secret dedicado `PORTAL_JWT_SECRET`, refresh via cookie httpOnly opcionalmente (v1 = renovar via re-login).
- WhatsApp: `plugsend-send` já existente para os links de acesso.
- E-mail: `send-transactional-email` já existente com novos templates `portal-welcome`, `portal-reset`.
- Assinatura eletrônica: reaproveitar `assinaturaHash.ts` (SHA-256 canônico do payload aceito).
- Storage: signed URLs com TTL de 60s para download.

Nada nas telas internas atuais será removido — apenas adicionados botões "Enviar link do portal" e a nova página administrativa.
