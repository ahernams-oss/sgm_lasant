import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface Conversa {
  id: string;
  tipo: "direta" | "grupo";
  titulo: string;
  criadoPor: string;
  createdAt: string;
  participantes: Participante[];
  ultimaMensagem?: Mensagem;
}

export interface Participante {
  id: string;
  conversaId: string;
  usuarioNome: string;
  usuarioEmail: string;
}

export interface Mensagem {
  id: string;
  conversaId: string;
  remetenteNome: string;
  remetenteEmail: string;
  conteudo: string;
  createdAt: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: string;
  criadoPor: string;
  ativo: boolean;
  createdAt: string;
  leituras: AvisoLeitura[];
  destinatariosEmails: string[];
  gruposIds: string[];
}

export interface AvisoLeitura {
  id: string;
  avisoId: string;
  usuarioNome: string;
  usuarioEmail: string;
  lidoEm: string;
}

export interface Grupo {
  id: string;
  nome: string;
  descricao: string;
  membrosEmails: string[];
  criadoPor: string;
  createdAt: string;
}

export interface Notificacao {
  id: string;
  destinatarioNome: string;
  destinatarioEmail: string;
  titulo: string;
  descricao: string;
  tipo: string;
  lida: boolean;
  criadoPor: string;
  createdAt: string;
}

interface ComunicacaoContextType {
  conversas: Conversa[];
  mensagens: Mensagem[];
  avisos: Aviso[];
  notificacoes: Notificacao[];
  grupos: Grupo[];
  loadMensagens: (conversaId: string) => Promise<void>;
  addConversa: (data: any) => Promise<any>;
  addParticipante: (data: any) => Promise<void>;
  addMensagem: (data: any) => Promise<void>;
  addAviso: (data: any) => Promise<void>;
  updateAviso: (id: string, data: any) => Promise<void>;
  deleteAviso: (id: string) => Promise<void>;
  confirmarLeitura: (data: any) => Promise<void>;
  addNotificacao: (data: any) => Promise<void>;
  marcarNotificacaoLida: (id: string) => Promise<void>;
  deleteNotificacao: (id: string) => Promise<void>;
  deleteConversa: (id: string) => Promise<void>;
  loadConversas: () => Promise<void>;
  loadAvisos: () => Promise<void>;
  loadNotificacoes: () => Promise<void>;
  loadGrupos: () => Promise<void>;
  addGrupo: (data: { nome: string; descricao?: string; membros_emails: string[]; criado_por: string }) => Promise<void>;
  updateGrupo: (id: string, data: { nome?: string; descricao?: string; membros_emails?: string[] }) => Promise<void>;
  deleteGrupo: (id: string) => Promise<void>;
}

const ComunicacaoContext = createContext<ComunicacaoContextType | undefined>(undefined);

