"use client";

import { AdminConfigSection } from "@/components/admin/shared/AdminConfigSection";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSaveFooter } from "@/components/admin/shared/AdminSaveFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useEconomyLevelsPage } from "@features/economy/hooks/use-economy-levels-page.hook";

export default function EconomyLevelsPage() {
  const {
    loading,
    saving,
    isDirty,
    savedRecently,
    levelsEnabled,
    setLevelsEnabled,
    xpPerMessage,
    setXpPerMessage,
    xpPerMinuteWatching,
    setXpPerMinuteWatching,
    xpFormula,
    setXpFormula,
    levelsDefinition,
    updateLevel,
    save,
  } = useEconomyLevelsPage();

  if (loading) {
    return (
      <div className="admin-page-stack">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="admin-page-stack pb-20">
      <AdminPageHeader
        title="Sistema de Níveis"
        description="Progressão opcional com XP. Os viewers sobem de nível conforme interagem na live."
      />

      <div className="admin-config-stack">
        <AdminConfigSection title="Ativação" showDivider={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="levels-enabled">Sistema de níveis</Label>
              <p className="text-caption">
                Quando desligado, o XP não é acumulado.
              </p>
            </div>
            <Switch
              id="levels-enabled"
              checked={levelsEnabled}
              onCheckedChange={setLevelsEnabled}
            />
          </div>
        </AdminConfigSection>

        <AdminConfigSection
          title="Como ganhar XP"
          description="Defina as fontes de experiência dos viewers."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="xp-message">XP por mensagem</Label>
              <Input
                id="xp-message"
                type="number"
                min={0}
                value={xpPerMessage}
                onChange={(e) => setXpPerMessage(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="xp-watch">XP por minuto assistindo</Label>
              <Input
                id="xp-watch"
                type="number"
                min={0}
                value={xpPerMinuteWatching}
                onChange={(e) =>
                  setXpPerMinuteWatching(Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fórmula de progressão</Label>
              <Select
                value={xpFormula}
                onValueChange={(v) =>
                  setXpFormula(v as "linear" | "exponential" | "custom")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear (padrão)</SelectItem>
                  <SelectItem value="exponential">Exponencial</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AdminConfigSection>

        <AdminConfigSection
          title="Tabela de níveis"
          description="Defina quanto XP é necessário para cada nível. O bot calcula o nível automaticamente."
        >
          <div className="space-y-3">
            {levelsDefinition.map((level, index) => (
              <div
                key={`${level.level}-${index}`}
                className="grid gap-3 sm:grid-cols-3"
              >
                <div className="space-y-1">
                  <Label>Nível</Label>
                  <Input
                    type="number"
                    min={1}
                    value={level.level}
                    onChange={(e) =>
                      updateLevel(index, { level: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>XP necessário</Label>
                  <Input
                    type="number"
                    min={0}
                    value={level.xpRequired}
                    onChange={(e) =>
                      updateLevel(index, {
                        xpRequired: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Título (opcional)</Label>
                  <Input
                    value={level.title ?? ""}
                    onChange={(e) =>
                      updateLevel(index, { title: e.target.value || undefined })
                    }
                    placeholder="Ex.: Veterano"
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminConfigSection>
      </div>

      <AdminSaveFooter
        dirty={isDirty}
        saving={saving}
        saved={savedRecently}
        onSave={() => void save()}
      />
    </div>
  );
}
