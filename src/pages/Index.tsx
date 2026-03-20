import { FileText } from "lucide-react";
import RequisicaoForm from "@/components/RequisicaoForm";
import RequisicaoGrid from "@/components/RequisicaoGrid";

const Index = () => {
  return (
    <div className="bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Nova Requisição</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">RC — Requisição de Colaboradores</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Preencha os campos abaixo para solicitar a contratação de um novo colaborador.
          </p>
        </div>
        <RequisicaoForm />
        <div className="mt-8">
          <RequisicaoGrid />
        </div>
      </div>
    </div>
  );
};

export default Index;