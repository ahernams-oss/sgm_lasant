# Importação de Holerites (PDF consolidado + IA)

Nova rotina no menu RH: **Importar Holerites**. O usuário arrasta um PDF único com todos os holerites do mês, o sistema quebra por página, identifica CPF/nome de cada holerite via IA, casa com o funcionário e publica no portal.

## Fluxo

```text
Upload PDF mensal
      │
      ▼
Split por página (pdf-lib) → N PDFs individuais
      │
      ▼
Para cada página:
   - extrai texto (pdf.js)
   - IA (Gemini Flash) extrai: CPF, nome, competência, tipo (folha/13o/férias/rescisão), valor líquido
   - casa com funcionários.cpf → funcionario_id
      │
      ▼
Tela de conferência: lista com status
   ✓ Casado automaticamente  |  ⚠ Ambíguo (múltiplos matches)  |  ✗ Não encontrado
      │
      ▼
RH revisa, corrige manualmente os pendentes, clica "Publicar"
      │
      ▼
Cada PDF individual é enviado para bucket `portal-holerites/{funcionario_id}/{ano}-{mes}-{tipo}.pdf`
e registrado em `portal_holerites` → aparece no portal do funcionário
```

## Backend

### Nova tabela `portal_holerites_import_lote`
Guarda cada lote importado para auditoria: `id`, `arquivo_nome`, `competencia_mes`, `competencia_ano`, `total_paginas`, `total_publicados`, `importado_por`, `created_at`, `status` (processando/conferencia/publicado).

### Nova tabela `portal_holerites_import_item`
Uma linha por página do PDF: `id`, `lote_id`, `pagina`, `cpf_detectado`, `nome_detectado`, `funcionario_id` (nullable), `tipo` (folha/13o/ferias/rescisao/outros), `valor_liquido`, `status_match` (auto/ambiguo/nao_encontrado/manual), `pdf_pagina_base64`, `publicado` (bool).

### Edge function `processar-holerites-lote` (nova)
- Recebe PDF base64 + competência.
- Usa `pdf-lib` (via `npm:`) para separar em páginas individuais.
- Para cada página: extrai texto e envia para Lovable AI (`google/gemini-3.6-flash`) com prompt estruturado retornando `{cpf, nome, competencia, tipo, valor_liquido}`.
- Casa CPF com `funcionarios` (busca por CPF normalizado).
- Grava lote + itens; retorna resumo para tela.

### Edge function `publicar-holerites-lote` (nova)
- Recebe `lote_id`.
- Para cada item com `funcionario_id`, faz upload do PDF individual no bucket `portal-holerites` e insere em `portal_holerites`.
- Marca lote como `publicado`.

## Frontend

Nova rota `/rh/importar-holerites` (permissão: RH/Diretor):

**Passo 1 — Upload:** dropzone + seleção de competência (mês/ano). Botão "Analisar".

**Passo 2 — Conferência:** tabela com uma linha por página do PDF:
| Página | CPF detectado | Nome detectado | Funcionário casado | Tipo | Valor líquido | Ações |

- Linhas verdes: casadas automaticamente.
- Linhas amarelas: ambíguas — combobox para escolher entre candidatos.
- Linhas vermelhas: não encontrado — combobox para vincular manualmente ou marcar "ignorar".
- Preview do PDF da página ao clicar (usa `PdfPreview.tsx` existente).
- Botão "Publicar N holerites" (desabilitado se houver linhas não resolvidas).

**Passo 3 — Concluído:** resumo (X publicados, Y ignorados) e link "Ver no portal do funcionário".

## Detalhes técnicos

- Modelo: `google/gemini-3.6-flash` (rápido, barato, ótimo para extração estruturada). Prompt em JSON mode.
- Tipo do holerite é inferido pelo texto do próprio holerite ("Rescisão", "Férias", "13º Salário", senão `folha`).
- Se o PDF tiver >50 páginas, processa em batches de 20 para não estourar limite de tempo da edge function.
- CPF matching é feito com CPF normalizado (só dígitos); em caso de múltiplos ativos, marca como ambíguo.
- Se um holerite da mesma competência+tipo+funcionário já existir, marca `duplicado` e pede confirmação para sobrescrever.

## Fora do escopo (para depois)

- OCR para PDFs escaneados (por ora, exige PDF de texto — que é o padrão dos ERPs de folha).
- Importação de eventos detalhados (só o PDF fica disponível; sem parsing linha-a-linha de proventos/descontos).
- Notificação em massa via WhatsApp após publicar (fácil de adicionar depois se quiser).

Se aprovar, implemento em uma leva: migrações + 2 edge functions + tela de importação + link no menu.