export function ComunicacaoProvider({ children }: { children: ReactNode }) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const loadGrupos = useCallback(async () => {
    const data = await fetchAll("comunicacao_grupos", "created_at");
    setGrupos(data.reverse().map((g: any) => ({
      id: g.id,
      nome: g.nome ?? "",
      descricao: g.descricao ?? "",
      membrosEmails: Array.isArray(g.membros_emails) ? g.membros_emails : [],
      criadoPor: g.criado_por ?? "",
      createdAt: g.created_at ?? "",
    })));
  }, []);

  const addGrupo = async (data: any) => {
    await insertRow("comunicacao_grupos", data);
    await loadGrupos();
  };

  const updateGrupo = async (id: string, data: any) => {
    await updateRow("comunicacao_grupos", id, data);
    await loadGrupos();
  };

  const deleteGrupo = async (id: string) => {
    await deleteRow("comunicacao_grupos", id);
    await loadGrupos();
  };

  const loadConversas = useCallback(async () => {
    const convData = await fetchAll("comunicacao_conversas", "created_at");
    const partData = await fetchAll("comunicacao_participantes", "created_at");
    
    const mapped: Conversa[] = convData.map((c: any) => ({
      id: c.id,
      tipo: c.tipo ?? "direta",
      titulo: c.titulo ?? "",
      criadoPor: c.criado_por ?? "",
      createdAt: c.created_at ?? "",
      participantes: partData
        .filter((p: any) => p.conversa_id === c.id)
        .map((p: any) => ({
          id: p.id,
          conversaId: p.conversa_id,
          usuarioNome: p.usuario_nome ?? "",
          usuarioEmail: p.usuario_email ?? "",
        })),
    }));
    setConversas(mapped.reverse());
  }, []);

  const loadMensagens = useCallback(async (conversaId: string) => {
    const { data, error } = await (supabase as any)
      .from("comunicacao_mensagens")
      .select("*")
      .eq("conversa_id", conversaId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setMensagens(data.map((m: any) => ({
        id: m.id,
        conversaId: m.conversa_id,
        remetenteNome: m.remetente_nome ?? "",
        remetenteEmail: m.remetente_email ?? "",
        conteudo: m.conteudo ?? "",
        createdAt: m.created_at ?? "",
      })));
    }
  }, []);

  const loadAvisos = useCallback(async () => {
    const avData = await fetchAll("comunicacao_avisos", "created_at");
    const leitData = await fetchAll("comunicacao_avisos_leitura", "lido_em");
    
    setAvisos(avData.reverse().map((a: any) => ({
      id: a.id,
      titulo: a.titulo ?? "",
      conteudo: a.conteudo ?? "",
      prioridade: a.prioridade ?? "Normal",
      criadoPor: a.criado_por ?? "",
      ativo: a.ativo ?? true,
      createdAt: a.created_at ?? "",
      leituras: leitData
        .filter((l: any) => l.aviso_id === a.id)
        .map((l: any) => ({
          id: l.id,
          avisoId: l.aviso_id,
          usuarioNome: l.usuario_nome ?? "",
          usuarioEmail: l.usuario_email ?? "",
          lidoEm: l.lido_em ?? "",
        })),
      destinatariosEmails: Array.isArray(a.destinatarios_emails) ? a.destinatarios_emails : [],
      gruposIds: Array.isArray(a.grupos_ids) ? a.grupos_ids : [],
    })));
  }, []);

  const loadNotificacoes = useCallback(async () => {
    const data = await fetchAll("comunicacao_notificacoes", "created_at");
    setNotificacoes(data.reverse().map((n: any) => ({
      id: n.id,
      destinatarioNome: n.destinatario_nome ?? "",
      destinatarioEmail: n.destinatario_email ?? "",
      titulo: n.titulo ?? "",
      descricao: n.descricao ?? "",
      tipo: n.tipo ?? "tarefa",
      lida: n.lida ?? false,
      criadoPor: n.criado_por ?? "",
      createdAt: n.created_at ?? "",
    })));
  }, []);

  useEffect(() => {
    loadConversas();
    loadAvisos();
    loadNotificacoes();
    loadGrupos();
  }, [loadConversas, loadAvisos, loadNotificacoes, loadGrupos]);

  // Realtime for messages
  useEffect(() => {
    const channel = supabase
      .channel("comunicacao-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicacao_mensagens" }, () => {
        // Reload mensagens if we have a current conversa
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicacao_avisos" }, () => {
        loadAvisos();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicacao_notificacoes" }, () => {
        loadNotificacoes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAvisos, loadNotificacoes]);

  const addConversa = async (data: any) => {
    const result = await insertRow("comunicacao_conversas", data);
    await loadConversas();
    return result;
  };

  const addParticipante = async (data: any) => {
    await insertRow("comunicacao_participantes", data);
    await loadConversas();
  };

  const addMensagem = async (data: any) => {
    await insertRow("comunicacao_mensagens", data);
  };

  const addAviso = async (data: any) => {
    await insertRow("comunicacao_avisos", data);
    await loadAvisos();
  };

  const updateAviso = async (id: string, data: any) => {
    await updateRow("comunicacao_avisos", id, data);
    await loadAvisos();
  };

  const deleteAviso = async (id: string) => {
    await deleteRow("comunicacao_avisos", id);
    await loadAvisos();
  };

  const confirmarLeitura = async (data: any) => {
    const { data: existing } = await (supabase as any)
      .from("comunicacao_avisos_leitura")
      .select("id")
      .eq("aviso_id", data.aviso_id)
      .eq("usuario_email", data.usuario_email)
      .maybeSingle();
    if (existing) return;
    await insertRow("comunicacao_avisos_leitura", data);
    await loadAvisos();
  };

  const addNotificacao = async (data: any) => {
    await insertRow("comunicacao_notificacoes", data);
    await loadNotificacoes();
  };

  const marcarNotificacaoLida = async (id: string) => {
    await updateRow("comunicacao_notificacoes", id, { lida: true });
    await loadNotificacoes();
  };

  const deleteNotificacao = async (id: string) => {
    await deleteRow("comunicacao_notificacoes", id);
    await loadNotificacoes();
  };

  const deleteConversa = async (id: string) => {
    await deleteRow("comunicacao_conversas", id);
    await loadConversas();
  };

  return (
    <ComunicacaoContext.Provider value={{
      conversas, mensagens, avisos, notificacoes,
      loadMensagens, addConversa, addParticipante, addMensagem,
      addAviso, updateAviso, deleteAviso, confirmarLeitura,
      addNotificacao, marcarNotificacaoLida, deleteNotificacao,
      deleteConversa, loadConversas, loadAvisos, loadNotificacoes,
    }}>
      {children}
    </ComunicacaoContext.Provider>
  );
}

export function useComunicacao() {
  const ctx = useContext(ComunicacaoContext);
  if (!ctx) throw new Error("useComunicacao must be used within ComunicacaoProvider");
  return ctx;
}
