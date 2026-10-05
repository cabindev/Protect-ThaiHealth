// app/supporters/page.tsx — ทางลัด "ผู้สนับสนุน" จากเมนู: แคมเปญเปิดอยู่แคมเปญเดียว = ไปหน้ารายชื่อทันที · หลายแคมเปญ = ให้เลือก
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { localizeCampaign, openCampaigns } from '@/app/lib/campaign';
import { getDict, getLocale } from '@/app/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SupportersShortcutPage() {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  // แคมเปญที่ปิดการแสดงรายชื่อไว้ ไม่มีหน้าผู้สนับสนุน
  const campaigns = (await openCampaigns()).filter((c) => c.showSigners);
  if (campaigns.length === 1) redirect(`/c/${campaigns[0].slug}/supporters`);

  return (
    <main className="min-h-screen bg-white pt-24 pb-16 px-5">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">{t.campaign.allSupporters}</h1>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">{t.campaign.noCampaigns}</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {campaigns.map((c) => {
              const l = localizeCampaign(c, locale);
              return (
                <li key={c.id}>
                  <Link
                    href={`/c/${c.slug}/supporters`}
                    className="flex items-center gap-4 rounded-2xl border border-orange-100 p-5 hover:border-orange-300 hover:shadow-md transition-all"
                  >
                    <Users className="w-8 h-8 text-orange-600 shrink-0" />
                    <span className="font-semibold text-gray-900">{l.hero?.title ?? l.title}</span>
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
