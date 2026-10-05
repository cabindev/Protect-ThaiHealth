// app/c/[slug]/page.tsx — หน้าแคมเปญลงชื่อ (สาธารณะ): บริบท + แถลงการณ์ + ตัวนับ + ฟอร์มเซ็นชื่อ + รายชื่อผู้สนับสนุน
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ExternalLink, PenLine } from 'lucide-react';
import type { Metadata } from 'next';
import prisma from '@/app/lib/db';
import { formatDeadline, isAccepting, localizeCampaign } from '@/app/lib/campaign';
import Countdown from '@/app/components/Countdown';
import { countryOptions } from '@/app/lib/countries';
import { getDict, getLocale } from '@/app/i18n/server';
import { cn } from '@/lib/utils';
import SignForm from './SignForm';
import StickySignButton from './StickySignButton';
import SupporterList, { PUBLIC_SUPPORTER_SELECT, publicSupporterWhere } from './SupporterList';

export const dynamic = 'force-dynamic';

const LATEST_SUPPORTERS = 5; // ที่เหลือดูที่ /c/[slug]/supporters

async function load(slug: string) {
  return prisma.campaign.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [c, locale] = await Promise.all([load((await params).slug), getLocale()]);
  if (!c) return {};
  const l = localizeCampaign(c, locale);
  return { title: l.title, description: l.summary.slice(0, 200), openGraph: { title: l.title, description: l.summary.slice(0, 200) } };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [campaign, t, locale] = await Promise.all([load(slug), getDict(), getLocale()]);
  if (!campaign) notFound();

  const l = localizeCampaign(campaign, locale);
  const accepting = isAccepting(campaign);
  // eslint-disable-next-line react-hooks/purity -- Server Component render ครั้งเดียวต่อ request: เวลาอ้างอิงให้ Countdown (กัน hydration ไม่ตรง)
  const serverNow = Date.now();
  // นับถอยหลังเฉพาะตอนยังเปิดรับและมีวันปิด
  const countdown =
    accepting && campaign.closesAt ? (
      <Countdown
        closesAt={campaign.closesAt.toISOString()}
        closesLabel={formatDeadline(campaign.closesAt, t.dateLocale)}
        serverNow={serverNow}
        locale={locale}
      />
    ) : null;
  const [count, countries, orgs, supporters, publicCount] = await Promise.all([
    prisma.signature.count({ where: { campaignId: campaign.id } }),
    prisma.signature.groupBy({ by: ['country'], where: { campaignId: campaign.id } }),
    prisma.signature.groupBy({ by: ['organization'], where: { campaignId: campaign.id, signingAs: 'ORGANIZATION' } }),
    campaign.showSigners
      ? prisma.signature.findMany({
          where: publicSupporterWhere(campaign.id),
          orderBy: { createdAt: 'desc' },
          take: LATEST_SUPPORTERS,
          select: PUBLIC_SUPPORTER_SELECT,
        })
      : Promise.resolve([]),
    campaign.showSigners ? prisma.signature.count({ where: publicSupporterWhere(campaign.id) }) : Promise.resolve(0),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* ปก — เต็มจอ พื้นส้มล้วน + แผนที่จุด halftone ไทย/เพื่อนบ้าน (public/maps/thailand-halftone.svg)
          ตัวอักษรกลางจอ สีเข้มบนส้ม (คอนทราสต์ผ่าน — ขาวบนส้มอ่านยากกว่า) · ปุ่มดำแบบภาพอ้างอิง */}
      {l.hero && (
        <section className="relative isolate overflow-hidden bg-orange-600 min-h-[100svh] flex items-center justify-center px-5 pt-20 pb-12 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG ตกแต่งไฟล์เดียว ไม่ต้องผ่าน next/image */}
          <img
            src="/maps/thailand-halftone.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 -z-10 h-full w-full object-cover object-[50%_42%] sm:object-contain"
          />
          <div className="max-w-2xl text-gray-950">
            <p className="font-mono text-[13px] tracking-wide text-gray-950/80">Protect ThaiHealth · {new Date().getFullYear()}</p>
            <h1 className="mt-4 text-[2rem] leading-[1.15] sm:text-[2.6rem] font-bold tracking-tight text-balance">{l.hero.title}</h1>
            {l.hero.subtitle && <p className="mt-3 text-lg sm:text-xl text-gray-950/85 text-balance">{l.hero.subtitle}</p>}
            {l.hero.quote && (
              <p className="mt-5 text-base sm:text-lg font-semibold leading-snug text-balance">&ldquo;{l.hero.quote}&rdquo;</p>
            )}
            <p className="mt-6 text-sm sm:text-[15px] text-gray-950/80">
              <span className="font-semibold text-gray-950">{t.campaign.signers(count)}</span>
              {orgs.length > 0 && <> · {t.campaign.organizationsCount(orgs.length)}</>}
              {countries.length > 0 && <> · {t.campaign.countries(countries.length)}</>}
            </p>
            {accepting ? (
              <SignCta label={t.campaign.signNow} className="mt-5 h-11 rounded-lg bg-gray-950 hover:bg-black" />
            ) : (
              <p className="mt-5 text-sm font-medium">{t.campaign.closedSummary(count, orgs.length)}</p>
            )}
            {accepting && campaign.closesAt && (
              <div className="mt-4">
                <Countdown
                  closesAt={campaign.closesAt.toISOString()}
                  closesLabel={formatDeadline(campaign.closesAt, t.dateLocale)}
                  serverNow={serverNow}
                  locale={locale}
                  tone="onBrand"
                />
              </div>
            )}
            <a href="#statement" className="mt-5 inline-flex items-center gap-1 text-sm text-gray-950/75 hover:text-gray-950">
              {t.campaign.readStatement} <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </section>
      )}

      <div className={`max-w-2xl mx-auto px-4 sm:px-0 pb-16 ${l.hero ? 'pt-10' : 'pt-20'}`}>
        {l.hero ? (
          <h2 id="statement" className="scroll-mt-20 pt-6 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-snug">
            {l.title}
          </h2>
        ) : (
          <h1 id="statement" className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-snug">{l.title}</h1>
        )}
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">{l.summary}</p>

        {/* ไม่มีปก → ตัวนับ + ปุ่มลงชื่ออยู่ใต้บริบท (มีปก = อยู่บนปกแล้ว) */}
        {!l.hero && (
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-orange-50 border border-orange-100 px-5 py-4">
            <Counter count={count} orgs={orgs.length} countries={countries.length} />
            {accepting && <SignCta label={t.campaign.signNow} className="mt-3 w-full sm:w-auto sm:ml-auto sm:mt-0 h-11" />}
            {countdown && <div className="w-full">{countdown}</div>}
          </div>
        )}

        {/* แถลงการณ์ */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-600">{t.campaign.statement}</h2>
          <div className="mt-3 text-[15px] text-gray-800 leading-7 whitespace-pre-line">{l.statement}</div>
        </section>

        {/* ฟอร์ม */}
        <section id="sign" className="mt-10 scroll-mt-20 rounded-2xl border border-orange-100 p-5 sm:p-6">
          {accepting ? (
            <SignForm slug={campaign.slug} countries={countryOptions(t.dateLocale)} />
          ) : (
            <p className="text-center text-gray-600 font-medium py-6">{t.campaign.closedSummary(count, orgs.length)}</p>
          )}
        </section>

        {accepting && <StickySignButton />}

        {/* ช่องทางทางการ (คนไทยไปกรอกเองด้วยเลขบัตรของตัวเอง) */}
        {campaign.officialUrl && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-sm font-semibold text-gray-800">{t.campaign.officialTitle}</h2>
            <p className="mt-1 text-sm text-gray-500">{t.campaign.officialBody}</p>
            {campaign.officialClosesAt && (
              <p className="mt-1 text-sm font-medium text-gray-700">
                {t.campaign.officialDeadline(formatDeadline(campaign.officialClosesAt, t.dateLocale))}
              </p>
            )}
            <a
              href={campaign.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              {t.campaign.officialLink} <ExternalLink className="w-4 h-4" />
            </a>
          </section>
        )}

        {/* ผู้สนับสนุนล่าสุด 5 คน — ทั้งหมดอยู่หน้า /supporters (หลายร้อยคนจะทำให้หน้านี้ยาว/ช้า) */}
        {supporters.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-gray-800">{t.campaign.supporters}</h2>
            <div className="mt-3">
              <SupporterList rows={supporters} dateLocale={t.dateLocale} readMore={t.campaign.readMore} />
            </div>
            {publicCount > supporters.length && (
              <Link
                href={`/c/${campaign.slug}/supporters`}
                className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900"
              >
                {t.campaign.viewAllSupporters(publicCount)} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

// ตัวนับรายชื่อ — ใช้ทั้งบนปกและแบบไม่มีปก
async function Counter({ count, orgs, countries, centered }: { count: number; orgs: number; countries: number; centered?: boolean }) {
  const t = await getDict();
  return (
    <div className={centered ? 'rounded-2xl bg-orange-50 border border-orange-100 px-5 py-4' : 'contents'}>
      <span className={`font-bold text-orange-700 ${centered ? 'block text-3xl' : 'text-2xl'}`}>{t.campaign.signers(count)}</span>
      <span className={centered ? 'mt-1 flex flex-wrap justify-center gap-x-3 text-sm' : 'contents'}>
        {orgs > 0 && <span className="text-sm font-semibold text-gray-700">{t.campaign.orgs(orgs)}</span>}
        {countries > 0 && <span className="text-sm text-gray-500">{t.campaign.countries(countries)}</span>}
      </span>
    </div>
  );
}

// ปุ่ม "ร่วมลงชื่อ" ไปที่ฟอร์ม — id ใช้กับ StickySignButton (ปุ่มลอยซ่อนเมื่อเห็นปุ่มนี้)
function SignCta({ label, className }: { label: string; className?: string }) {
  return (
    <a
      id="sign-cta"
      href="#sign"
      className={cn('inline-flex items-center justify-center gap-2 px-5 rounded-full bg-orange-600 text-white text-[15px] font-semibold hover:bg-orange-700', className)}
    >
      <PenLine className="w-4 h-4" /> {label}
    </a>
  );
}
