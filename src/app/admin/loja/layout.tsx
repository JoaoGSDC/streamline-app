"use client";

import { StoreSubNav } from "@/components/admin/store/StoreSubNav";

export default function StoreModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <StoreSubNav />
      {children}
    </div>
  );
}
