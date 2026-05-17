"use client";

import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewType = "daily" | "weekly" | "monthly";

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views: { id: ViewType; label: string; icon: typeof Calendar }[] = [
  { id: "daily", label: "Diário", icon: Calendar },
  { id: "weekly", label: "Semanal", icon: CalendarDays },
  { id: "monthly", label: "Mensal", icon: CalendarRange },
];

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="glass-panel flex gap-1 rounded-md p-1">
      {views.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={currentView === id ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(id)}
          className={cn(
            "rounded-sm transition-all duration-fast",
            currentView === id && "shadow-glow-cyan"
          )}
        >
          <Icon className="h-4 w-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
};
