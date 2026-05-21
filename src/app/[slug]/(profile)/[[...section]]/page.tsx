import { notFound } from "next/navigation";

const VALID_SECTIONS = new Set(["games", "schedule"]);

export default async function StreamerProfileSectionPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const firstSection = section?.[0]?.toLowerCase();

  if (section && section.length > 1) notFound();
  if (firstSection && !VALID_SECTIONS.has(firstSection)) notFound();

  return null;
}
