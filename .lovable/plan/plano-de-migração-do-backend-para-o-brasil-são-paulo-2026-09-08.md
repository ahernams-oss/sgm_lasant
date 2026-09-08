# Plano de Migração do Backend para o Brasil (São Paulo)

O backend atual (banco, autenticação, arquivos e funções) roda nos EUA (us-east-1). A região não pode ser trocada no mesmo projeto: é preciso criar um novo ambiente em São Paulo (sa-east-1) e transferir tudo para ele.

## O que muda para os usuários

- Consultas e telas ficam mais rápidas (menos ida e volta até os EUA).
- Haverá uma janela de indisponibilidade planejada (estimativa: 2 a 4 horas), preferencialmente fora do horário comercial.
- Todos continuam usando o mesmo endereço `app.lasant.com.br`.

## Etapas

### 1. Preparação (sem parar o sistema)
- Criar o novo ambiente no Brasil.
- Recriar a estrutura completa do banco usando o pacote de scripts que já geramos (tabelas, chaves, índices, funções, gatilhos, permissões e regras de acesso).
- Recriar as 29 pastas de arquivos e as configurações de tempo real.
- Republicar as funções de servidor (WhatsApp, e-mails, portal, notas fiscais, MCP, EPIs etc.) e recadastrar as chaves e segredos usados por elas.
- Testar em paralelo com dados de exemplo.

### 2. Congelamento e cópia dos dados (janela de parada)
- Avisar os usuários e bloquear novas gravações.
- Copiar os dados de todas as 160 tabelas, respeitando a ordem das dependências, e reposicionar os contadores automáticos (nº de OS, SS, RCS, orçamentos, boletins, RDOs, contratos, NFS-e).
- Copiar os usuários e suas credenciais de acesso, preservando as senhas.
- Copiar todos os arquivos armazenados (anexos, fotos, selfies, documentos, holerites).

### 3. Virada
- Apontar o aplicativo para o novo ambiente.
- Republicar o site e revalidar o domínio `app.lasant.com.br`.
- Reconfigurar integrações externas: PlugSend/WhatsApp, envio de e-mails, Brasil NFe (inclusive o endereço do webhook) e o conector do ChatGPT (MCP/OAuth).

### 4. Validação
- Login e permissões por perfil.
- Criação de OS, SS, requisição de compras e orçamento (verificando a numeração).
- Upload e download de anexos e fotos.
- Geração de PDFs e relatórios.
- Envio de WhatsApp e e-mail.
- Portal do funcionário e do fornecedor.
- Rotinas automáticas (alertas de férias, EPIs, licitações).

### 5. Estabilização
- Manter o ambiente antigo em modo somente leitura por 7 dias como segurança.
- Se algo crítico falhar, voltar a apontar o aplicativo para o ambiente antigo (plano de retorno).
- Após 7 dias sem problemas, desativar o ambiente antigo.

## Detalhes técnicos

- Origem: Supabase gerenciado (Lovable Cloud) em us-east-1; destino: projeto Supabase em sa-east-1.
- Estrutura: reutilizar `migracao-supabase.zip` (extensões, sequences, tabelas, constraints, índices, 27 funções, 78 triggers, grants, 235 policies, buckets, realtime).
- Dados: `pg_dump --data-only --disable-triggers` por lote de tabelas, ou COPY por tabela; `setval` em todas as sequences ao final.
- Auth: migração de `auth.users`/`auth.identities` preservando hashes; validar o login próprio do SGM (tabelas `usuarios_credenciais`, `empresa_credenciais`, `clientes_credenciais`).
- Storage: cópia objeto a objeto via API entre projetos, mantendo caminhos e políticas dos 29 buckets.
- Edge Functions: redeploy com `verify_jwt = false` onde já configurado; recriar segredos (PlugSend, Gemini/IA, Brasil NFe, e-mail, MCP/OAuth).
- Frontend: atualizar URL e chave pública do backend; reemitir credenciais de cliente OAuth do MCP.
- Riscos principais: perda de webhooks apontados para o endereço antigo, tokens de link mágico (EPIs, portal) já emitidos, e diferenças de fuso/`search_path` em funções.

## Decisão necessária antes de começar

A migração exige criar e administrar um projeto Supabase próprio (fora do Lovable Cloud) na região São Paulo, com conta e faturamento seus. Confirmando isso, executo as etapas 1 a 5.
