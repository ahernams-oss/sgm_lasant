import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-8 py-10 sm:px-10 sm:py-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/Logo_Lasant.png"
              alt="Lasant Construções"
              className="h-16 w-auto"
            />
          </div>

          {/* Título */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">
              Log in
            </h1>
            <span className="text-2xl font-bold text-foreground">SGM</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12 rounded-xl bg-[#faf9f6] border-border pr-10"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showSenha ? "text" : "password"}
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 rounded-xl bg-[#faf9f6] border-border pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              </div>
            </div>

            {/* Lembrar / Esqueci */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={lembrar}
                  onCheckedChange={(v) => setLembrar(v === true)}
                />
                Lembrar-me
              </label>
              <Link
                to="/esqueci-senha"
                className="text-sm text-foreground hover:underline font-medium"
              >
                Esqueci minha senha
              </Link>
            </div>

            {/* Botão */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-black hover:bg-black/90 text-white font-semibold text-base mt-2"
            >
              {loading ? "Entrando..." : "Continuar"}
            </Button>
          </form>

          {/* Rodapé */}
          <p className="text-xs text-muted-foreground text-center mt-8">
            Solicite suas credenciais ao administrador do sistema.
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          © {new Date().getFullYear()} LASANT CONSTRUÇÕES — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Login;
