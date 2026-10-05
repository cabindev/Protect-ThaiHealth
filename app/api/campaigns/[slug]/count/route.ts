// app/api/campaigns/[slug]/count/route.ts — จำนวนผู้ลงชื่อ (สาธารณะ) ใช้กับจอ QR ในห้องประชุมที่รีเฟรชตัวเลขทุกไม่กี่วินาที
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { NO_STORE } from '@/app/lib/uploads';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: 'not found' }, { status: 404, headers: NO_STORE });
  const [count, countries, orgs] = await Promise.all([
    prisma.signature.count({ where: { campaignId: campaign.id } }),
    prisma.signature.groupBy({ by: ['country'], where: { campaignId: campaign.id } }),
    prisma.signature.groupBy({ by: ['organization'], where: { campaignId: campaign.id, signingAs: 'ORGANIZATION' } }),
  ]);
  return NextResponse.json({ count, countries: countries.length, orgs: orgs.length }, { headers: NO_STORE });
}
