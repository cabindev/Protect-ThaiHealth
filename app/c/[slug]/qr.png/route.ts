// app/c/[slug]/qr.png/route.ts — ไฟล์ QR (PNG 1200px) ของหน้าแคมเปญ สำหรับดาวน์โหลดไปทำโปสเตอร์/ส่งต่อใน LINE
// ลิงก์ใน QR ใช้โดเมนที่เปิดอยู่จริง (lib/publicUrl) — บน production จึงชี้โดเมนจริงเอง
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/app/lib/db';
import { publicUrl } from '@/app/lib/publicUrl';
import { NO_STORE } from '@/app/lib/uploads';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { slug: true } });
  if (!campaign) return NextResponse.json({ error: 'not found' }, { status: 404, headers: NO_STORE });

  const url = await publicUrl(`/c/${campaign.slug}`);
  const png = await QRCode.toBuffer(url, { type: 'png', width: 1200, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#ffffff' } });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-${campaign.slug}.png"`,
      'Cache-Control': 'no-store', // ขึ้นกับโดเมนที่เปิด — ห้าม cache ข้ามโดเมน
    },
  });
}
