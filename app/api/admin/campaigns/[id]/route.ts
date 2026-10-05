// app/api/admin/campaigns/[id]/route.ts — PATCH แก้ไขแคมเปญ / สลับเปิด-ปิดรับ (แอดมินเท่านั้น)
// body ที่มีแค่ { isOpen } = สลับเปิด-ปิดรับอย่างเดียว · body เต็ม = แก้ไขทั้งแคมเปญ
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/app/lib/db';
import { getAdminUser } from '@/app/lib/adminAuth';
import { parseCampaignInput } from '@/app/lib/campaign';
import { writeAuditLog } from '@/app/lib/audit';
import { getDict } from '@/app/i18n/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await getDict();
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: t.api.adminOnly }, { status: 403 });

  const id = Number((await params).id);
  const existing = Number.isInteger(id) ? await prisma.campaign.findUnique({ where: { id } }) : null;
  if (!existing) return NextResponse.json({ error: t.api.campaignNotFound }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const onlyToggle = Object.keys(body).length === 1 && typeof body.isOpen === 'boolean';
  const data = onlyToggle ? { isOpen: body.isOpen as boolean } : parseCampaignInput(body);
  if (!data) return NextResponse.json({ error: t.api.signInvalid }, { status: 400 });

  try {
    const c = await prisma.campaign.update({ where: { id }, data });
    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'Campaign',
      entityId: id,
      entityName: c.titleTh,
      userId: admin.id,
      changes: onlyToggle ? [c.isOpen ? 'เปิดรับลงชื่อ' : 'ปิดรับลงชื่อ'] : ['แก้ไขข้อมูลแคมเปญ'],
    });
    return NextResponse.json({ ok: true, isOpen: c.isOpen });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: t.api.slugTaken }, { status: 409 });
    }
    throw error;
  }
}
