// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import { Toaster } from "react-hot-toast";
import { getServerSession } from "next-auth/next";
import authOptions from "./lib/configs/auth/authOptions";
import Navbar from "@/components/Navbar";
import { SITE } from "./lib/site";
import { getDict, getLocale } from "./i18n/server";
import { I18nProvider } from "./i18n/I18nProvider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    title: SITE.name,
    description: t.site.tagline,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, locale] = await Promise.all([getServerSession(authOptions), getLocale()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider locale={locale}>
          <SessionProvider session={session}>
            <Navbar />
            {children}
            <Toaster position="top-center" />
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
