# NFS-e Nacional — Emissão via API (Homologação)

Implementação da emissão de NFS-e direto no **Emissor Nacional (sefin.nfse.gov.br)** em ambiente de homologação, usando o certificado A1 já cadastrado em Empresa.

## Arquitetura

```text
[UI React]  →  [Edge Function nfse-emitir]  →  [sefin.nfse.gov.br/sefinnacional/dps]
     ↑                    ↓                                      ↓
     └──── nfses_emitidas (Supabase) ←── XML DPS assinado + XML NFS-e devolvido
```

Toda a complexidade fica na edge function (que tem acesso ao certificado A1 + chave de assinatura). O frontend só envia o "modelo" e recebe status + links.

## Backend

### 1. Tabela `nfses_emitidas` (migração)
Campos principais: numero_dps, serie, ambiente (1=prod/2=homol), status (rascunho/emitida/rejeitada/cancelada), chave_acesso, protocolo, data_emissao, prestador (JSONB), tomador (JSONB), servico (JSONB — descrição, codigo trib. municipal, codigo NBS, valor serviços, deducoes, ISS), tributos (JSONB — ISS retido?, PIS, COFINS, INSS, IR, CSLL), xml_dps, xml_nfse, url_danfse, mensagem_retorno, faturamento_id (FK opcional para faturamento de medição), cliente_id.

### 2. Tabela `nfse_config`
Configurações por empresa: serie_padrao, proximo_numero_dps, regime_tributario, regime_especial, optante_simples, incentivador_cultural, codigo_municipio_prestador, codigo_servico_padrao, aliquota_iss_padrao, ambiente_padrao.

### 3. Edge Functions

**`nfse-emitir`** (`verify_jwt = false`):
- Recebe payload do modelo (prestador/tomador/serviço/tributos)
- Monta XML DPS conforme XSD nacional v1.00 (schema NFS-e Nacional)
- Carrega certificado A1 do storage `certificados-digitais`, descriptografa com senha
- Assina o DPS com **XMLDSig enveloped** (algoritmo RSA-SHA256, C14N exclusive)
- POST para `https://sefin.staging.cloud.gov.br/sefinnacional/nfse` (homologação) com header `Content-Type: application/xml`
- Persiste retorno (XML NFS-e ou rejeição) em `nfses_emitidas`

**`nfse-consultar`**: consulta por chave de acesso (GET `/nfse/{chave}`)

**`nfse-cancelar`**: monta evento de cancelamento, assina, envia

**`nfse-danfse`**: gera PDF do DANFSe a partir do XML autorizado

Bibliotecas Deno: `npm:node-forge` (certificado A1 PFX) + `npm:xmldsigjs` ou implementação manual com `npm:xml-crypto` adaptada para Deno.

## Frontend

### 4. Contexto `NfsesContext`
CRUD padrão consumindo `nfses_emitidas`. Métodos: `emitir(modelo)`, `consultar(id)`, `cancelar(id, motivo)`, `baixarDanfse(id)`, `baixarXml(id)`.

### 5. Página `src/pages/financeiro/NfseEmitir.tsx`
Sidebar em **Financeiro > NFS-e**. Layout Berry:
- **KPIs**: Emitidas no mês, Rejeitadas, Canceladas, Valor total ISS
- **Filtros**: período, cliente, status, ambiente
- **Grid**: número, série, data, tomador, valor serviço, valor ISS, status (badge), ações (visualizar, baixar XML, baixar DANFSe, cancelar)
- **Botão "Emitir NFS-e"** abre dialog com abas: Prestador (preenchido da Empresa), Tomador (combobox de clientes), Serviço (descrição, código municipal, valor, deduções), Tributos (ISS, retenções federais), Revisão (preview do DPS)

### 6. Página `src/pages/financeiro/NfseConfig.tsx`
Tela de configuração (série padrão, próximo número, regime tributário, código serviço padrão, alíquota ISS padrão, ambiente).

### 7. Integração com Faturamento existente
Em `src/components/FaturamentoSection.tsx`: novo botão **"Emitir NFS-e"** em cada linha de faturamento que ainda não tem nota emitida. Abre o mesmo dialog de emissão pré-preenchido com cliente do contrato, valor líquido, descrição (período + contrato). Após emitir, vincula `nfse_id` ao faturamento e mostra link.

### 8. Rotas e Sidebar
- `/financeiro/nfse` (grid + emissão)
- `/financeiro/nfse/config` (configurações)
- Item no `AppSidebar` em **Financeiro**, com permissão no `PerfisAcesso`.

## Detalhes técnicos importantes

- **Certificado A1**: já existe em `empresa.certificado_a1_url` (bucket privado `certificados-digitais`). A senha é salva criptografada — a edge function busca via `empresa-certificado-a1` helper.
- **Schema DPS v1.00**: namespace `http://www.sped.fazenda.gov.br/nfse`. Estrutura obrigatória: `infDPS` com `tpAmb`, `dhEmi`, `verAplic`, `serie`, `nDPS`, `dCompet`, `prest`, `toma`, `serv`, `valores`.
- **Assinatura**: o elemento `infDPS` precisa de `Id` e a `<Signature>` vai dentro do `DPS` (enveloped, referência ao Id).
- **Endpoints homologação**: `https://sefin.staging.cloud.gov.br/sefinnacional/`
- **Numeração**: trigger no banco para incrementar `numero_dps` por série/ambiente, similar aos triggers existentes (`set_next_os_numero`).

## Entrega faseada
1. Migrações + edge function `nfse-emitir` + endpoint de consulta
2. Contexto + página de configuração
3. Página NFS-e (grid + dialog de emissão)
4. Integração com Faturamento
5. Cancelamento + DANFSe PDF

Após aprovação começo pela fase 1 (migrações + edge function de emissão).