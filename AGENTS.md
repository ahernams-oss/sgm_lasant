# AGENTS.md

## Regras

- Grids com ordem de colunas salva usam `src/hooks/useColumnOrder.ts`; ao adicionar uma coluna, inclua a chave em `defaultKeys` na posição desejada — o hook insere colunas novas ao lado da coluna padrão vizinha (e não no fim) para preservar o layout pedido. Motivo: preferências antigas continuem válidas sem reposicionar a nova coluna fora do lugar.
