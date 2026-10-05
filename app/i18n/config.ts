// app/i18n/config.ts — ภาษาที่รองรับ (เก็บภาษาที่เลือกใน cookie ไม่ใช้ prefix ใน URL → route เดิมไม่ต้องเปลี่ยน)
export const LOCALES = ['en', 'th'] as const; // ลำดับนี้ = ลำดับปุ่มสลับภาษา (EN ก่อน = ค่าเริ่มต้น)
export type Locale = (typeof LOCALES)[number];
// ภาษาเริ่มต้น = อังกฤษ (ผู้ใช้ตัดสินใจ 5 ต.ค. 2569 — เครือข่ายต่างประเทศเห็นอังกฤษทันที คนไทยกด TH สลับเอง)
export const DEFAULT_LOCALE: Locale = 'en';
// ชื่อเฉพาะโปรเจค — กันชนกับโปรเจคอื่นบน localhost:3000 (บทเรียนเดียวกับ cookie session)
export const LOCALE_COOKIE = 'parliament.locale';

export const isLocale = (v: string | undefined | null): v is Locale => LOCALES.includes(v as Locale);
