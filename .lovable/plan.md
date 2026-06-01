
# Pregão Eletrônico — Plano de implementação

Novo módulo dentro de **Compras e Suprimentos**, com sala de disputa em tempo real, anonimato controlado e papel de **Pregoeiro** distinto do fornecedor.

## 1. Papéis e permissões

Novas chaves no perfil de acesso:
- `pregao.visualizar` — ver lista e acompanhar sessão pública
- `pregao.criar` — criar/editar pregão em rascunho
- `pregao.pregoeiro` — conduzir sessão (abrir lances, suspender, habilitar, adjudicar)
- `pregao.homologar` — homologação final (gestor)

Fornecedor usa o **Portal do Fornecedor** já existente (login e-mail+senha). Acrescentaremos a aba **"Pregões disponíveis"**.

## 2. Fluxo geral

```text
Rascunho → Publicado → Credenciamento aberto → Propostas iniciais →
Sessão de disputa (anônima) → Encerrada → Habilitação (documentação) →
Adjudicação → Homologação → Encerrado
```

- **Anonimato:** durante "Sessão de disputa", fornecedores se enxergam como "Licitante 01, Licitante 02…" (mapeamento aleatório fixo por pregão). Pregoeiro vê tudo. Ao **Encerrar disputa**, o pregoeiro clica em "Tornar resultado público" e os nomes reais passam a aparecer para todos.
- **Habilitação:** após encerrar a disputa, pregoeiro analisa documentos do 1º colocado; se inabilitar, convoca o próximo, e assim por diante.

## 3. Modalidades (escolhidas ao criar o pregão)

- **Aberto:** tempo inicial X min + prorrogação automática de 2 min sempre que houver lance nos últimos 2 min.
- **Aberto-Fechado:** fase aberta + 3 melhores enviam proposta final lacrada (campo único, revelado só ao fechar).
- **Fechado:** todos enviam 1 proposta lacrada antes da abertura; ao bater a hora, sistema abre tudo e ordena.

## 4. Estrutura por item ou lote

Ao montar o edital, o pregoeiro escolhe por item:
- **Item isolado** — disputa própria, vencedor próprio.
- **Lote** — disputa pelo valor total do lote; preço unitário é registrado depois.

## 5. Cadastro do pregão (pregoeiro)

Aba **Dados gerais:** número (auto NN-YYYY), objeto, modalidade, tipo (item/lote/misto), datas (publicação, abertura credenciamento, abertura propostas, início disputa), critério de julgamento (menor preço), termo de participação (rich text), valor estimado total (sigiloso ou público).

Aba **Itens/Lotes:** material (combobox do catálogo `materiais_servicos`), qtd, unidade, preço de referência (sigiloso por padrão), agrupamento em lote.

Aba **Documentos exigidos para habilitação:** checklist configurável (CNPJ, CND federal, FGTS, atestados, etc.).

Aba **Termo de participação:** texto que o fornecedor precisa aceitar (registro de aceite com IP + data/hora + hash).

Aba **Fornecedores:** lista somente leitura dos credenciados (vai sendo populada).

## 6. Sala de disputa (rota `/compras/pregao/:id/sala`)

Layout em 3 painéis:
- **Esquerda:** lista de itens/lotes do pregão com status (aguardando, em disputa, encerrado, suspenso).
- **Centro:** item em disputa — melhor lance atual, cronômetro, ranking anônimo dos 10 melhores, campo "Dar lance" (fornecedor) ou painel de comando (pregoeiro: Abrir, Suspender, Reabrir, Encerrar, Próximo item, Mensagem ao chat).
- **Direita:** chat oficial do pregão (mensagens do pregoeiro são públicas; fornecedores se identificam como "Licitante NN").

**Regras de lance:**
- Lance precisa ser estritamente menor que o melhor atual (ou menor que o último do próprio fornecedor, a critério da configuração).
- Decremento mínimo configurável (R$ ou %).
- Lance é gravado e propagado por Realtime do Supabase.

**Realtime:** habilitar `supabase_realtime` para tabelas `pregao_lances`, `pregao_itens`, `pregao_mensagens`. Frontend assina e atualiza UI ao vivo.

## 7. Após encerrar disputa

