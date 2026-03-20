import { Building2, FileText } from "lucide-react";
import RequisicaoForm from "@/components/RequisicaoForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground tracking-tight">
              Lasant Construções
            </h1>
            <p className="text-xs text-muted-foreground">
              RC — Requisição de Colaboradores
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Nova Requisição</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            Preencha os campos abaixo para solicitar a contratação de um novo colaborador.
          </p>
        </div>

        <RequisicaoForm />
      </main>
    </div>
  );
};

export default Index;