"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminAdvancedSection } from "@/components/admin/shared/AdminAdvancedSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { ScheduleGameField } from "@features/schedule/components/schedule-game-field";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import type { ScheduleFormProps } from "@features/schedule/types/schedule.types";
import { useScheduleForm } from "./schedule-form.hook";

export function ScheduleForm({
  formTarget,
  onFormTargetChange,
  ownerChannel,
  moderatedChannels,
  resolveStreamerId,
  editingStream,
  onCancelEdit,
  onSuccess,
}: ScheduleFormProps) {
  const {
    isEditing,
    selectedGame,
    isCustomGame,
    customGameTitle,
    scheduledDate,
    scheduledTime,
    duration,
    links,
    notes,
    isSubmitting,
    setCustomGameTitle,
    setScheduledDate,
    setScheduledTime,
    setDuration,
    setNotes,
    handleGameSelect,
    handleAddLink,
    handleRemoveLink,
    handleLinkChange,
    handleUseCustomGame,
    handleUseIgdbSearch,
    handleClearGame,
    handleSubmit,
  } = useScheduleForm({
    formTarget,
    onFormTargetChange,
    ownerChannel,
    moderatedChannels,
    resolveStreamerId,
    editingStream,
    onCancelEdit,
    onSuccess,
  });

  const streamerId = resolveStreamerId(formTarget);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminStreamerFormSelect
        value={formTarget}
        onChange={onFormTargetChange}
        ownerChannel={ownerChannel}
        moderatedChannels={moderatedChannels}
        alwaysShow
        label="Streamer"
        disabledHint="Você não modera outros canais. A agenda será registrada no seu perfil."
        enabledHint="Escolha em qual canal esta agenda será registrada."
      />

      <div className="space-y-2">
        <Label>Jogo</Label>
        <ScheduleGameField
          streamerId={streamerId}
          selectedGame={selectedGame}
          isCustomGame={isCustomGame}
          customGameTitle={customGameTitle}
          onGameSelect={handleGameSelect}
          onClearGame={handleClearGame}
          onCustomTitleChange={setCustomGameTitle}
          onUseCustomGame={handleUseCustomGame}
          onUseIgdbSearch={handleUseIgdbSearch}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data da Stream</Label>
          <Input
            id="date"
            type="date"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            className="input-cinematic"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input
            id="time"
            type="time"
            value={scheduledTime}
            onChange={(event) => setScheduledTime(event.target.value)}
            className="input-cinematic"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duração</Label>
        <Input
          id="duration"
          placeholder="Ex: 3 horas"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="input-cinematic"
        />
      </div>

      <AdminAdvancedSection summary="Opções adicionais" className="!mt-0 !border-0 !bg-transparent !p-0">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Links (Twitch de outros streamers, etc.)</Label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={(event) =>
                    handleLinkChange(index, "url", event.target.value)
                  }
                  className="input-cinematic"
                />
                <Input
                  type="text"
                  placeholder="Nome (opcional)"
                  value={link.name}
                  onChange={(event) =>
                    handleLinkChange(index, "name", event.target.value)
                  }
                  className="input-cinematic"
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Link
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a stream (opcional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="input-cinematic"
            />
          </div>
        </div>
      </AdminAdvancedSection>

      <div className="flex flex-col gap-2 sm:flex-row">
        {isEditing && onCancelEdit ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancelEdit}
            disabled={isSubmitting}
          >
            Cancelar edição
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={isEditing && onCancelEdit ? "flex-1" : "w-full"}
        >
          {isSubmitting
            ? isEditing
              ? "Salvando..."
              : "Agendando..."
            : isEditing
              ? "Salvar alterações"
              : "Agendar Stream"}
        </Button>
      </div>
    </form>
  );
}
