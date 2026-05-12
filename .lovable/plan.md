## Objetivo
Aplicar verificação de permissão (`usePermissao().tem(key)`) em **todas** as páginas do sistema, garantindo que botões de criar/editar/excluir/exportar/aprovar/assinar fiquem ocultos e que os handlers correspondentes bloqueiem a ação com toast de erro caso o usuário não tenha a permissão definida no perfil.

## Padrão a aplicar (igual ao já feito em Ordens de Serviço)
Para cada página:
1. Importar `usePermissao` de `@/hooks/usePermissao`.
2. Declarar flags por ação: `const podeCriar = tem("modulo.criar")`, `podeEditar`, `podeExcluir`, etc.
3. **UI**: envolver os botões/itens de menu com `{podeXxx && (...)}`.
4. **Handler**: no início de cada função (`handleSave`, `handleDelete`, `handleExport`...) adicionar guarda:
   ```ts
   if (!podeXxx) { toast.error("Você não possui permissão para esta ação."); return; }
   ```
5. Cargos com acesso total (Diretor, Gerente Executivo, Coordenador de Departamento) continuam liberados via lógica já existente em `usePermissao`.

## Entrega em lotes (para você revisar e validar a cada etapa)

**Lote 1 — Engenharia (crítico)**
- SolicitacaoServicos, OrdensServico (revisar todas as ações além do delete já feito), MedicoesServicos, Cronograma, Rdo, PlanoManutencao, Pmoc, Bim, ResponsaveisTecnicos, AssinarLoteOs, AssinarLotePc, ConfirmarLoteOs, ValidarLoteOs, ImprimirLoteOs, AprovarLoteSS

**Lote 2 — Compras e Suprimentos**
- RequisicaoCompras, CotacaoCompras, PedidoCompra, RecebimentoCompras, Estoque, RelatoriosEstoque, InteligenciaCompras, CategoriasCompras, MateriaisServicos, Fabricantes, DashboardCompras

**Lote 3 — Financeiro**
- DashboardFinanceiro, ContasPagar, ContasReceber, ContasBancarias, PlanoContas, CentrosCusto, FluxoCaixa, Dre, Conciliacao, Lancamentos, CondicoesPagamento, RelatoriosFinanceiros

**Lote 4 — Cadastros**
- Clientes, Fornecedores, Cargos, Sco, OrcamentosSco, CatalogoSco, I0, Equipamentos, CategoriasServicosPage, ServicosPage

**Lote 5 — Gestão de Pessoas**
- RequisicaoPessoal (RequisicaoContext pages), ProcessosSeletivos/ProcessoSeletivo, Funcionarios, MapaFuncionarios, AvaliacoesDesempenho, EpisPage, ExamesPage, MapaPlantoes

**Lote 6 — Demais (Licitações, Jurídico, Patrimônio, Qualidade, Comunicação, Administração, Base de Conhecimento) + Proteção de Rotas**
- Licitacoes, Juridico, Ferramentas, Evidencias, Checklists, ComunicacaoMensagens, ComunicacaoAvisos, ComunicacaoNotificacoes, ComunicacaoWhatsapp, ChatDuda, EmpresaDados, Usuarios, PerfisAcesso, MonitorTV, BaseConhecimento
- **Proteção de rotas (concluído nesta etapa)**: novo componente `RotaProtegida` (`src/components/RotaProtegida.tsx`) que envolve cada `<Route>` em `App.tsx` e bloqueia o acesso direto via URL para usuários sem a permissão do módulo correspondente, exibindo tela "Acesso negado". Cargos com acesso total continuam liberados.

## Detalhes técnicos
- Apenas frontend (sem edge functions adicionais nesta rodada).
- Não altero RLS do Supabase (auth é `public/anon` por padrão neste projeto).
- Não toco em layout, apenas em renderização condicional + early-return nos handlers.
- Para cada página ausente de mapeamento de chave (caso surja), usarei a chave já definida em `MODULOS_SISTEMA` em `PerfisAcessoContext.tsx` — nada de inventar chaves novas.

## Como validar
Após cada lote:
- Logar com perfil restrito (ex.: viviane@rio.com / Cliente Solicitante) e confirmar que botões somem e ações bloqueadas mostram toast.
- Logar com cargo de acesso total e confirmar que tudo continua acessível.

## Aviso importante
Como ficou definido "só frontend", **um usuário com conhecimento técnico ainda consegue burlar pelo console/devtools** (chamando `supabase.from(...).delete()` direto). A blindagem real exige edge functions + RLS — recomendo fortemente fazer isso depois do Lote 1, ao menos para deletes financeiros/contratos. Posso seguir com a auditoria frontend agora e abrir essa etapa server-side em seguida.