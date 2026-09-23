import DashboardKpiCard from "@/components/dashboard/DashboardKpiCard";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  trend?: number | null;
  onClick?: () => void;
}

const toneIdx: Record<NonNullable<Props["tone"]>, number> = {
  default: 0,
  success: 1,
  warning: 2,
  danger: 3,
  info: 5,
};

/** Reduz a fonte conforme o tamanho do texto para o valor nunca ficar cortado. */
const tamanhoValor = (v: string) => {
  const n = (v ?? "").length;
  if (n <= 9) return "text-xl";
  if (n <= 13) return "text-lg";
  if (n <= 17) return "text-base";
  return "text-sm";
};

export default function KpiCardFinanceiro({ title, value, subtitle, icon, tone = "default", trend, onClick }: Props) {
  return (
    <DashboardKpiCard
      icon={icon}
      label={title}
      value={value}
      valueClassName={tamanhoValor(value)}
      subtitle={subtitle}
      trend={trend}
      onClick={onClick}
      gradientIdx={toneIdx[tone]}
    />
  );
}
