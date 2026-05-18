"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export type AdminChannelRole = "owner" | "moderator";

export interface AdminChannel {
  id: string;
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  role: AdminChannelRole;
}

interface AdminContextValue {
  userId: string | null;
  channels: AdminChannel[];
  actingAs: AdminChannel | null;
  loading: boolean;
  switchChannel: (streamerId: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
}

const defaultAdminContext: AdminContextValue = {
  userId: null,
  channels: [],
  actingAs: null,
  loading: true,
  switchChannel: async () => {},
  refreshChannels: async () => {},
};

const AdminContext = createContext<AdminContextValue>(defaultAdminContext);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [actingAs, setActingAs] = useState<AdminChannel | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChannels = useCallback(async () => {
    const twitchSession = document.cookie
      .split("; ")
      .find((row) => row.startsWith("twitch_session="))
      ?.split("=")[1];

    if (!twitchSession) {
      router.push("/auth");
      return;
    }

    const res = await fetch("/api/admin/channels");
    if (res.status === 401) {
      router.push("/auth");
      return;
    }

    if (!res.ok) {
      throw new Error("Falha ao carregar canais");
    }

    const data = await res.json();
    setUserId(data.userId ?? null);
    setChannels(data.channels ?? []);
    setActingAs(data.actingAs ?? null);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadChannels();
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadChannels]);

  const switchChannel = useCallback(
    async (streamerId: string) => {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamerId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao trocar canal");
      }

      const data = await res.json();
      setActingAs(data.actingAs);
    },
    []
  );

  const value = useMemo(
    () => ({
      userId,
      channels,
      actingAs,
      loading,
      switchChannel,
      refreshChannels: loadChannels,
    }),
    [userId, channels, actingAs, loading, switchChannel, loadChannels]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdminContext() {
  return useContext(AdminContext);
}
