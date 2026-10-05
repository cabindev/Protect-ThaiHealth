// app/layout.tsx
import type { Metadata } from "next";
// ฟอนต์ฝังในโปรเจค (fontsource) — ไม่ดึงจาก Google ตอน build/รัน (เซิร์ฟเวอร์ Plesk อาจออกเน็ตไม่ได้ตอน build)
// IBM Plex Sans Thai = ไทย+อังกฤษในฟอนต์เดียว · IBM Plex Mono = บรรทัดเล็ก/ตัวเลข (แบบภาพอ้างอิง)
import "@fontsource/ibm-plex-sans-thai/400.css";
import "@fontsource/ibm-plex-sans-thai/500.css";
import "@fontsource/ibm-plex-sans-thai/600.css";
import "@fontsource/ibm-plex-sans-thai/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import { Toaster } from "react-hot-toast";
import { getServerSession } from "next-auth/next";
import authOptions from "./lib/configs/auth/authOptions";
import Navbar from "@/components/Navbar";
import { SITE } from "./lib/site";
import { siteUrl } from "./lib/siteUrl";
import { getDict, getLocale } from "./i18n/server";
import { I18nProvider } from "./i18n/I18nProvider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    metadataBase: new URL(siteUrl()),
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
