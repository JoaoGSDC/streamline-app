"use client";

import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewType = "daily" | "weekly" | "monthly";

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-2 p-1 bg-card/50  border border-border">
      <Button
        variant={currentView === "daily" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("daily")}
        className={
          currentView === "daily"
            ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(145,70,255,0.4)]"
            : "text-muted-foreground hover:text-foreground"
        }
      >
        <Calendar className="h-4 w-4 mr-2" />
        Diário
      </Button>
      <Button
        variant={currentView === "weekly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("weekly")}
        className={
          currentView === "weekly"
            ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(145,70,255,0.4)]"
            : "text-muted-foreground hover:text-foreground"
        }
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        Semanal
      </Button>
      <Button
        variant={currentView === "monthly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("monthly")}
        className={
          currentView === "monthly"
            ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(145,70,255,0.4)]"
            : "text-muted-foreground hover:text-foreground"
        }
      >
        <CalendarRange className="h-4 w-4 mr-2" />
        Mensal
      </Button>
    </div>
  );
};
