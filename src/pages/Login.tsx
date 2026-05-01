import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const success = login(email, senha, lembrar);
      setLoading(false);
      if (success) {
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        toast.error("E-mail ou senha inválidos.");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/Logo_Lasant.png"
            alt="Lasant Logo"
            className="h-16 w-auto mb-4"
          />
          <h1 className="text-xl font-bold text-foreground">Bem-vindo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faça login para acessar o sistema
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              E-mail
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Senha
            </label>
            <div className="relative">
              <Input
                type={showSenha ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={lembrar}
                onCheckedChange={(v) => setLembrar(v === true)}
              />
              Lembrar-me
            </label>
            <Link
              to="/esqueci-senha"
              className="text-xs text-primary hover:underline font-medium"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          Solicite suas credenciais ao administrador do sistema.
        </p>
      </div>
    </div>
  );
};

export default Login;
