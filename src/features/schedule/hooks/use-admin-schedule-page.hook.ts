"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  resolveStreamerIdsForFilter,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import type { AdminChannel } from "@/components/admin/AdminProvider";
import type { ScheduledStreamItem } from "@/components/admin/schedule/ScheduledStreamCard";
import {
  filterStreamsByDateRange,
  getDefaultSchedulePeriod,
} from "@lib/schedule-period";
import { services } from "@services";
import type { ScheduleFormEditStream } from "@features/schedule/types/schedule.types";

const PAGE_SIZE = 10;

export interface AdminScheduledStream extends ScheduledStreamItem {
  streamerId?: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string;
  igdbGameId?: number | null;
  gameSynopsis?: string | null;
  game?: {
    title: string;
    image?: string;
    synopsis?: string;
    genre?: string[];
    platform?: string;
    storeLinks?: Array<{ name: string; url: string }>;
  } | null;
}

interface UseAdminSchedulePageParams {
  channels: AdminChannel[];
  userId: string | null | undefined;
  viewFilter: AdminViewFilter;
  formTarget: string;
  resolveFormStreamerId: (formTarget: string) => string;
  onLoadError: () => void;
  onDeleteSuccess: () => void;
  onDeleteError: () => void;
}

export function useAdminSchedulePage({
  channels,
  userId,
  viewFilter,
  formTarget,
  resolveFormStreamerId,
  onLoadError,
  onDeleteSuccess,
  onDeleteError,
}: UseAdminSchedulePageParams) {
  const channelKey = useMemo(
    () => channels.map((channel) => channel.id).sort().join(","),
    [channels]
  );

  const loadKey = useMemo(
    () => `${viewFilter}:${channelKey}`,
    [viewFilter, channelKey]
  );

  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const onDeleteSuccessRef = useRef(onDeleteSuccess);
  onDeleteSuccessRef.current = onDeleteSuccess;
  const onDeleteErrorRef = useRef(onDeleteError);
  onDeleteErrorRef.current = onDeleteError;
  const fetchedLoadKeyRef = useRef<string | null>(null);

  const channelsRef = useRef(channels);
  channelsRef.current = channels;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const viewFilterRef = useRef(viewFilter);
  viewFilterRef.current = viewFilter;

  const [streams, setStreams] = useState<AdminScheduledStream[]>([]);
  const [editingStream, setEditingStream] = useState<ScheduleFormEditStream | null>(
    null
  );
  const [period, setPeriod] = useState(getDefaultSchedulePeriod);
  const [page, setPage] = useState(1);

  const streamerLabels = useMemo(() => {
    const labelMap: Record<string, string> = {};
    for (const channel of channels) {
      labelMap[channel.id] = channel.twitchUsername;
    }
    return labelMap;
  }, [channels]);

  const fetchStreams = useCallback(async () => {
    const streamerIds = resolveStreamerIdsForFilter(
      viewFilterRef.current,
      channelsRef.current,
      userIdRef.current ?? null
    );
    const loadedStreams =
      await services.scheduledStreams.findAll.mergedByStreamerIds(streamerIds);

    loadedStreams.sort(
      (streamA, streamB) =>
        new Date(streamA.scheduledDate).getTime() -
        new Date(streamB.scheduledDate).getTime()
    );

    setStreams(loadedStreams as AdminScheduledStream[]);
    setPage(1);
  }, []);

  const reloadStreams = useCallback(async () => {
    fetchedLoadKeyRef.current = null;
    try {
      await fetchStreams();
      fetchedLoadKeyRef.current = loadKey;
    } catch (loadError) {
      console.error("Error loading streams:", loadError);
      onLoadErrorRef.current();
    }
  }, [fetchStreams, loadKey]);

  useEffect(() => {
    if (!channelKey || !loadKey) return;
    if (fetchedLoadKeyRef.current === loadKey) return;

    fetchedLoadKeyRef.current = loadKey;
    let cancelled = false;

    void (async () => {
      try {
        await fetchStreams();
        if (cancelled) return;
      } catch (loadError) {
        console.error("Error loading streams:", loadError);
        if (!cancelled) onLoadErrorRef.current();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelKey, loadKey, fetchStreams]);

  const filteredStreams = useMemo(
    () => filterStreamsByDateRange(streams, period),
    [streams, period]
  );

  const totalPages = Math.max(1, Math.ceil(filteredStreams.length / PAGE_SIZE));

  const paginatedStreams = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredStreams.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredStreams, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSuccess = useCallback(() => {
    const wasEditing = Boolean(editingStream);
    void reloadStreams();
    setEditingStream(null);
    return wasEditing;
  }, [editingStream, reloadStreams]);

  const handleEditStream = useCallback(
    (stream: AdminScheduledStream) => {
      setEditingStream({
        id: stream.id,
        streamerId: stream.streamerId || resolveFormStreamerId(formTarget),
        igdbGameId: stream.igdbGameId,
        gameTitle: stream.gameTitle,
        gameImage: stream.gameImage,
        gameSynopsis: stream.gameSynopsis,
        scheduledDate: stream.scheduledDate,
        scheduledTime: stream.scheduledTime,
        duration: stream.duration,
        links: stream.links,
        notes: stream.notes,
      });
    },
    [formTarget, resolveFormStreamerId]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingStream(null);
  }, []);

  const handleDeleteStream = useCallback(
    async (streamId: string) => {
      try {
        await services.scheduledStreams.remove(streamId);
        setStreams((previous) =>
          previous.filter((stream) => stream.id !== streamId)
        );
        if (editingStream?.id === streamId) {
          setEditingStream(null);
        }
        onDeleteSuccessRef.current();
      } catch (deleteError) {
        console.error("Error deleting stream:", deleteError);
        onDeleteErrorRef.current();
      }
    },
    [editingStream]
  );

  return {
    streams,
    editingStream,
    period,
    page,
    streamerLabels,
    filteredStreams,
    totalPages,
    paginatedStreams,
    setPeriod,
    setPage,
    setEditingStream,
    reloadStreams,
    handleSuccess,
    handleEditStream,
    handleCancelEdit,
    handleDeleteStream,
  };
}
