"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ChannelSearch } from "@/components/ChannelSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isStreamerProfilePath } from "@/lib/streamer-profile-routes";

interface HeaderProps {
  title?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  showSearch?: boolean;
  /** Oculta a área esquerda (ex.: botão Início) no mobile para a busca usar a largura total */
  hideLeadingOnMobile?: boolean;
}

const headerShell = "app-header sticky top-0 z-50 px-4 py-3";

export const Header = ({
  title = "Streamline",
  leading,
  trailing,
  showSearch = true,
  hideLeadingOnMobile = false,
}: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isOwnProfile = () => {
    if (!user || !pathname) return false;
    return isStreamerProfilePath(pathname, user.twitchUsername);
  };

  const defaultLeading = (
    <Link
      href="/"
      prefetch
      className="gradient-text-primary font-headline text-xl font-bold hover:opacity-90"
    >
      {title}
    </Link>
  );

  const defaultTrailing = (
    <div className="flex items-center gap-2">
      {isAuthenticated && user ? (
        <>
          {isOwnProfile() ? (
            <Button size="sm" asChild>
              <Link href="/admin" prefetch>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Registrar na Agenda</span>
                <span className="sm:hidden">Agenda</span>
              </Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href={`/${user.twitchUsername}`} prefetch>
                <User className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Meu Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button size="sm" variant="nav-login" asChild>
          <Link href="/auth" prefetch>
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Link>
        </Button>
      )}
    </div>
  );

  const leadingClassName = cn(
    "shrink-0",
    hideLeadingOnMobile && "hidden md:block"
  );

  if (!isClient || isLoading) {
    return (
      <header className={headerShell}>
        <div className="container-cinematic flex items-center gap-2 md:gap-4">
          {!hideLeadingOnMobile && (
            <Skeleton className="h-7 w-28 shrink-0" />
          )}
          {showSearch && (
            <Skeleton className="h-10 min-w-0 flex-1 md:max-w-md" />
          )}
          <Skeleton className="h-9 w-16 shrink-0 md:w-24" />
        </div>
      </header>
    );
  }

  return (
    <header className={headerShell}>
      <div className="container-cinematic flex items-center gap-2 md:gap-4">
        <div className={leadingClassName}>{leading ?? defaultLeading}</div>

        {showSearch && (
          <div className="flex min-w-0 flex-1 md:justify-center md:px-2">
            <ChannelSearch className="w-full md:max-w-md" />
          </div>
        )}

        <div className="shrink-0">{trailing ?? defaultTrailing}</div>
      </div>
    </header>
  );
};
