import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const fmtCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export default function PortalLogin() {
  const { user, login } = usePortalAuth();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to={user.tipo === "funcionario" ? "/portal/funcionario" : "/portal/candidato"} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(cpf, senha);
      toast.success("Bem-vindo!");
    } catch (err: any) {
      toast.error(err.message || "Falha no login");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Portal LASANT</CardTitle>
          <p className="text-sm text-center text-muted-foreground">Colaboradores e Candidatos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(fmtCpf(e.target.value))} placeholder="000.000.000-00" required />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-sm text-center space-y-1">
              <Link to="/portal/cadastrar-senha" className="text-primary hover:underline block">Primeiro acesso? Criar senha</Link>
              <Link to="/portal/esqueci-senha" className="text-muted-foreground hover:underline block">Esqueci minha senha</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
