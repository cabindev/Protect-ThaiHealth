// app/qr/page.tsx — ทางลัด "QR Code" จากเมนู: แคมเปญเปิดอยู่แคมเปญเดียว = ไปจอ QR ทันที · หลายแคมเปญ = ให้เลือก
// ลิงก์สั้น /qr จำง่าย พิมพ์บนสไลด์/บอกปากเปล่าในห้องประชุมได้
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { localizeCampaign, openCampaigns } from '@/app/lib/campaign';
import { getDict, getLocale } from '@/app/i18n/server';

export const dynamic = 'force-dynamic';

export default async function QrShortcutPage() {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  const campaigns = await openCampaigns();
  if (campaigns.length === 1) redirect(`/c/${campaigns[0].slug}/present`);

  return (
    <main className="min-h-screen bg-white pt-24 pb-16 px-5">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">{t.nav.qr}</h1>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">{t.campaign.noCampaigns}</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {campaigns.map((c) => {
              const l = localizeCampaign(c, locale);
              return (
                <li key={c.id}>
                  <Link
                    href={`/c/${c.slug}/present`}
                    className="flex items-center gap-4 rounded-2xl border border-orange-100 p-5 hover:border-orange-300 hover:shadow-md transition-all"
                  >
                    <QrCode className="w-8 h-8 text-orange-600 shrink-0" />
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
