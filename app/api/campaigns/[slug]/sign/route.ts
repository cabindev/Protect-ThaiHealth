// app/api/campaigns/[slug]/sign/route.ts — ลงชื่อสนับสนุนแคมเปญ (สาธารณะ ไม่ต้อง login)
// multipart: signingAs (ORGANIZATION|INDIVIDUAL), position, firstName, lastName, email, organization, country, comment (ไม่บังคับ ≤ 2,500 คำ), showPublic, consent, website (honeypot), signature (PNG)
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { Prisma } from '@prisma/client';
import prisma from '@/app/lib/db';
import { UPLOAD_ROOT } from '@/app/lib/uploads';
import { isAccepting, isPng, SIGNATURE_MAX_BYTES } from '@/app/lib/campaign';
import { isCountryCode } from '@/app/lib/countries';
import { countWords, MAX_COMMENT_CHARS, MAX_COMMENT_WORDS } from '@/app/lib/wordCount';
import { getDict, getLocale } from '@/app/i18n/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// กันยิงรัว: 1 IP ส่งได้ไม่เกิน 20 ครั้ง / 10 นาที (ห้องประชุมใช้ Wi-Fi เดียวกันหลายคน จึงเผื่อไว้)
// เก็บในหน่วยความจำ — รีสตาร์ตแล้วล้าง ซึ่งพอสำหรับกันสแปมทั่วไป
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();
function tooMany(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

const clip = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  const { slug } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, isOpen: true, closesAt: true } });
  if (!campaign) return NextResponse.json({ error: t.api.campaignNotFound }, { status: 404 });
  if (!isAccepting(campaign)) return NextResponse.json({ error: t.api.signClosed }, { status: 403 });

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  const ipHash = crypto.createHash('sha256').update(`${ip}|${process.env.NEXTAUTH_SECRET ?? ''}`).digest('hex');
  if (tooMany(ipHash)) return NextResponse.json({ error: t.api.signTooMany }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: t.api.signInvalid }, { status: 400 });
  }

  // honeypot: ช่องที่คนมองไม่เห็น — มีค่า = บอท (ตอบเหมือนสำเร็จ ไม่บันทึก)
  if (clip(form.get('website'), 100)) return NextResponse.json({ ok: true });

  const firstName = clip(form.get('firstName'), 100);
  const lastName = clip(form.get('lastName'), 100);
  const email = clip(form.get('email'), 191).toLowerCase();
  const signingAs = form.get('signingAs');
  const asOrg = signingAs === 'ORGANIZATION';
  const organization = clip(form.get('organization'), 200);
  const position = clip(form.get('position'), 150);
  const country = clip(form.get('country'), 2).toUpperCase();
  const showPublic = form.get('showPublic') === '1';
  const consent = form.get('consent') === '1';
  const signature = form.get('signature');
  // ความคิดเห็น: คงการขึ้นบรรทัดใหม่ไว้ (ไม่ใช้ clip ที่ยุบช่องว่าง) แค่ตัดหัวท้าย + ยุบบรรทัดว่างเกิน 2 บรรทัด
  const commentRaw = String(form.get('comment') ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (commentRaw.length > MAX_COMMENT_CHARS || countWords(commentRaw) > MAX_COMMENT_WORDS) {
    return NextResponse.json({ error: t.api.commentTooLong }, { status: 400 });
  }

  if (
    (signingAs !== 'ORGANIZATION' && signingAs !== 'INDIVIDUAL') ||
    // ในนามองค์กร: ต้องมีชื่อองค์กร + ตำแหน่ง · ในนามส่วนตัว: สังกัดไม่บังคับ
    (asOrg && (!organization || !position)) ||
    !firstName || !lastName || !consent ||
    !EMAIL_RE.test(email) || !isCountryCode(country) ||
    !(signature instanceof File) || signature.size === 0 || signature.size > SIGNATURE_MAX_BYTES
  ) {
    return NextResponse.json({ error: t.api.signInvalid }, { status: 400 });
  }
  const buf = Buffer.from(await signature.arrayBuffer());
  if (!isPng(buf)) return NextResponse.json({ error: t.api.signInvalid }, { status: 400 });

  // เช็คซ้ำก่อนเขียนไฟล์ (unique index ใน DB กันซ้ำอีกชั้นตอนส่งพร้อมกัน)
  const dup = await prisma.signature.findUnique({
    where: { campaignId_email: { campaignId: campaign.id, email } },
    select: { id: true },
  });
  if (dup) return NextResponse.json({ error: t.api.signDuplicate }, { status: 409 });

  const relPath = `signatures/${campaign.id}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.png`;
  const absPath = path.join(UPLOAD_ROOT, relPath);
  try {
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, buf);
    await prisma.signature.create({
      data: {
        campaignId: campaign.id,
        firstName,
        lastName,
        email,
        signingAs: asOrg ? 'ORGANIZATION' : 'INDIVIDUAL',
        position: asOrg ? position : null,
        organization,
        country,
        comment: commentRaw || null,
        signaturePath: relPath,
        showPublic,
        locale,
        ipHash,
        userAgent: (request.headers.get('user-agent') ?? '').slice(0, 300) || null,
      },
    });
  } catch (error) {
    await fs.rm(absPath).catch(() => {});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: t.api.signDuplicate }, { status: 409 });
    }
    console.error('sign failed:', error);
    return NextResponse.json({ error: t.api.signFailed }, { status: 500 });
  }

  const count = await prisma.signature.count({ where: { campaignId: campaign.id } });
  return NextResponse.json({ ok: true, count });
}
