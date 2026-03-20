import { Users } from "lucide-react";

const Clientes = () => {
  return (
    <div className="bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Clientes</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Gerencie os clientes cadastrados no sistema.
          </p>
        </div>

        <div className="section-card animate-fade-up text-center py-16 text-muted-foreground text-sm">
          Nenhum cliente cadastrado ainda.
        </div>
      </div>
    </div>
  );
};

export default Clientes;