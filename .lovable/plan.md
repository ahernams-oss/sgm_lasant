## Módulo Financeiro — escopo "Completo"

Vou construir um módulo financeiro inspirado no Conta Azul, totalmente integrado ao sistema, mantendo o padrão visual Berry (roxo #673ab7, cards arredondados, Inter/Serif), com paginação padrão, DoubleConfirmDelete e permissões granulares.

### Submódulos (cada um vira uma página + item no AppSidebar, grupo "Financeiro")

1. **Dashboard Financeiro** — KPIs (Saldo total, A pagar 30d, A receber 30d, Inadimplência, Resultado do mês), gráficos: fluxo diário 30d, receita vs despesa mensal (12m), top 5 categorias de despesa, contas a vencer hoje/semana.
2. **Contas a Pagar** — cadastro, edição, baixa (pagamento total/parcial), anexar boleto/NF, vínculo a Pedido de Compra, filtros (status, vencimento, fornecedor, categoria), recorrência, pagar em lote.
3. **Contas a Receber** — cadastro, edição, baixa de recebimento, anexar NF, vínculo a Cliente/Contrato/Faturamento, status (em aberto, recebido, vencido, cancelado), inadimplência.
4. **Contas Bancárias / Caixas** — cadastro de contas (banco, agência, conta, tipo: corrente/poupança/caixa/cartão), saldo inicial, saldo atual calculado, transferências entre contas.
5. **Plano de Contas / Categorias DRE** — árvore de receitas e despesas (pai/filho), tipo (receita/despesa), código contábil, status ativo.
6. **Centro de Custo** — cadastro com vínculo opcional a Cliente/Obra/Departamento, usado para classificar lançamentos.
7. **Fluxo de Caixa** — projeção dia-a-dia (saldo inicial + entradas previstas - saídas previstas) com filtro por conta e período, comparativo previsto vs realizado, exportar Excel/PDF.
8. **DRE Gerencial** — relatório por período (mensal/trimestral/anual), receita bruta, deduções, despesas por categoria, resultado líquido, comparativo de períodos, exportar PDF.
9. **Conciliação Bancária** — importar OFX, listar movimentos não conciliados, sugerir match com lançamentos existentes, marcar como conciliado, criar lançamento a partir de movimento.
10. **Lançamentos** — visão consolidada (pagar+receber+transferência) tipo extrato, com filtros avançados.

### Integrações com módulos existentes

- **Pedido de Compra aprovado** → gera 1+ Conta a Pagar (parcelas conforme condição de pagamento), vinculada por `pedido_compra_id`. Botão "Gerar financeiro" no PC.
- **Faturamento de Cliente** (componente `FaturamentoSection`) → ao salvar com NF, gera Conta a Receber automática vinculada por `faturamento_id` e `contrato_id`. Baixa do recebimento marca `pago=true` no faturamento.
- **Medições de Serviço** (já existe export de pagamento) → opção "Lançar como Conta a Pagar em lote" para fornecedores selecionados.
- Todos os vínculos são **idempotentes** (não duplicam se já existir).

### Permissões (`financeiro.*`)

Adicionar 13 chaves no `PerfisAcessoContext` mapeadas em UI:
- `financeiro.dashboard`
- `financeiro.contas_pagar.ver` / `.criar` / `.editar` / `.baixar` / `.excluir`
- `financeiro.contas_receber.ver` / `.criar` / `.editar` / `.baixar` / `.excluir`
- `financeiro.contas_bancarias`
- `financeiro.plano_contas`
- `financeiro.centro_custo`
- `financeiro.fluxo_caixa`
- `financeiro.dre`
- `financeiro.conciliacao`

`temModulo("financeiro")` controla aparição do grupo no Sidebar.

### Banco de dados (migration única)

Tabelas (todas com `id uuid pk`, `created_at`, `updated_at`, RLS pública igual ao padrão do projeto):

- `fin_contas_bancarias` (nome, banco, agencia, conta, tipo, saldo_inicial numeric, ativo bool)
- `fin_plano_contas` (codigo, nome, tipo enum receita|despesa, parent_id, ativo)
- `fin_centros_custo` (codigo, nome, cliente_id?, ativo)
- `fin_contas_pagar` (descricao, fornecedor_id, valor_total, valor_pago, data_emissao, data_vencimento, data_pagamento, conta_bancaria_id?, plano_conta_id, centro_custo_id?, status enum aberta|paga|parcial|cancelada|vencida, parcela_num, parcela_total, recorrencia jsonb, anexo_url, observacao, pedido_compra_id?, origem text)
- `fin_contas_receber` (descricao, cliente_id, valor_total, valor_recebido, data_emissao, data_vencimento, data_recebimento, conta_bancaria_id?, plano_conta_id, centro_custo_id?, status enum aberta|recebida|parcial|cancelada|vencida, anexo_url, observacao, contrato_id?, faturamento_id?, origem text)
- `fin_lancamentos` (tipo enum entrada|saida|transferencia, conta_bancaria_id, conta_destino_id?, valor, data, descricao, conta_pagar_id?, conta_receber_id?, plano_conta_id?, centro_custo_id?, conciliado bool)
- `fin_movimentos_ofx` (conta_bancaria_id, fitid text unique por conta, data, valor, descricao, conciliado bool, lancamento_id?)

Trigger `update_updated_at_column` em todas. Sem CHECK de tempo. Status "vencida" calculado em runtime (não armazenado, evita cron).

### Frontend — estrutura

```text
src/
  contexts/
    FinanceiroContext.tsx       (carrega tudo + CRUD)
  pages/financeiro/
    DashboardFinanceiro.tsx
    ContasPagar.tsx
    ContasReceber.tsx
    ContasBancarias.tsx
    PlanoContas.tsx
    CentrosCusto.tsx
    FluxoCaixa.tsx
    Dre.tsx
    Conciliacao.tsx
    Lancamentos.tsx
  components/financeiro/
    BaixaPagamentoDialog.tsx
    BaixaRecebimentoDialog.tsx
    TransferenciaDialog.tsx
    ImportarOfxDialog.tsx
    KpiCardFinanceiro.tsx
  lib/
    ofxParser.ts                 (parser OFX simples client-side)
    gerarPdfDre.ts
    gerarExcelFluxoCaixa.ts
    financeiroFromPC.ts          (helper geração lançamentos)
    financeiroFromFaturamento.ts
```

Rotas adicionadas em `App.tsx` sob `/financeiro/*`. Grupo "Financeiro" no `AppSidebar` com ícone Wallet, controlado por `temModulo("financeiro")`.

### Padrões aplicados (memória do projeto)

- Tabelas paginadas (10/20/50), formulários auto-clear, comboboxes para clientes/fornecedores/plano de contas, datas `dd/mm/yyyy`, valores BRL com vírgula→ponto, DoubleConfirmDelete em todas as exclusões, filtros persistidos em localStorage, semantic tokens Tailwind.

### O que NÃO entra (ficaria para outra iteração)

- Emissão real de NFS-e/boletos (precisa API de prefeitura/banco).
- Integração com folha de pagamento automática.
- Conciliação automática via Open Finance.

### Ordem de execução

1. Migration (todas as tabelas + RLS pública + triggers updated_at).
2. `FinanceiroContext` + helpers.
3. Páginas de cadastro base (Contas Bancárias, Plano de Contas, Centros de Custo).
4. Contas a Pagar e Contas a Receber + diálogos de baixa.
5. Lançamentos + Fluxo de Caixa + DRE.
6. Conciliação OFX.
7. Dashboard.
8. Integração com PC (botão "Gerar financeiro") e Faturamento (auto-gera conta a receber).
9. Sidebar + permissões + rotas.

Confirme para eu iniciar.