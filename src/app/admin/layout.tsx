import {
  buildEmptyPanelConfigInitialData,
  loadAdminPanelInitialData,
} from "@server/panel/load-admin-panel-initial-data";
import { AdminRootClient } from "./AdminRootClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialPanelConfig =
    (await loadAdminPanelInitialData()) ?? buildEmptyPanelConfigInitialData();

  return (
    <AdminRootClient initialPanelConfig={initialPanelConfig}>
      {children}
    </AdminRootClient>
  );
}
