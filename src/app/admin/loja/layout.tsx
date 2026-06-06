export default function StoreModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-page-stack">{children}</div>;
}
