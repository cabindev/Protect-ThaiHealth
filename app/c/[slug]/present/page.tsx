// app/c/[slug]/present/page.tsx — จอฉายในห้องประชุม: QR ใหญ่ + จำนวนผู้ลงชื่อแบบสด (สาธารณะ)
// ภาษาอังกฤษเสมอ ไม่ตามภาษาที่เครื่องเลือกไว้ (ฉายให้ทั้งห้อง รวมเครือข่ายต่างประเทศ) · ?lang=th = ฉายเป็นไทย
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import prisma from '@/app/lib/db';
import { formatDeadline, isAccepting, localizeCampaign } from '@/app/lib/campaign';
import Countdown from '@/app/components/Countdown';
import { publicUrl } from '@/app/lib/publicUrl';
import { getDictionaryFor } from '@/app/i18n/dictionaries';
import type { Locale } from '@/app/i18n/config';
import LiveCount from './LiveCount';

export const dynamic = 'force-dynamic';

export default async function PresentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const locale: Locale = (await searchParams).lang === 'th' ? 'th' : 'en';
  const t = getDictionaryFor(locale);
  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign) notFound();

  const url = await publicUrl(`/c/${campaign.slug}`);
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#ffffff' } });
  const count = await prisma.signature.count({ where: { campaignId: campaign.id } });
  const l = localizeCampaign(campaign, locale);
  const accepting = isAccepting(campaign);
  // eslint-disable-next-line react-hooks/purity -- เวลาอ้างอิงให้ Countdown (Server Component render ครั้งเดียวต่อ request)
  const serverNow = Date.now();

  return (
    // โทนเดียวกับปก: พื้นส้ม + แผนที่ halftone + คลื่นกรุงเทพฯ · ตัวอักษรเข้ม · QR อยู่บนการ์ดขาว (สแกนติดง่าย)
    <main className="relative isolate overflow-hidden min-h-screen bg-orange-600 px-6 py-10 flex items-center text-gray-950">
      <div className="hero-drift pointer-events-none select-none absolute -inset-[3%] -z-10" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG ตกแต่ง */}
        <img src="/maps/thailand-halftone.svg" alt="" className="h-full w-full object-contain scale-[1.3] object-[30%_50%]" />
      </div>
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <p className="font-mono text-base tracking-wide text-gray-950/80">Protect ThaiHealth · {new Date().getFullYear()}</p>
          {/* มีปก = ใช้พาดหัวปก (สั้นและอ่านจากท้ายห้องได้) */}
          <h1 className="mt-4 text-4xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-balance">{l.hero?.title ?? l.title}</h1>
          {l.hero?.quote && <p className="mt-5 text-xl lg:text-2xl font-semibold text-balance">&ldquo;{l.hero.quote}&rdquo;</p>}
          <LiveCount slug={campaign.slug} initial={count} locale={locale} />
          {accepting && campaign.closesAt && (
            // นับถอยหลังตัวใหญ่ — กระตุ้นคนในห้องให้ลงชื่อตอนนั้นเลย
            <Countdown
              closesAt={campaign.closesAt.toISOString()}
              closesLabel={formatDeadline(campaign.closesAt, t.dateLocale)}
              serverNow={serverNow}
              locale={locale}
              size="lg"
              tone="onBrand"
              className="mt-6 justify-start"
            />
          )}
        </div>
        <div className="text-center">
          {/* svg จากไลบรารี qrcode (ไม่มีข้อมูลผู้ใช้ปน) — การ์ดขาวขอบกว้าง ให้กล้องมือถือจับได้ง่ายจากระยะไกล */}
          <div className="mx-auto w-full max-w-[440px] rounded-3xl bg-white p-6 shadow-2xl shadow-orange-950/25">
            <div className="[&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <p className="mt-6 text-3xl font-bold">{accepting ? t.campaign.presentScan : t.campaign.closed}</p>
          <p className="mt-2 font-mono text-lg text-gray-950/80 break-all">{url.replace(/^https?:\/\//, '')}</p>
          <a
            href={`/c/${campaign.slug}/qr.png`}
            className="print:hidden mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/90 text-sm font-medium text-gray-900 hover:bg-white"
          >
            <Download className="w-4 h-4" /> {t.campaign.downloadQr}
          </a>
        </div>
      </div>
    </main>
  );
}
