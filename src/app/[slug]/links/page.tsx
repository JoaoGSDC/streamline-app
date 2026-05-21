"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { LinkPageRenderer } from "@/components/link-page/LinkPageRenderer";
import { usePublicLinkPage } from "@features/links/hooks/use-public-link-page.hook";

export default function StreamerLinksPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { streamer, loading, links, pageConfig, isNobleTemplate } =
    usePublicLinkPage(slug);

  return (
    <div
      className={
        !loading && isNobleTemplate
          ? "relative z-10 min-h-screen bg-[#050816]"
          : "relative z-10 min-h-screen bg-background"
      }
    >
      <Header
        hideLeadingOnMobile
        leading={
          <Button size="sm" variant="outline" className="text-primary" asChild>
            <Link href={`/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao perfil
            </Link>
          </Button>
        }
        trailing={<div className="hidden w-24 md:block" aria-hidden />}
      />

      {loading ? (
        <div className="mx-auto max-w-md space-y-4 px-4 py-10">
          <Skeleton className="mx-auto h-20 w-20 rounded-lg" />
          <Skeleton className="mx-auto h-8 w-48" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : streamer ? (
        <LinkPageRenderer
          config={pageConfig}
          streamer={streamer}
          links={links}
          className="min-h-[calc(100vh-4rem)]"
        />
      ) : null}
    </div>
  );
}
