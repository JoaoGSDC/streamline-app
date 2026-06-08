"use client";

import type { BotCommandBypassCooldownRole } from "@server/bot/bot-command.types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleSection } from "./CollapsibleSection";
import type { CommandFormBinding } from "./command-form.types";
import { capitalizeRole, permissionSummary } from "./command-form.utils";

const PERM_OPTIONS = [
  { value: "everyone", label: "Todos" },
  { value: "follower", label: "Seguidores" },
  { value: "subscriber", label: "Inscritos" },
  { value: "vip", label: "VIPs" },
  { value: "moderator", label: "Moderadores" },
  { value: "streamer", label: "Streamer" },
] as const;

const BYPASS_OPTIONS: BotCommandBypassCooldownRole[] = [
  "subscriber",
  "vip",
  "moderator",
  "streamer",
];

export function PermissionSection({
  command,
  onChange,
  disabled = false,
}: CommandFormBinding) {
  const sectionDisabled = disabled;

  const toggleBypass = (
    role: BotCommandBypassCooldownRole,
    checked: boolean
  ) => {
    const current = command.bypassCooldownFor;
    onChange({
      bypassCooldownFor: checked
        ? [...current, role]
        : current.filter((item) => item !== role),
    });
  };

  return (
    <CollapsibleSection
      title="Quem pode usar"
      subtitle={permissionSummary(command)}
    >
      <div className="space-y-1.5 mb-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Nível mínimo
        </Label>
        <Select
          value={command.minPermission}
          disabled={sectionDisabled}
          onValueChange={(value) =>
            onChange({
              minPermission: value as typeof command.minPermission,
            })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Ignorar cooldown para
        </Label>
        <div className="flex flex-wrap gap-2">
          {BYPASS_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Checkbox
                checked={command.bypassCooldownFor.includes(option)}
                disabled={sectionDisabled}
                onCheckedChange={(checked) =>
                  toggleBypass(option, checked === true)
                }
              />
              {capitalizeRole(option)}
            </label>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}
