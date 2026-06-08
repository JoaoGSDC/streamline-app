"use client";

import { AdminProvider } from "@/components/admin/AdminProvider";
import {
  PanelConfigProvider,
  PanelConfigStreamerSync,
  type PanelConfigInitialData,
} from "@/contexts/PanelConfigContext";
import { AdminLayoutInner } from "./AdminLayoutInner";

interface AdminRootClientProps {
  initialPanelConfig: PanelConfigInitialData;
  children: React.ReactNode;
}

export function AdminRootClient({
  initialPanelConfig,
  children,
}: AdminRootClientProps) {
  return (
    <AdminProvider>
      <PanelConfigProvider initialData={initialPanelConfig}>
        <PanelConfigStreamerSync
          initialStreamerId={initialPanelConfig.streamerId}
        />
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </PanelConfigProvider>
    </AdminProvider>
  );
}
