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
    <main className="min-h-screen bg-white pt-16 pb-8 px-6 flex items-center">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div>
          {/* มีปก = ใช้พาดหัวปก (สั้นและอ่านจากท้ายห้องได้) */}
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">{l.hero?.title ?? l.title}</h1>
          {l.hero?.quote && <p className="mt-4 text-xl lg:text-2xl font-semibold text-orange-700">&ldquo;{l.hero.quote}&rdquo;</p>}
          <LiveCount slug={campaign.slug} initial={count} locale={locale} />
          {accepting && campaign.closesAt && (
            // นับถอยหลังตัวใหญ่ — กระตุ้นคนในห้องให้ลงชื่อตอนนั้นเลย
            <Countdown
              closesAt={campaign.closesAt.toISOString()}
              closesLabel={formatDeadline(campaign.closesAt, t.dateLocale)}
              serverNow={serverNow}
              locale={locale}
              size="lg"
              className="mt-6 justify-start"
            />
          )}
          <p className="mt-8 text-lg text-gray-500 break-all">{url.replace(/^https?:\/\//, '')}</p>
        </div>
        <div className="text-center">
          {/* svg จากไลบรารี qrcode (ไม่มีข้อมูลผู้ใช้ปน) */}
          <div className="mx-auto w-full max-w-[460px] [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="mt-4 text-2xl font-semibold text-orange-700">{accepting ? t.campaign.presentScan : t.campaign.closed}</p>
          <a
            href={`/c/${campaign.slug}/qr.png`}
            className="print:hidden mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-900"
          >
            <Download className="w-4 h-4" /> {t.campaign.downloadQr}
          </a>
        </div>
      </div>
    </main>
  );
}
