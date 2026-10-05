// app/dashboard/campaigns/page.tsx — รายการแคมเปญลงชื่อ (แอดมิน)
import Link from 'next/link';
import { Plus, PenLine } from 'lucide-react';
import prisma from '@/app/lib/db';
import { isAccepting, localizeCampaign } from '@/app/lib/campaign';
import { getDict, getLocale } from '@/app/i18n/server';

export default async function CampaignsPage() {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  const a = t.adminCampaigns;
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { signatures: true } } },
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{a.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{a.subtitle}</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" /> {a.newCampaign}
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 p-12 text-center text-sm text-gray-400">
          <PenLine className="w-10 h-10 text-orange-200 mx-auto mb-3" />
          {a.empty}
        </div>
      ) : (
        <ul className="grid gap-3">
          {campaigns.map((c) => {
            const open = isAccepting(c);
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/campaigns/${c.id}`}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-orange-100 bg-white p-5 hover:shadow-md hover:border-orange-300 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{localizeCampaign(c, locale).title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/c/{c.slug}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {open ? a.open : a.closed}
                  </span>
                  <span className="text-right">
                    <span className="block text-2xl font-bold text-gray-800 tabular-nums">{c._count.signatures.toLocaleString()}</span>
                    <span className="block text-xs text-gray-400">{a.signatures}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
