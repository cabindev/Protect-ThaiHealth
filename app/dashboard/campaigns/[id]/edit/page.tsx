import { notFound } from 'next/navigation';
import prisma from '@/app/lib/db';
import { getDict } from '@/app/i18n/server';
import CampaignForm from '../../CampaignForm';

// Date → ค่า datetime-local ตามเวลาไทย (เซิร์ฟเวอร์อาจอยู่คนละ timezone)
const toLocalInput = (d: Date | null) =>
  d ? new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16) : '';

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [c, t] = await Promise.all([Number.isInteger(id) ? prisma.campaign.findUnique({ where: { id } }) : null, getDict()]);
  if (!c) notFound();
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t.adminCampaigns.editCampaign}</h1>
      <CampaignForm
        initial={{
          id: c.id,
          slug: c.slug,
          titleTh: c.titleTh,
          titleEn: c.titleEn,
          summaryTh: c.summaryTh,
          summaryEn: c.summaryEn,
          statementTh: c.statementTh,
          statementEn: c.statementEn,
          officialUrl: c.officialUrl ?? '',
          heroTitleTh: c.heroTitleTh ?? '',
          heroTitleEn: c.heroTitleEn ?? '',
          heroSubtitleTh: c.heroSubtitleTh ?? '',
          heroSubtitleEn: c.heroSubtitleEn ?? '',
          heroQuoteTh: c.heroQuoteTh ?? '',
          heroQuoteEn: c.heroQuoteEn ?? '',
          closesAt: toLocalInput(c.closesAt),
          officialClosesAt: toLocalInput(c.officialClosesAt),
          isOpen: c.isOpen,
          showSigners: c.showSigners,
        }}
      />
    </div>
  );
}
