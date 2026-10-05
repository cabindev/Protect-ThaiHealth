// app/api/admin/users/[id]/route.ts — DELETE = ปฏิเสธบัญชีที่สมัครใหม่ (role pending) แอดมินเท่านั้น
// ลบได้เฉพาะ pending ที่ไม่มีข้อมูลผูกอยู่ — บัญชีที่เคยอนุมัติแล้วห้ามลบที่นี่
// เพิ่ม relation ของโมดูลใหม่ใน _count ด้านล่าง เพื่อกันลบบัญชีที่มีข้อมูลผูกอยู่
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import prisma from '@/app/lib/db';
import { getAdminUser } from '@/app/lib/adminAuth';
import { UPLOAD_ROOT } from '@/app/lib/uploads';
import { getDict } from '@/app/i18n/server';

const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await getDict();
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: t.api.adminOnly }, { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: t.api.userNotFound }, { status: 404 });
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true, image: true, _count: { select: { auditLogs: true } } },
  });
  if (!user) return NextResponse.json({ error: t.api.userNotFound }, { status: 404 });
  if (user.role !== 'pending') {
    return NextResponse.json({ error: t.api.rejectOnlyPending }, { status: 400 });
  }
  if (Object.values(user._count).some((n) => n > 0)) {
    return NextResponse.json({ error: t.api.rejectHasData }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  // รูปโปรไฟล์ที่อัปตอนสมัคร (uploads/avatars/) — ลบตามไปด้วย ไม่ให้ไฟล์ค้าง
  const name = user.image?.startsWith('/api/files/avatars/') ? path.basename(user.image) : null;
  if (name) await fs.rm(path.join(AVATAR_DIR, name)).catch(() => {});

  return NextResponse.json({ message: t.api.rejected });
}
