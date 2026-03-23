import { UserCheck } from "lucide-react";

const Funcionarios = () => {
  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Funcionários</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Gerencie o cadastro de funcionários da empresa.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Em breve — cadastro de funcionários.
        </div>
      </div>
    </div>
  );
};

export default Funcionarios;
