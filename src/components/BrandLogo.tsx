import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "Streaminhub";

export const BRAND_LOGOS = {
  full: "/assets/images/logo.png",
  symbol: "/assets/images/logo-v1.png",
  text: "/assets/images/logo-v2.png",
} as const;

export type BrandLogoVariant = keyof typeof BRAND_LOGOS;

const LOGO_CONFIG: Record<
  BrandLogoVariant,
  { width: number; height: number; className: string }
> = {
  full: { width: 180, height: 48, className: "h-8 w-auto md:h-9" },
  symbol: { width: 40, height: 40, className: "h-8 w-8" },
  text: { width: 150, height: 36, className: "h-7 w-auto md:h-8" },
};

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  href?: string | null;
  priority?: boolean;
}

export function BrandLogo({
  variant = "full",
  className,
  href = "/",
  priority = false,
}: BrandLogoProps) {
  const src = BRAND_LOGOS[variant];
  const { width, height, className: sizeClass } = LOGO_CONFIG[variant];

  const image = (
    <Image
      src={src}
      alt={BRAND_NAME}
      width={width}
      height={height}
      className={cn(sizeClass, "object-contain object-left", className)}
      priority={priority}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch
        className="inline-flex shrink-0 transition-opacity hover:opacity-90"
        aria-label={`${BRAND_NAME} — início`}
      >
        {image}
      </Link>
    );
  }

  return image;
}

/** Símbolo no mobile + texto no desktop (header compacto) */
export function BrandLogoHeader({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <BrandLogo variant="symbol" href="/" className="md:hidden" priority />
      <BrandLogo variant="text" href="/" className="hidden md:inline-flex" priority />
    </span>
  );
}
