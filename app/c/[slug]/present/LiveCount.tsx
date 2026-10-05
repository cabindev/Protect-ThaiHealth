'use client';
// ตัวเลขผู้ลงชื่อบนจอฉาย — ดึงใหม่ทุก 5 วินาที
import { useEffect, useState } from 'react';
import { getDictionaryFor } from '@/app/i18n/dictionaries';
import type { Locale } from '@/app/i18n/config';

// locale มาจากหน้าจอฉาย (อังกฤษเป็นค่าเริ่มต้น) ไม่ใช้ภาษาที่ผู้ชมเลือกไว้
export default function LiveCount({ slug, initial, locale }: { slug: string; initial: number; locale: Locale }) {
  const t = getDictionaryFor(locale);
  const [data, setData] = useState({ count: initial, countries: 0, orgs: 0 });

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/campaigns/${slug}/count`, { cache: 'no-store' });
        if (res.ok && alive) setData(await res.json());
      } catch {
        // เน็ตสะดุดชั่วคราว — รอรอบถัดไป
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug]);

  return (
    <div className="mt-8">
      <p className="text-6xl lg:text-8xl font-bold text-orange-600 tabular-nums">{data.count.toLocaleString('en-US')}</p>
      <p className="mt-2 text-xl text-gray-600" lang={locale}>
        {t.campaign.signers(data.count)}
        {data.orgs > 0 && <> · {t.campaign.orgs(data.orgs)}</>}
        {data.countries > 0 && <> · {t.campaign.countries(data.countries)}</>}
      </p>
    </div>
  );
}
