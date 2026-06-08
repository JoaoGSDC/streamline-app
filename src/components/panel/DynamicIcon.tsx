import { cn } from "@/lib/utils";
import { getPanelFeatureIcon } from "@features/admin/lib/panel-icons";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon = getPanelFeatureIcon(name);
  return <Icon className={cn(className)} aria-hidden />;
}
