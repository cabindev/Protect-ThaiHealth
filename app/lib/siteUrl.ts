// app/lib/siteUrl.ts — URL หลักของเว็บ (ลิงก์ในอีเมล, metadata, ภาพแชร์)
// ลำดับ: NEXTAUTH_URL (ตั้งใน Plesk) → โดเมน production ของโปรเจค → localhost (เฉพาะเครื่อง dev)
// กันกรณีลืมตั้ง NEXTAUTH_URL บนเซิร์ฟเวอร์ แล้วลิงก์รีเซ็ตรหัสผ่าน/ภาพแชร์ชี้ localhost
export const PRODUCTION_URL = 'https://protect.sdnthailand.com';

export function siteUrl(): string {
  const fromEnv = process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000';
}
