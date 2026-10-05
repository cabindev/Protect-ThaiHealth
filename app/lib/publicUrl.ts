// app/lib/publicUrl.ts — URL เต็มของหน้าเว็บ (สำหรับ QR/ลิงก์แชร์) จาก host ที่ผู้ใช้เปิดอยู่จริง
// ไม่ใช้ NEXTAUTH_URL ตรง ๆ เพราะเครื่อง dev เป็น localhost — มือถือในห้องประชุมสแกนแล้วเปิดไม่ได้
import { headers } from 'next/headers';

export async function publicUrl(pathname: string) {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  const base = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}${pathname}`;
}
