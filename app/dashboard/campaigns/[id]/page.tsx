// app/dashboard/campaigns/[id]/page.tsx — รายละเอียดแคมเปญ (แอดมิน): สถิติ, ทางลัด, แยกตามประเทศ, ตารางรายชื่อ
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileSpreadsheet, Printer, QrCode, SquarePen } from 'lucide-react';
import prisma from '@/app/lib/db';
import { isAccepting, localizeCampaign } from '@/app/lib/campaign';
import { countryName } from '@/app/lib/countries';
import { getDict, getLocale } from '@/app/i18n/server';
import ToggleOpen from './ToggleOpen';
import SignatureTable from './SignatureTable';

const btn =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-orange-200 text-orange-700 text-xs font-medium hover:bg-orange-50 transition-colors';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [campaign, t, locale] = await Promise.all([
    Number.isInteger(id) ? prisma.campaign.findUnique({ where: { id } }) : null,
    getDict(),
    getLocale(),
  ]);
  if (!campaign) notFound();
  const a = t.adminCampaigns;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [signatures, byCountry, orgs, today, withComment] = await Promise.all([
    prisma.signature.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, organization: true, position: true, signingAs: true, country: true, comment: true, signaturePath: true, showPublic: true, createdAt: true },
    }),
    prisma.signature.groupBy({ by: ['country'], where: { campaignId: id }, _count: { _all: true }, orderBy: { _count: { country: 'desc' } } }),
    prisma.signature.groupBy({ by: ['organization'], where: { campaignId: id, signingAs: 'ORGANIZATION' } }),
    prisma.signature.count({ where: { campaignId: id, createdAt: { gte: startOfToday } } }),
    prisma.signature.count({ where: { campaignId: id, comment: { not: null } } }),
  ]);
  const maxCountry = Math.max(1, ...byCountry.map((c) => c._count._all));

  const stats = [
    { label: a.total, value: signatures.length },
    { label: a.countriesCount, value: byCountry.length },
    { label: a.orgsCount, value: orgs.length },
    { label: a.individuals, value: signatures.filter((s) => s.signingAs === 'INDIVIDUAL').length },
    { label: a.today, value: today },
    { label: a.withComment, value: withComment },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600">
        <ArrowLeft className="w-3.5 h-3.5" /> {a.title}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">{localizeCampaign(campaign, locale).title}</h1>
          <p className="text-xs text-gray-400 mt-1">/c/{campaign.slug}</p>
        </div>
        <ToggleOpen id={campaign.id} isOpen={campaign.isOpen} accepting={isAccepting(campaign)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/c/${campaign.slug}`} target="_blank" className={btn}>
          <ExternalLink className="w-4 h-4" /> {a.view}
        </Link>
        <Link href={`/c/${campaign.slug}/present`} target="_blank" className={btn}>
          <QrCode className="w-4 h-4" /> {a.present}
        </Link>
        <a href={`/api/admin/campaigns/${campaign.id}/export`} className={btn}>
          <FileSpreadsheet className="w-4 h-4" /> {a.exportCsv}
        </a>
        <Link href={`/dashboard/campaigns/${campaign.id}/print`} target="_blank" className={btn}>
          <Printer className="w-4 h-4" /> {a.print}
        </Link>
        <Link href={`/dashboard/campaigns/${campaign.id}/edit`} className={btn}>
          <SquarePen className="w-4 h-4" /> {a.editCampaign}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-orange-100 p-4">
            <p className="text-3xl font-bold text-gray-800 tabular-nums">{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {byCountry.length > 0 && (
        <section className="bg-white rounded-2xl border border-orange-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">{a.byCountry}</h2>
          <ul className="space-y-2">
            {byCountry.map((c) => (
              <li key={c.country} className="flex items-center gap-3">
                <span className="text-xs text-gray-700 w-40 truncate">{countryName(c.country, t.dateLocale)}</span>
                <span className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <span className="block h-full rounded-full bg-orange-500" style={{ width: `${(c._count._all / maxCountry) * 100}%` }} />
                </span>
                <span className="text-xs text-gray-500 w-10 text-right tabular-nums">{c._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SignatureTable
        rows={signatures.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), countryLabel: countryName(s.country, t.dateLocale) }))}
      />
    </div>
  );
}
