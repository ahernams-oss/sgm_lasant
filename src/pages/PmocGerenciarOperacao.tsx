import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PmocGerenciarOperacao() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Gerenciar Operação</h1>
      <Card>
        <CardHeader>
          <CardTitle>PMOC - Gerenciar Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve: ferramentas para gerenciar a operação dos planos PMOC.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
