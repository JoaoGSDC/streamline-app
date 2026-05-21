"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type {
  ScheduleFormEditStream,
  ScheduleFormLink,
  ScheduleFormProps,
  ScheduleSelectedGame,
} from "@features/schedule/types/schedule.types";
import {
  buildScheduleSubmitPayload,
  coverUrlFromStored,
  formatDateForInput,
  resetScheduleFormState,
} from "@features/schedule/utils/schedule-form.utils";

export function useScheduleForm({
  formTarget,
  onFormTargetChange,
  resolveStreamerId,
  editingStream,
  onCancelEdit,
  onSuccess,
}: ScheduleFormProps) {
  const isEditing = Boolean(editingStream?.id);
  const [selectedGame, setSelectedGame] = useState<ScheduleSelectedGame | null>(null);
  const [isCustomGame, setIsCustomGame] = useState(false);
  const [customGameTitle, setCustomGameTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("");
  const [links, setLinks] = useState<ScheduleFormLink[]>([{ url: "", name: "" }]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingStream) {
      resetScheduleFormState({
        setSelectedGame,
        setIsCustomGame,
        setCustomGameTitle,
        setScheduledDate,
        setScheduledTime,
        setDuration,
        setLinks,
        setNotes,
      });
      return;
    }

    if (editingStream.streamerId) {
      onFormTargetChange(editingStream.streamerId);
    }

    if (editingStream.igdbGameId) {
      setSelectedGame({
        id: editingStream.igdbGameId,
        name: editingStream.gameTitle || "Jogo",
        cover: editingStream.gameImage
          ? { url: coverUrlFromStored(editingStream.gameImage) || "" }
          : undefined,
        summary: editingStream.gameSynopsis || undefined,
      });
      setIsCustomGame(false);
      setCustomGameTitle("");
    } else if (editingStream.gameTitle) {
      setSelectedGame(null);
      setIsCustomGame(true);
      setCustomGameTitle(editingStream.gameTitle);
    } else {
      setSelectedGame(null);
      setIsCustomGame(false);
      setCustomGameTitle("");
    }

    setScheduledDate(formatDateForInput(editingStream.scheduledDate));
    setScheduledTime(editingStream.scheduledTime);
    setDuration(editingStream.duration || "");
    setLinks(
      editingStream.links?.length
        ? editingStream.links.map((link) => ({
            url: link.url,
            name: link.name || "",
          }))
        : [{ url: "", name: "" }]
    );
    setNotes(editingStream.notes || "");
  }, [editingStream, onFormTargetChange]);

  const handleGameSelect = useCallback((game: ScheduleSelectedGame) => {
    setSelectedGame(game);
    setIsCustomGame(false);
    setCustomGameTitle("");
  }, []);

  const handleAddLink = useCallback(() => {
    setLinks((previous) => [...previous, { url: "", name: "" }]);
  }, []);

  const handleRemoveLink = useCallback((index: number) => {
    setLinks((previous) => previous.filter((_, linkIndex) => linkIndex !== index));
  }, []);

  const handleLinkChange = useCallback(
    (index: number, field: "url" | "name", value: string) => {
      setLinks((previous) => {
        const nextLinks = [...previous];
        nextLinks[index] = { ...nextLinks[index], [field]: value };
        return nextLinks;
      });
    },
    []
  );

  const handleUseCustomGame = useCallback(() => {
    setSelectedGame(null);
    setIsCustomGame(true);
  }, []);

  const handleUseIgdbSearch = useCallback(() => {
    setIsCustomGame(false);
    setCustomGameTitle("");
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsSubmitting(true);

      try {
        if (!isCustomGame && !selectedGame) {
          alert(
            "Por favor, selecione um jogo ou informe o nome do jogo customizado"
          );
          return;
        }

        const streamerId = resolveStreamerId(formTarget);
        const payload = buildScheduleSubmitPayload({
          isCustomGame,
          selectedGame,
          customGameTitle,
          streamerId,
          scheduledDate,
          scheduledTime,
          duration,
          links,
          notes,
          isEditing,
          editingGameImage: editingStream?.gameImage,
          editingGameSynopsis: editingStream?.gameSynopsis,
        });

        if (isEditing && editingStream) {
          await services.scheduledStreams.update(editingStream.id, payload);
        } else {
          await services.scheduledStreams.create(payload);
          resetScheduleFormState({
            setSelectedGame,
            setIsCustomGame,
            setCustomGameTitle,
            setScheduledDate,
            setScheduledTime,
            setDuration,
            setLinks,
            setNotes,
          });
        }

        onSuccess();
      } catch (submitError) {
        console.error("Error submitting schedule:", submitError);
        alert(
          isEditing
            ? "Erro ao atualizar a agenda. Tente novamente."
            : "Erro ao agendar stream. Tente novamente."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      customGameTitle,
      duration,
      editingStream,
      formTarget,
      isCustomGame,
      isEditing,
      links,
      notes,
      onSuccess,
      resolveStreamerId,
      scheduledDate,
      scheduledTime,
      selectedGame,
    ]
  );

  return {
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
    handleSubmit,
    onCancelEdit,
  };
}
