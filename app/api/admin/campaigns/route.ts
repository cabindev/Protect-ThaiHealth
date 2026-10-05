// app/api/admin/campaigns/route.ts — POST สร้างแคมเปญ (แอดมินเท่านั้น)
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/app/lib/db';
import { getAdminUser } from '@/app/lib/adminAuth';
import { parseCampaignInput } from '@/app/lib/campaign';
import { writeAuditLog } from '@/app/lib/audit';
import { getDict } from '@/app/i18n/server';

export async function POST(request: NextRequest) {
  const t = await getDict();
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: t.api.adminOnly }, { status: 403 });

  const data = parseCampaignInput(await request.json().catch(() => ({})));
  if (!data) return NextResponse.json({ error: t.api.signInvalid }, { status: 400 });

  try {
    const c = await prisma.campaign.create({ data });
    await writeAuditLog({ action: 'CREATE', entityType: 'Campaign', entityId: c.id, entityName: c.titleTh, userId: admin.id });
    return NextResponse.json({ id: c.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: t.api.slugTaken }, { status: 409 });
    }
    throw error;
  }
}
