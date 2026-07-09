import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

export type StatusLevel = "Healthy" | "Attention" | "Critical";

interface StatusIconProps {
  status: StatusLevel;
  size?: number;
  className?: string;
}

export default function StatusIcon({ status, size = 16, className = "" }: StatusIconProps) {
  switch (status) {
    case "Healthy":
      return <CheckCircle2 size={size} strokeWidth={2.5} color="var(--green-primary)" className={className} />;
    case "Attention":
      return <Info size={size} strokeWidth={2.5} color="var(--orange-primary)" className={className} />;
    case "Critical":
      return <AlertTriangle size={size} strokeWidth={2.5} color="var(--red-primary)" className={className} />;
    default:
      return null;
  }
}