1. Pregoeiro clica **"Encerrar e divulgar"** → status muda para `Habilitacao`, anonimato é removido, todos passam a ver os nomes reais.
2. **Habilitação:** pregoeiro vê documentos enviados pelo 1º colocado (lista da Aba 4), marca cada item como **Aprovado/Reprovado** com observação. Se inabilitado, sistema convoca o próximo automaticamente.
3. **Adjudicação:** pregoeiro confirma vencedor por item/lote.
4. **Homologação:** gestor com permissão `pregao.homologar` finaliza. Pode gerar **RC (Requisição de Compras)** automática para o vencedor reaproveitando o catálogo existente.

## 8. Notificações automáticas (WhatsApp ChatPro + e-mail)

- Publicação do pregão → fornecedores ativos
- 1h antes da abertura → credenciados
- Início da disputa → credenciados
- Suspensão/reabertura → credenciados
- Convocação para habilitação → 1º colocado
- Resultado homologado → todos os participantes

## 9. Banco de dados (migration nova)

Tabelas (todas com `GRANT` + RLS pública seguindo padrão do projeto):
- `pregoes` — cabeçalho do pregão
- `pregao_itens` — itens/lotes; FK `pregao_id`, campo `lote_id` (nullable) para agrupar
- `pregao_documentos_exigidos` — checklist de habilitação
- `pregao_participantes` — fornecedor credenciado + apelido anônimo + aceite (IP, hash, timestamp) + status (credenciado/desclassificado/inabilitado/habilitado/vencedor)
- `pregao_propostas_iniciais` — proposta inicial por item por fornecedor
- `pregao_lances` — cada lance (pregao_id, item_id, participante_id, valor, ts)
- `pregao_propostas_fechadas` — fase fechada do modelo Aberto-Fechado
- `pregao_habilitacao` — análise documental (documento, status, observação, anexo_url)
- `pregao_mensagens` — chat oficial
- `pregao_eventos` — auditoria (abriu, suspendeu, encerrou, prorrogou, etc.)

Triggers de numeração anual seguindo padrão `set_next_*_numero` já em uso.

Storage bucket novo: `pregao-documentos` (público, igual aos demais).

## 10. Frontend

Estrutura nova:
- `src/contexts/PregaoContext.tsx`
- `src/pages/pregao/Pregoes.tsx` — grid de pregões
- `src/pages/pregao/PregaoForm.tsx` — criação/edição (tabs)
- `src/pages/pregao/PregaoSala.tsx` — sala de disputa (pregoeiro + fornecedor; UI condicional pelo papel)
- `src/pages/pregao/PregaoHabilitacao.tsx`
- `src/pages/pregao/PregaoResultado.tsx` — público, pós-divulgação
- `src/pages/portal-fornecedor/PortalPregoes.tsx` — listagem para o fornecedor logado
- `src/lib/gerarPdfAtaPregao.ts` — Ata da sessão (PDF Lasant)

Item de menu novo no `AppSidebar` em **Compras e Suprimentos → Pregão Eletrônico**, controlado por `temModulo("pregao")`. Rota também adicionada em `accessRoutes.ts`.

## 11. Auditoria e segurança

- Cada lance, mensagem e ação de pregoeiro grava em `pregao_eventos` (ator, ip, ts, payload).
- Anonimato: backend nunca devolve `fornecedor_id` real durante `status='Disputa'`; só o apelido. Função RPC `pregao_ranking_anonimo(pregao_id, item_id)` retorna ranking sem expor identidades.
- Aceite do termo: hash SHA-256 do texto + IP + timestamp, gravado no `pregao_participantes`.
- DoubleConfirmDelete para excluir pregão em rascunho; pregão publicado **não pode ser excluído**, apenas cancelado com motivo.

## 12. Entregas em fases (sugiro implementar nesta ordem)

1. **Fase 1 — Schema + cadastro:** migration, contexto, CRUD do pregão e itens, termo de participação, menu/permissões, credenciamento do fornecedor no portal.
2. **Fase 2 — Sala de disputa:** Realtime, lances, anonimato, 3 modalidades, cronômetro com prorrogação.
3. **Fase 3 — Pós-disputa:** habilitação, adjudicação, homologação, geração de RC automática, Ata em PDF, notificações WhatsApp/e-mail.

Posso começar pela **Fase 1** assim que você aprovar.
