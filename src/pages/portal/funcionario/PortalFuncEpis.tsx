import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function PortalFuncEpis() {
  return (
    <PortalLayout requireTipo="funcionario">
      <h1 className="text-2xl font-semibold mb-4">Confirmação de EPIs</h1>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground space-y-2">
          <p>A confirmação de recebimento de EPIs é feita por um link exclusivo enviado por WhatsApp pelo RH quando há novos itens a serem recebidos.</p>
          <p>Consulte a mensagem enviada em seu WhatsApp cadastrado. Se você não recebeu, procure o RH.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
