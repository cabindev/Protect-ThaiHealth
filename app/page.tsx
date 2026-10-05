// app/page.tsx — หน้าแรก: เปิดอยู่แคมเปญเดียว = พาไปหน้าแคมเปญ (ปก) ทันที · หลายแคมเปญ = รายการให้เลือก · ไม่มี = หน้าต้อนรับเปล่า
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PenLine } from 'lucide-react';
import prisma from './lib/db';
import { SITE } from './lib/site';
import { isAccepting, localizeCampaign } from './lib/campaign';
import { getDict, getLocale } from './i18n/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  const campaigns = await prisma.campaign.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { signatures: true } } },
  });
  const open = campaigns.filter((c) => isAccepting(c));
  if (open.length === 1) redirect(`/c/${open[0].slug}`);

  return (
    <main className="min-h-screen bg-white pt-24 pb-16 px-5">
      <div className="max-w-3xl mx-auto animate-rise">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-600">{SITE.shortName}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">{SITE.name}</h1>
        <p className="mt-3 text-gray-500">{t.site.tagline}</p>

        <h2 className="mt-12 text-sm font-semibold text-gray-800">{t.campaign.openCampaigns}</h2>
        {open.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">{t.campaign.noCampaigns}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {open.map((c) => {
              const l = localizeCampaign(c, locale);
              return (
                <li key={c.id}>
                  <Link
                    href={`/c/${c.slug}`}
                    className="block rounded-2xl border border-orange-100 p-5 hover:border-orange-300 hover:shadow-md transition-all"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 leading-snug">{l.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2 whitespace-pre-line">{l.summary}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-orange-700">{t.campaign.signers(c._count.signatures)}</span>
                      <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-orange-600 text-white text-sm font-semibold">
                        <PenLine className="w-4 h-4" /> {t.campaign.signNow}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
