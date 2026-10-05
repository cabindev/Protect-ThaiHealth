'use client';
// ตัวเลขผู้ลงชื่อบนจอฉาย — ดึงใหม่ทุก 5 วินาที
// มีคนลงชื่อเพิ่ม → ตัวเลขเด้ง + ป้าย "+N" ลอยขึ้น ให้ทั้งห้องเห็นว่ามีคนเพิ่มจริง (ปิดเองเมื่อเครื่องตั้ง "ลดการเคลื่อนไหว")
import { useEffect, useRef, useState } from 'react';
import { getDictionaryFor } from '@/app/i18n/dictionaries';
import type { Locale } from '@/app/i18n/config';

// locale มาจากหน้าจอฉาย (อังกฤษเป็นค่าเริ่มต้น) ไม่ใช้ภาษาที่ผู้ชมเลือกไว้
export default function LiveCount({ slug, initial, locale }: { slug: string; initial: number; locale: Locale }) {
  const t = getDictionaryFor(locale);
  const [data, setData] = useState({ count: initial, countries: 0, orgs: 0 });
  // key เปลี่ยน = เล่นแอนิเมชันใหม่ · delta = จำนวนที่เพิ่มในรอบนั้น
  const [bump, setBump] = useState<{ key: number; delta: number } | null>(null);
  const last = useRef(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/campaigns/${slug}/count`, { cache: 'no-store' });
        if (!res.ok || !alive) return;
        const next = await res.json();
        if (next.count > last.current) setBump({ key: Date.now(), delta: next.count - last.current });
        last.current = next.count;
        setData(next);
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
      <div className="relative inline-flex items-start">
        <p key={bump?.key ?? 0} className={`font-mono text-7xl lg:text-9xl font-medium tabular-nums text-gray-950 ${bump ? 'count-bump' : ''}`}>
          {data.count.toLocaleString('en-US')}
        </p>
        {bump && (
          <span
            key={`plus-${bump.key}`}
            className="plus-float absolute -right-4 -top-2 translate-x-full rounded-full bg-gray-950 px-3 py-1 font-mono text-xl font-medium text-white"
            aria-hidden="true"
          >
            +{bump.delta}
          </span>
        )}
      </div>
      <p className="mt-3 text-xl lg:text-2xl text-gray-950/80" lang={locale} aria-live="polite">
        {t.campaign.signers(data.count)}
        {data.orgs > 0 && <> · {t.campaign.orgs(data.orgs)}</>}
        {data.countries > 0 && <> · {t.campaign.countries(data.countries)}</>}
      </p>
    </div>
  );
}
