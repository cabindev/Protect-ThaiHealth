// app/api/health/route.ts — ตรวจว่าแอปต่อฐานข้อมูลได้ไหม (ใช้ตอนขึ้นเซิร์ฟเวอร์ — Passenger ไม่แสดง error ของ Node)
// คืนเฉพาะ "รหัสข้อผิดพลาด" ของ Prisma + ข้อความสั้นที่ไม่มีรหัสผ่าน/connection string · ไม่ดึงข้อมูลผู้ใช้ใด ๆ
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { NO_STORE } from '@/app/lib/uploads';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    node: process.version,
  };
  try {
    const [campaigns] = await Promise.all([prisma.campaign.count()]);
    return NextResponse.json({ ok: true, campaigns, env }, { headers: NO_STORE });
  } catch (e) {
    const err = e as { code?: string; name?: string; message?: string };
    // ตัดบรรทัดที่อาจมี host/user/password ออก — เก็บแค่บรรทัดสุดท้ายของข้อความ (สาเหตุ) และจำกัดความยาว
    const reason = String(err.message ?? '').trim().split('\n').pop()?.replace(/mysql:\/\/\S+/gi, '[url]').slice(0, 200);
    return NextResponse.json({ ok: false, code: err.code ?? null, name: err.name ?? null, reason, env }, { status: 500, headers: NO_STORE });
  }
}
