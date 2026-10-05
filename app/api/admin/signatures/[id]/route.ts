// app/api/admin/signatures/[id]/route.ts — DELETE ลบรายชื่อ (สแปม/ลงซ้ำ/เจ้าตัวขอถอน) พร้อมไฟล์ลายเซ็น
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import prisma from '@/app/lib/db';
import { getAdminUser } from '@/app/lib/adminAuth';
import { UPLOAD_ROOT } from '@/app/lib/uploads';
import { writeAuditLog } from '@/app/lib/audit';
import { getDict } from '@/app/i18n/server';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await getDict();
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: t.api.adminOnly }, { status: 403 });

  const id = Number((await params).id);
  const sig = Number.isInteger(id) ? await prisma.signature.findUnique({ where: { id } }) : null;
  if (!sig) return NextResponse.json({ error: t.api.userNotFound }, { status: 404 });

  await prisma.signature.delete({ where: { id } });
  await fs.rm(path.join(UPLOAD_ROOT, sig.signaturePath)).catch(() => {});
  // audit: เก็บชื่อ/องค์กรไว้อ้างอิง ไม่เก็บอีเมล
  await writeAuditLog({
    action: 'DELETE',
    entityType: 'Signature',
    entityId: id,
    entityName: `${sig.firstName} ${sig.lastName} (${sig.organization})`,
    userId: admin.id,
  });
  return NextResponse.json({ ok: true });
}
