import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const toneMap = {
  default: "from-primary/10 to-primary/5 text-primary",
  success: "from-emerald-100 to-emerald-50 text-emerald-700",
  warning: "from-amber-100 to-amber-50 text-amber-700",
  danger: "from-red-100 to-red-50 text-red-700",
  info: "from-blue-100 to-blue-50 text-blue-700",
};

export default function KpiCardFinanceiro({ title, value, subtitle, icon: Icon, tone = "default" }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardContent className={`p-4 bg-gradient-to-br ${toneMap[tone]}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium opacity-80">{title}</p>
            <p className="text-2xl font-serif font-semibold mt-1">{value}</p>
            {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
          </div>
          <Icon className="h-8 w-8 opacity-60" />
        </div>
      </CardContent>
    </Card>
  );
}
