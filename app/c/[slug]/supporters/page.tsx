// app/c/[slug]/supporters/page.tsx — ผู้สนับสนุนทั้งหมด (สาธารณะ) แบ่งหน้าละ 50 คน ใหม่สุดก่อน
// แยกจากหน้าแคมเปญ ให้หน้าลงชื่อสั้นและโหลดเร็ว แม้มีผู้ลงชื่อหลายร้อยคน
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ChevronLeft, ChevronRight, PenLine } from 'lucide-react';
import prisma from '@/app/lib/db';
import { isAccepting, localizeCampaign } from '@/app/lib/campaign';
import { getDict, getLocale } from '@/app/i18n/server';
import SupporterList, { PUBLIC_SUPPORTER_SELECT_DETAILED, publicSupporterWhere } from '../SupporterList';

export const dynamic = 'force-dynamic';

const PER_PAGE = 50;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [c, t, locale] = await Promise.all([prisma.campaign.findUnique({ where: { slug: (await params).slug } }), getDict(), getLocale()]);
  if (!c) return {};
  return { title: `${t.campaign.allSupporters} — ${localizeCampaign(c, locale).hero?.title ?? localizeCampaign(c, locale).title}` };
}

export default async function SupportersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const [campaign, t, locale] = await Promise.all([prisma.campaign.findUnique({ where: { slug } }), getDict(), getLocale()]);
  // ปิดการแสดงรายชื่อในแคมเปญนี้ = ไม่มีหน้านี้
  if (!campaign || !campaign.showSigners) notFound();

  const where = publicSupporterWhere(campaign.id);
  const total = await prisma.signature.count({ where });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number((await searchParams).page) || 1));
  const rows = await prisma.signature.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    select: PUBLIC_SUPPORTER_SELECT_DETAILED, // ครบ ยกเว้นนามสกุล/อีเมล/ลายเซ็น
  });
  const l = localizeCampaign(campaign, locale);
  const href = (p: number) => `/c/${slug}/supporters${p > 1 ? `?page=${p}` : ''}`;
  const navBtn = 'inline-flex items-center gap-1 h-10 px-4 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-900';

  return (
    <main className="min-h-screen bg-white pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/c/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-700">
          <ArrowLeft className="w-4 h-4" /> {l.hero?.title ?? l.title}
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{t.campaign.allSupporters}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.campaign.publicSupportersCount(total)}</p>

        {isAccepting(campaign) && (
          <Link
            href={`/c/${slug}#sign`}
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-orange-600 text-white text-[15px] font-semibold hover:bg-orange-700"
          >
            <PenLine className="w-4 h-4" /> {t.campaign.signNow}
          </Link>
        )}

        <div className="mt-6">
          <SupporterList
            rows={rows}
            dateLocale={t.dateLocale}
            readMore={t.campaign.readMore}
            detailed={{ asOrganization: t.campaign.asOrganization, asIndividual: t.campaign.asIndividual }}
          />
        </div>

        {pages > 1 && (
          <nav className="mt-8 flex items-center justify-between gap-3" aria-label={t.campaign.allSupporters}>
            {page > 1 ? (
              <Link href={href(page - 1)} className={navBtn}>
                <ChevronLeft className="w-4 h-4" /> {t.campaign.prevPage}
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-gray-500 tabular-nums">{t.campaign.pageOf(page, pages)}</span>
            {page < pages ? (
              <Link href={href(page + 1)} className={navBtn}>
                {t.campaign.nextPage} <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
