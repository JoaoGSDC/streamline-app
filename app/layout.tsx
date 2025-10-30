import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streamline - Agenda Gamer Compartilhável",
  description:
    "Organize e compartilhe sua agenda de jogos e lives na Twitch. Veja o que vai rolar hoje, na semana ou no mês.",
  authors: [{ name: "Streamline" }],
  openGraph: {
    title: "Streamline - Agenda Gamer Compartilhável",
    description:
      "Organize e compartilhe sua agenda de jogos e lives na Twitch.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
