## Diagnóstico

Hoje **Planos**, **Atividades** e **Biblioteca** são 3 abas separadas no mesmo nível, dando a impressão de serem coisas independentes. Na prática elas têm uma relação hierárquica:

```
Biblioteca de Rotinas  →  Plano de Manutenção  →  Equipamento
   (modelos)              (agrupa atividades)     (recebe plano)
```

O usuário precisa pular entre abas para montar um plano completo, o que confunde.

## Nova estrutura proposta

### 1. Renomear e reorganizar as abas
Grupo **Planejamento** passa a ter apenas 2 abas, em ordem de uso:

- **Biblioteca de Rotinas** *(opcional, modelos reutilizáveis)*
- **Planos de Manutenção** *(onde tudo acontece)*

A aba **Atividades** deixa de existir como top-level — atividades passam a ser editadas **dentro** do plano ao qual pertencem.

### 2. Editor de Plano com atividades embutidas
Ao abrir/editar um Plano, a tela ganha 3 seções (acordeão ou abas internas):

1. **Dados do plano** — cliente, contrato, título, período de vigência, RT
2. **Atividades do plano** — lista as atividades já vinculadas + botão **"Adicionar atividade"** com duas opções:
   - **Da Biblioteca** (escolher rotina pronta — copia título, descrição, periodicidade padrão)
   - **Nova atividade** (criar do zero)
   Cada atividade pode ser editada/removida inline, com campos: descrição, equipamento, periodicidade, responsável.
3. **Equipamentos vinculados** — multi-select de equipamentos do cliente; ao salvar, o plano fica disponível para esses equipamentos (campo `plano_manutencao` em `equipamentos`).

### 3. Visibilidade no cadastro de Equipamento
No formulário de Equipamento, o campo "Plano de Manutenção" passa a ser um Select que lista os planos do cliente selecionado, com link "Ver plano" abrindo o editor em modo leitura.

### 4. Indicação visual do fluxo no PMOC
No topo do grupo **Planejamento**, adicionar um mini-stepper informativo:

```
1. Biblioteca → 2. Planos (atividades + equipamentos) → 3. Disponível em Equipamentos
```

## Detalhes técnicos

- Sem alteração de schema: `pmoc_planos`, `pmoc_atividades` (FK `plano_id`), `pmoc_biblioteca_rotinas` e `equipamentos.plano_manutencao` já suportam o fluxo.
- `PlanosTab` ganha um modo "editor expandido" que substitui a aba `AtividadesTab` standalone.
- `AtividadesTab` é removida da `TabsList`; a função interna fica reaproveitada como subcomponente do editor de plano (filtrada por `plano_id`).
- "Adicionar da biblioteca" faz um `SELECT` em `pmoc_biblioteca_rotinas` e cria um `INSERT` em `pmoc_atividades` copiando os campos.
- No `Equipamentos.tsx`, o campo `plano_manutencao` (hoje texto livre) vira `Select` com os planos do cliente atual.

## Fora do escopo

- Wizard cheio passo-a-passo (mantém edição livre, só guia visual).
- Mudar Qualidade do Ar, Inconformidades, OS, RT — continuam como estão.
- Migrar dados antigos do campo texto `plano_manutencao` em equipamentos.
