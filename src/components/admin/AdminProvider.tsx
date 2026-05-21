"use client";

import { createContext, useContext, useMemo } from "react";
import { useAdminSession, type AdminChannel } from "@features/auth/hooks/use-admin-session.hook";

export type AdminChannelRole = "owner" | "moderator";

export type { AdminChannel };

interface AdminContextValue {
  userId: string | null;
  channels: AdminChannel[];
  actingAs: AdminChannel | null;
  loading: boolean;
  switchChannel: (streamerId: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
  logout: () => Promise<void>;
}

const defaultAdminContext: AdminContextValue = {
  userId: null,
  channels: [],
  actingAs: null,
  loading: true,
  switchChannel: async () => {},
  refreshChannels: async () => {},
  logout: async () => {},
};

const AdminContext = createContext<AdminContextValue>(defaultAdminContext);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const {
    userId,
    channels,
    actingAs,
    loading,
    switchChannel,
    refreshChannels,
    logout,
  } = useAdminSession();

  const value = useMemo(
    () => ({
      userId,
      channels,
      actingAs,
      loading,
      switchChannel,
      refreshChannels,
      logout,
    }),
    [
      userId,
      channels,
      actingAs,
      loading,
      switchChannel,
      refreshChannels,
      logout,
    ]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdminContext() {
  return useContext(AdminContext);
}
