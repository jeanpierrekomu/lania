import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { APP_DESCRIPTOR, APP_NAME, APP_TAGLINE } from "@/lib/brand";

import "./globals.css";
import { UiRoot } from "@/ui/ui-root";

import { Providers } from "./providers";

// Identidad LANIA: Plus Jakarta Sans para títulos y marca, Inter para texto de aplicación y ejercicios.
const body = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_DESCRIPTOR}. ${APP_TAGLINE} Diagnóstico por habilidades, práctica y repaso espaciado.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-419" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <UiRoot>{children}</UiRoot>
        </Providers>
      </body>
    </html>
  );
}
