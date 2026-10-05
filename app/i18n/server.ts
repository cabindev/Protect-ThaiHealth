// app/i18n/server.ts — อ่านภาษาปัจจุบันฝั่ง server (Server Component / Route Handler)
// ลำดับ: cookie ที่ผู้ใช้เลือก (ปุ่ม TH/EN) → ภาษาเริ่มต้น (อังกฤษ) — ไม่ดูภาษาของ browser แล้ว
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { getDictionaryFor } from './dictionaries';

export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE;
}

export async function getDict() {
  return getDictionaryFor(await getLocale());
}
