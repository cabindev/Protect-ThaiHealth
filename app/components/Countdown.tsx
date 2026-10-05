'use client';
// นับถอยหลังถึงวันปิดรับลงชื่อ — แบบสุภาพ ไม่มีนาฬิกาเดินวินาที
// > 48 ชม. "เหลือ 8 วัน" · ≤ 48 ชม. "เหลือ 18 ชั่วโมง" (สีส้มเข้ม) · < 1 ชม. "เหลือ 12 นาที" · ถึงเวลา = refresh ให้ server สลับเป็นหน้าปิดรับ
// ค่าเริ่มต้นใช้ serverNow (กัน hydration ไม่ตรง) แล้วค่อยใช้นาฬิกาเครื่องหลัง mount
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { getDictionaryFor } from '@/app/i18n/dictionaries';
import type { Locale } from '@/app/i18n/config';
import { cn } from '@/lib/utils';

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export default function Countdown({
  closesAt,
  closesLabel,
  serverNow,
  locale,
  size = 'sm',
  className,
}: {
  closesAt: string; // ISO
  closesLabel: string; // ข้อความวันเวลาปิด (จัดรูปแบบจาก server)
  serverNow: number;
  locale: Locale;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const t = getDictionaryFor(locale).campaign;
  const router = useRouter();
  const [now, setNow] = useState(serverNow);
  const refreshed = useRef(false);
  const end = new Date(closesAt).getTime();
  const left = end - now;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000); // นาทีละครั้งพอ (แสดงละเอียดสุดระดับนาที)
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  // ครบเวลา → ให้ server render ใหม่ (ฟอร์มหาย, ขึ้นสรุปปิดรับ)
  useEffect(() => {
    if (left <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [left, router]);

  if (left <= 0) return null;

  const urgent = left <= 2 * DAY;
  const text =
    left > 2 * DAY
      ? t.daysLeft(Math.floor(left / DAY))
      : left >= HOUR
        ? t.hoursLeft(Math.floor(left / HOUR))
        : t.minutesLeft(Math.max(1, Math.ceil(left / 60_000)));

  return (
    <p
      className={cn(
        'inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5',
        size === 'lg' ? 'text-2xl lg:text-3xl' : 'text-sm',
        className
      )}
      aria-live="polite"
    >
      <Clock className={cn('shrink-0', size === 'lg' ? 'w-7 h-7' : 'w-4 h-4', urgent ? 'text-orange-600' : 'text-gray-400')} />
      <span className={cn('font-semibold', urgent ? 'text-orange-700' : 'text-gray-800')}>{text}</span>
      {/* จอใหญ่: วันปิดขึ้นบรรทัดของตัวเอง (ไม่ตัดกลางประโยค) */}
      <span className={cn('text-gray-500', size === 'lg' && 'basis-full text-xl lg:text-2xl')}>
        {size === 'lg' ? t.closesOn(closesLabel) : `· ${t.closesOn(closesLabel)}`}
      </span>
    </p>
  );
}
