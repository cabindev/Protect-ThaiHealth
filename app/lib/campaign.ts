// app/lib/campaign.ts — ตัวช่วยของแคมเปญลงชื่อ (ใช้ทั้งหน้าสาธารณะ, API, แดชบอร์ด)
import type { Campaign } from '@prisma/client';
import type { Locale } from '@/app/i18n/config';

// เลือกข้อความตามภาษา — ช่องภาษาอังกฤษว่างให้ใช้ภาษาไทยแทน
export function localizeCampaign(c: Campaign, locale: Locale) {
  const en = locale === 'en';
  return {
    title: (en && c.titleEn) || c.titleTh,
    summary: (en && c.summaryEn) || c.summaryTh,
    statement: (en && c.statementEn) || c.statementTh,
    // ปก: ไม่มีพาดหัว = ไม่แสดงปก
    hero: c.heroTitleTh
      ? {
          title: (en && c.heroTitleEn) || c.heroTitleTh,
          subtitle: (en && c.heroSubtitleEn) || c.heroSubtitleTh || '',
          quote: (en && c.heroQuoteEn) || c.heroQuoteTh || '',
        }
      : null,
  };
}

// รับลงชื่ออยู่ไหม (เปิดอยู่ + ยังไม่เลยเวลาปิด)
export const isAccepting = (c: Pick<Campaign, 'isOpen' | 'closesAt'>, now = new Date()) =>
  c.isOpen && (!c.closesAt || c.closesAt > now);

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SIGNATURE_MAX_BYTES = 600 * 1024; // PNG ลายเซ็นปกติ 10–80KB (จอ retina ใหญ่สุดราว 300KB)

// ตรวจว่าเป็นไฟล์ PNG จริง (magic bytes) ไม่เชื่อ mime type ที่ browser ส่งมา
export const isPng = (buf: Buffer) =>
  buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;

// ตรวจ/ทำความสะอาดข้อมูลแคมเปญจากฟอร์มแอดมิน (ใช้ทั้งสร้างและแก้ไข) — คืน null ถ้าข้อมูลไม่ครบ
export function parseCampaignInput(body: Record<string, unknown>) {
  const str = (k: string, max: number) => String(body[k] ?? '').trim().slice(0, max);
  const slug = str('slug', 80).toLowerCase();
  const data = {
    slug,
    titleTh: str('titleTh', 300),
    titleEn: str('titleEn', 300),
    summaryTh: str('summaryTh', 20000),
    summaryEn: str('summaryEn', 20000),
    statementTh: str('statementTh', 60000),
    statementEn: str('statementEn', 60000),
    officialUrl: str('officialUrl', 500) || null,
    heroTitleTh: str('heroTitleTh', 300) || null,
    heroTitleEn: str('heroTitleEn', 300) || null,
    heroSubtitleTh: str('heroSubtitleTh', 300) || null,
    heroSubtitleEn: str('heroSubtitleEn', 300) || null,
    heroQuoteTh: str('heroQuoteTh', 500) || null,
    heroQuoteEn: str('heroQuoteEn', 500) || null,
    isOpen: body.isOpen !== false,
    showSigners: body.showSigners !== false,
    closesAt: body.closesAt ? new Date(String(body.closesAt)) : null,
    officialClosesAt: body.officialClosesAt ? new Date(String(body.officialClosesAt)) : null,
  };
  if (!SLUG_RE.test(slug) || !data.titleTh || !data.summaryTh || !data.statementTh) return null;
  if (data.officialUrl && !/^https?:\/\//i.test(data.officialUrl)) return null;
  if (data.closesAt && Number.isNaN(data.closesAt.getTime())) return null;
  if (data.officialClosesAt && Number.isNaN(data.officialClosesAt.getTime())) return null;
  return data;
}

// แคมเปญที่เปิดรับลงชื่ออยู่ (ใหม่สุดก่อน) — ใช้กับทางลัด /, /qr, /supporters
export async function openCampaigns() {
  const { default: prisma } = await import('@/app/lib/db');
  const rows = await prisma.campaign.findMany({ where: { isOpen: true }, orderBy: { createdAt: 'desc' } });
  return rows.filter((c) => isAccepting(c));
}

// วันเวลาปิดรับเป็นข้อความ ตามเวลาไทยเสมอ (ผู้ลงชื่อต่างประเทศเห็นเวลาไทย + ระบุว่าเป็นเวลาไทย)
// จัดรูปแบบฝั่ง server แล้วส่งเป็น string ให้ client — Intl ของ Node กับ browser อาจได้ข้อความต่างกัน (hydration)
export function formatDeadline(d: Date, dateLocale: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(d);
}
