import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Paperclip, UserPlus } from "lucide-react";
import { useClientes } from "@/contexts/ClientesContext";
import { Building2, FileText, Send } from "lucide-react";
import FormSection from "@/components/FormSection";
import CheckboxGroup from "@/components/CheckboxGroup";
import RadioGroupCustom from "@/components/RadioGroupCustom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCargos } from "@/contexts/CargosContext";
import { useRequisicoes } from "@/contexts/RequisicaoContext";

const jornadaOptions = ["Diarista", "Plantão Diurno - PAR", "Plantão Diurno - ÍMPAR", "Plantão Noturno - PAR", "Plantão Noturno - ÍMPAR"];
const contratacaoOptions = ["Efetivo", "Temporário", "PCD", "Estagiário"];
const internoExternoOptions = ["Interno", "Externo"];
const origemOptions = ["Afastamento", "Desligamento", "Aumento de Quadro", "Promoção", "Outros"];
const formacaoOptions = ["Ensino Fundamental", "Ensino Médio", "Ensino Superior", "Curso Técnico", "Outros"];
const experienciaOptions = ["Não Necessita", "Até 1 ano", "De 1 a 3 anos", "De 3 a 5 anos", "Acima de 5 anos"];

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

interface Indicado {
  nome: string;
  telefone: string;
  email: string;
  arquivo: File | null;
}

const emptyIndicado = (): Indicado => ({ nome: "", telefone: "", email: "", arquivo: null });

const RequisicaoForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { cargos } = useCargos();
  const { addRequisicao } = useRequisicoes();
  const { clientes } = useClientes();
  const [form, setForm] = useState({
    unidade: "",
    cargo: "",
    jornada: "",
    cargaHoraria: "",
    tipoContratacao: [] as string[],
    internoExterno: "",
    origemVaga: "",
    motivoOutros: "",
    // Colaborador substituído
    matricula: "",
    nomeSubstituido: "",
    cargoSubstituido: "",
    salarioSubstituido: "",
    dataDesligamento: "",
    // Qualificação
    formacao: [] as string[],
    formacaoDetalhe: "",
    experiencia: "",
    conhecimentoInformatica: "",
    atividadesCargo: "",
    salarioVaga: "",
  });

  const update = (field: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isAumentoQuadro = form.origemVaga === "Aumento de Quadro";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unidade || !form.cargo) {
      toast.error("Preencha ao menos a Unidade e o Cargo.");
      return;
    }
    const cargoObj = cargos.find((c) => c.id === form.cargo);
    addRequisicao({
      unidade: form.unidade,
      cargoNome: cargoObj ? `${cargoObj.nome}${cargoObj.nivel ? ` — Nível ${cargoObj.nivel}` : ""}` : form.cargo,
      jornada: form.jornada,
      tipoContratacao: form.tipoContratacao,
      origemVaga: form.origemVaga,
      nomeSubstituido: form.nomeSubstituido,
    });
    toast.success("Requisição enviada com sucesso!");
    onSuccess?.();
    setForm({
      unidade: "", cargo: "", jornada: "", cargaHoraria: "",
      tipoContratacao: [], internoExterno: "", origemVaga: "", motivoOutros: "",
      matricula: "", nomeSubstituido: "", cargoSubstituido: "",
      salarioSubstituido: "", dataDesligamento: "",
      formacao: [], formacaoDetalhe: "", experiencia: "",
      conhecimentoInformatica: "", atividadesCargo: "", salarioVaga: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Especificação da Vaga */}
      <FormSection title="Especificação da Vaga" delay={0}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Unidade</label>
            {clientes.length > 0 ? (
              <Select
                value={form.unidade}
                onValueChange={(v) => update("unidade", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Cadastre clientes primeiro"
                value={form.unidade}
                onChange={(e) => update("unidade", e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="field-label">Cargo</label>
            {cargos.length > 0 ? (
              <Select
                value={form.cargo}
                onValueChange={(cargoId) => {
                  const selected = cargos.find((c) => c.id === cargoId);
                  if (selected) {
                    setForm((prev) => ({
                      ...prev,
                      cargo: cargoId,
                      salarioVaga: selected.salario,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}{c.nivel ? ` — Nível ${c.nivel}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Cadastre cargos primeiro"
                value={form.cargo}
                onChange={(e) => update("cargo", e.target.value)}
              />
            )}
          </div>
          {form.cargo && cargos.find((c) => c.id === form.cargo)?.salario && (
            <div>
              <label className="field-label">Salário do Cargo</label>
              <Input
                readOnly
                value={`R$ ${cargos.find((c) => c.id === form.cargo)?.salario}`}
                className="bg-muted/50"
              />
            </div>
          )}
        </div>
      </FormSection>

      {/* Jornada de Trabalho */}
      <FormSection title="Jornada de Trabalho" delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Jornada</label>
            <Select value={form.jornada} onValueChange={(v) => update("jornada", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a jornada" />
              </SelectTrigger>
              <SelectContent>
                {jornadaOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.jornada === "Diarista" && (
            <div>
              <label className="field-label">Carga Horária</label>
              <Input
                placeholder="Ex: 44h semanais"
                value={form.cargaHoraria}
                onChange={(e) => update("cargaHoraria", e.target.value)}
              />
            </div>
          )}
        </div>
      </FormSection>

      {/* Tipo de Contratação */}
      <FormSection title="Tipo de Contratação" delay={160}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Modalidade</label>
            <Select value={form.tipoContratacao[0] || ""} onValueChange={(v) => update("tipoContratacao", [v])}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                {contratacaoOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="field-label">Recrutamento</label>
            <Select value={form.internoExterno} onValueChange={(v) => update("internoExterno", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {internoExternoOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      {/* Origem da Vaga */}
      <FormSection title="Origem da Vaga" delay={240}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Origem</label>
            <Select value={form.origemVaga} onValueChange={(v) => update("origemVaga", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {origemOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.origemVaga === "Outros" && (
            <div>
              <label className="field-label">Especifique o motivo</label>
              <Input
                value={form.motivoOutros}
                onChange={(e) => update("motivoOutros", e.target.value)}
              />
            </div>
          )}
        </div>
      </FormSection>

      {/* Colaborador Substituído */}
      {!isAumentoQuadro && (
        <FormSection title="Informações do Colaborador Substituído" delay={320}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Matrícula</label>
              <Input value={form.matricula} onChange={(e) => update("matricula", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Nome</label>
              <Input value={form.nomeSubstituido} onChange={(e) => update("nomeSubstituido", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Cargo</label>
              <Input value={form.cargoSubstituido} onChange={(e) => update("cargoSubstituido", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Salário (R$)</label>
              <Input value={form.salarioSubstituido} onChange={(e) => update("salarioSubstituido", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Data de Desligamento</label>
              <Input
                type="date"
                value={form.dataDesligamento}
                onChange={(e) => update("dataDesligamento", e.target.value)}
              />
            </div>
          </div>
        </FormSection>
      )}

      {/* Qualificação da Vaga */}
      <FormSection title="Qualificação da Vaga" delay={400}>
        <div className="space-y-5">
          <div>
            <label className="field-label">Formação Acadêmica</label>
            <Select value={form.formacao[0] || ""} onValueChange={(v) => update("formacao", [v])}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a formação" />
              </SelectTrigger>
              <SelectContent>
                {formacaoOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(form.formacao.includes("Ensino Superior") ||
              form.formacao.includes("Curso Técnico") ||
              form.formacao.includes("Outros")) && (
              <div className="mt-3 max-w-md">
                <label className="field-label">Especifique</label>
                <Input
                  placeholder="Qual formação?"
                  value={form.formacaoDetalhe}
                  onChange={(e) => update("formacaoDetalhe", e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="field-label">Tempo de Experiência</label>
            <Select value={form.experiencia} onValueChange={(v) => update("experiencia", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tempo de experiência" />
              </SelectTrigger>
              <SelectContent>
                {experienciaOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="field-label">Conhecimento em Informática</label>
            <Input
              placeholder="Descreva os conhecimentos necessários"
              value={form.conhecimentoInformatica}
              onChange={(e) => update("conhecimentoInformatica", e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      {/* Atividades do Cargo */}
      <FormSection title="Atividades do Cargo" delay={480}>
        <Textarea
          rows={5}
          placeholder="Descreva as principais atividades e responsabilidades do cargo..."
          value={form.atividadesCargo}
          onChange={(e) => update("atividadesCargo", e.target.value)}
          className="resize-none"
        />
      </FormSection>

      {/* Submit */}
      <div
        className="flex justify-end gap-3 animate-fade-up pt-2"
        style={{ animationDelay: "560ms" }}
      >
        <Button type="button" variant="outline" size="lg" className="px-6 rounded-lg" onClick={() => setForm({
          unidade: "", cargo: "", jornada: "", cargaHoraria: "",
          tipoContratacao: [], internoExterno: "", origemVaga: "", motivoOutros: "",
          matricula: "", nomeSubstituido: "", cargoSubstituido: "",
          salarioSubstituido: "", dataDesligamento: "",
          formacao: [], formacaoDetalhe: "", experiencia: "",
          conhecimentoInformatica: "", atividadesCargo: "", salarioVaga: "",
        })}>
          Limpar
        </Button>
        <Button type="submit" size="lg" className="gap-2 px-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <Send className="h-4 w-4" />
          Enviar Requisição
        </Button>
      </div>
    </form>
  );
};

export default RequisicaoForm;