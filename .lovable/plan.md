## Módulo de Orçamentos SCO (FGV)

Construção de um módulo completo para confecção de orçamentos baseado nos catálogos SCO/FGV (Março/2026), com seleção de itens, recuperação automática de preços e geração de relatórios sintéticos e analíticos.

### 1. Banco de dados (3 tabelas de catálogo + 1 de orçamentos)

**`sco_elementares`** (≈3.918 itens — FGV04)
- `codigo` (PK, ex: MAT000050), `descricao`, `unidade`, `grupo` (MAT/MOB/MOD/MOI/EVE/RSE/REQ), `preco`, `referencia` (Mar/2026).

**`sco_servicos`** (≈5.514 itens — FGV06)
- `codigo` (PK, ex: AD 04.05.0050), `descricao`, `unidade`, `preco`, `capitulo` (ex: AD), `secao`, `subsecao`, `referencia`.

**`sco_composicoes`** (≈29.171 linhas — FGV07)
- `servico_codigo` (FK), `elementar_codigo` (FK), `elementar_descricao`, `unidade`, `quantidade`. Define quanto de cada elementar entra em 1 unidade do serviço.

**`orcamentos_sco`** (orçamentos do usuário)
- `numero` (sequencial), `titulo`, `cliente_id` (opcional), `obra_id` (opcional), `tipo_analise` (sintetica/analitica), `bdi` (%), `desconto` (%), `observacoes`, `itens` (JSONB: lista `{servico_codigo, descricao, unidade, quantidade, preco_unit, preco_total}`), `valor_total`, `status`.

### 2. Importação dos catálogos
- **Migração inicial**: cria as 3 tabelas com RLS pública.
- **Edge Function `import-sco-catalogs`**: recebe os 3 XLSX (base64), faz parse e popula. Acessível pela tela `/orcamentos/importar-catalogo` com botão de upload — permite reimportar quando a FGV publicar nova referência.
- Carga inicial via script — eu rodo a importação após a migração ser aprovada.

### 3. UI — Novo grupo "Orçamentos" na sidebar

Páginas:
- **`/orcamentos`** — Grid listando orçamentos (nº, título, cliente, valor total, BDI, status, ações).
- **`/orcamentos/novo`** e **`/orcamentos/:id`** — Formulário do orçamento:
  - Cabeçalho: título, cliente (combobox opcional), obra (opcional), BDI %, desconto %, observações.
  - **Adicionar item**: combobox de busca em `sco_servicos` (por código ou descrição, com hierarquia capítulo→seção). Ao selecionar, traz unidade e preço unitário. Usuário informa quantidade.
  - Tabela de itens: código, descrição, un, qtd, preço unit, total, ação.
  - Totais: subtotal + BDI + desconto = valor total.
- **`/orcamentos/importar-catalogo`** — Upload dos 3 XLSX para reimportar.
- **`/orcamentos/catalogo`** — Visualização/busca livre do catálogo SCO (consulta de preços).

### 4. Análise Sintética × Analítica

- **Sintética**: lista os serviços escolhidos com qtd × preço unitário do serviço.
- **Analítica**: para cada serviço, expande sua composição (`sco_composicoes`) — mostra cada elementar (material, mão-de-obra, equipamento) com quantidade unitária, quantidade total (qtd serviço × qtd elementar), preço unitário do elementar e subtotal. Soma por serviço e total geral.

Toggle no formulário e nos botões de exportação.

### 5. Exportações
- **PDF Sintético** (`gerarPdfOrcamentoSco.ts`) — layout Lasant azul royal.
- **PDF Analítico** — adiciona sub-tabela de composição por serviço.
- **Excel Sintético** e **Excel Analítico** — usando `xlsx` (já no projeto).

### 6. Permissões e padrões
- Aplicar padrão Berry (roxo #673ab7), Combobox para busca, paginação 7/10/20/50, DoubleConfirmDelete, datetime `dd/mm/yyyy, hh:mm`.
- Adicionar módulo "Orçamentos" em PerfisAcesso.

### Detalhes técnicos
- Parsing XLSX no edge function via `xlsx` (npm/esm).
- Composição navegada por `servico_codigo` indexado.
- BDI aplicado sobre subtotal antes do desconto.
- Numeração de orçamento via trigger anual (padrão SS/OS).

### Etapas de execução
1. Criar migração com 3 tabelas catálogo + tabela orçamentos + trigger numeração + RLS.
2. Eu populo o catálogo após a migração aprovada (via script SQL/Supabase).
3. Criar Context, edge function de importação, páginas, dialog, geradores PDF/Excel.
4. Adicionar grupo "Orçamentos" na sidebar e rotas em App.tsx.

Após sua aprovação eu executo tudo de uma vez.
