## Objetivo
Implementar o Laudo Técnico de Condenação de Equipamentos, com persistência em banco, geração de PDF, editor de fotos com marcadores numerados e integração ao cadastro de Equipamentos.

## 1. Banco de dados

**Nova tabela** `public.equipamentos_laudos_condenacao`:
- `equipamento_id` (FK)
- `numero` (int, auto-incremento anual via trigger)
- `data_emissao`, `data_inspecao`, `local_inspecao`
- `responsavel_tecnico`, `registro_profissional` (CFT/CREA)
- Snapshot do equipamento: tipo, marca, modelo, serie, patrimonio, ano_fabricacao, data_aquisicao, localizacao, estado_conservacao
- `historico` (text)
- `insp_condicoes_fisicas`, `insp_condicoes_eletricas`, `insp_condicoes_mecanicas`, `insp_funcionalidade` (text)
- `motivos_condenacao` (jsonb - array de strings)
- `custo_reparo`, `valor_residual`, `valor_novo_equivalente` (numeric)
- `parecer` ("APROVADO PARA CONDENAÇÃO" | "REPROVADO")
- `conclusao_condicoes` (text curto)
- `fotos` (jsonb) — array com `{path, url, descricao, marcadores:[{n, x, y, tipo:"seta"|"circulo", legenda}]}`, máx 10
- `anexos_orcamentos` (jsonb) — array `{nome,path,url,tamanho}`
- `outros_anexos` (jsonb)
- `created_at`, `updated_at`, `created_by`
- GRANT SELECT/INSERT/UPDATE/DELETE authenticated + service_role
- RLS enabled + policy `USING (true)` (padrão do projeto)
- Trigger `set_next_laudo_condenacao_numero` (reset anual, igual RDO)

Reusar bucket `documentos` com prefixo `laudos-condenacao/`.

## 2. Editor de fotos com marcadores

Novo componente `FotosLaudoEditor.tsx`:
- Upload de até 10 fotos (validação, máx 4MB cada)
- Preview em grid, cada foto tem campo "Descrição"
- Botão "Editar marcadores" abre dialog com `<canvas>` sobreposto à imagem
- Clique no canvas adiciona marcador numerado (círculo com número) na posição clicada; coords normalizadas 0-1
- Toggle tipo: círculo / seta
- Lista lateral com nº, legenda editável e botão remover
- Salva marcadores no state da foto; renderização final via canvas → dataURL para o PDF

## 3. Dialog do Laudo

Novo componente `LaudoCondenacaoDialog.tsx` com abas:
1. **Identificação** — auto-preenchida do equipamento (editável), + responsável técnico e registro
2. **Histórico** — textarea grande
3. **Inspeção** — 4 textareas (físicas, elétricas, mecânicas, funcionalidade)
4. **Fundamentação** — lista dinâmica de motivos + campos de viabilidade econômica (custo reparo, valor residual, % calculado automaticamente, indicativo viável/inviável)
5. **Conclusão** — parecer (select), data/local inspeção
6. **Anexos** — editor de fotos + upload de orçamentos + outros anexos

Rodapé: Salvar rascunho | Salvar e Gerar PDF | Cancelar.

Se parecer = "APROVADO PARA CONDENAÇÃO" ao salvar → `updateEquipamento(id, { situacao: "Condenado" })` (nova situação adicionada ao array `SITUACOES`).

## 4. Contexto

Novo `LaudosCondenacaoContext.tsx` com `useQuery`, `add/update/delete/listByEquipamento`. Provider em App.tsx.

## 5. Integrações no módulo Equipamentos

**Grid** (`Equipamentos.tsx`):
- Novo item no menu de ações: "Laudo de Condenação" (abre dialog)
- Card KPI "Condenados" (opcional)

**Cadastro do equipamento** (dialog de view/edit): nova aba **"Laudos"** com histórico de laudos emitidos, botões Visualizar/Imprimir/Novo.

## 6. Geração do PDF

Novo `src/lib/gerarPdfLaudoCondenacao.ts` (jsPDF + autoTable), seguindo padrão dos outros PDFs do projeto:
- Cabeçalho com logo empresa + "LAUDO TÉCNICO DE CONDENAÇÃO DE EQUIPAMENTOS"
- Blocos: Identificação (tabela 2 colunas), Histórico, Inspeção (4 subseções), Fundamentação (lista + tabela viabilidade), Conclusão, Assinatura
- Anexos: fotos renderizadas com marcadores desenhados sobre a imagem (via canvas → base64), 4 por página, com descrição
- Rodapé com nº laudo, data, página X/Y

## 7. Situação "Condenado"

- Adicionar `"Condenado"` à const `SITUACOES`
- Badge com variant destructive
- KPI "Condenados" nos cards do topo

## Arquivos a criar
- `supabase/migrations/xxxxx_laudos_condenacao.sql`
- `src/contexts/LaudosCondenacaoContext.tsx`
- `src/components/laudo/FotosLaudoEditor.tsx`
- `src/components/laudo/LaudoCondenacaoDialog.tsx`
- `src/components/laudo/LaudosHistoricoTab.tsx`
- `src/lib/gerarPdfLaudoCondenacao.ts`

## Arquivos a editar
- `src/App.tsx` (provider)
- `src/pages/Equipamentos.tsx` (menu ação + aba Laudos + situação Condenado + KPI)
- `src/contexts/EquipamentosContext.tsx` (sem mudança de schema)
- `src/integrations/supabase/types.ts` (regenerado após migration)

## Fora do escopo (para futura iteração)
- Assinatura eletrônica com hash (pode ser adicionada como no padrão OS)
- Numeração customizada por empresa/unidade