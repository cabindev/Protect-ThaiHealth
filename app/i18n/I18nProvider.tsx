'use client';
// app/i18n/I18nProvider.tsx — ส่งภาษาปัจจุบันให้ Client Component ผ่าน useI18n()
// รับแค่ locale จาก server (dictionary มีฟังก์ชัน ส่งข้าม server→client ไม่ได้) แล้วเลือก dictionary ฝั่ง client เอง
import { createContext, useContext } from 'react';
import type { Locale } from './config';
import { getDictionaryFor, type Dictionary } from './dictionaries';

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: getDictionaryFor(locale) }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
