// app/api/admin/campaigns/[id]/export/route.ts — ส่งออกรายชื่อเป็น CSV (UTF-8 + BOM ให้ Excel อ่านภาษาไทยถูก)
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getAdminUser } from '@/app/lib/adminAuth';
import { countryName } from '@/app/lib/countries';
import { getDict } from '@/app/i18n/server';

// กัน CSV injection: ค่าที่ขึ้นต้นด้วย = + - @ ให้ Excel มองเป็นข้อความ
const cell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getDict();
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: t.api.adminOnly }, { status: 403 });

  const id = Number((await params).id);
  const campaign = Number.isInteger(id) ? await prisma.campaign.findUnique({ where: { id }, select: { slug: true } }) : null;
  if (!campaign) return NextResponse.json({ error: t.api.campaignNotFound }, { status: 404 });

  const rows = await prisma.signature.findMany({ where: { campaignId: id }, orderBy: { createdAt: 'asc' } });
  const c = t.adminCampaigns.cols;
  const header = [c.no, c.signingAs, t.common.firstName, t.common.lastName, c.position, c.email, c.org, c.country, 'ISO', c.date, c.public, c.comment];
  const lines = rows.map((r, i) =>
    [
      String(i + 1),
      r.signingAs === 'ORGANIZATION' ? t.campaign.asOrganization : t.campaign.asIndividual,
      r.firstName,
      r.lastName,
      r.position ?? '',
      r.email,
      r.organization,
      countryName(r.country, t.dateLocale),
      r.country,
      r.createdAt.toISOString(),
      r.showPublic ? 'Y' : 'N',
      r.comment ?? '',
    ]
      .map(cell)
      .join(',')
  );
  const csv = '﻿' + [header.map(cell).join(','), ...lines].join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${campaign.slug}-signatures-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
