"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ClassNames } from "@/utils";
import Link from "next/link";

interface HeaderProps {
  title?: string;
}

export const Header = ({ title = "Streamline" }: HeaderProps) => {
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
    return pathname === `/${user.twitchUsername}`;
  };

  const isAdminPage = () => {
    return pathname === "/admin";
  };

  if (!isClient || isLoading) {
    return (
      <header className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="w-20 h-8 bg-muted animate-pulse rounded" />
        </div>
      </header>
    );
  }

  return (
    <header className="px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {/* Se estiver no próprio perfil, mostrar botão para registrar na agenda */}
              {isOwnProfile() ? (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  asChild
                >
                  <Link href="/admin" prefetch>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar na Agenda
                  </Link>
                </Button>
              ) : (
                /* Se estiver logado mas não no próprio perfil, mostrar botão para ir ao perfil */
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  asChild
                >
                  <Link href={`/${user.twitchUsername}`} prefetch>
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </Link>
                </Button>
              )}

              {/* Botão de logout */}
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
            /* Se não estiver logado, mostrar botão de login */
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              asChild
            >
              <Link href="/auth" prefetch>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
