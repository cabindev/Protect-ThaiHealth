'use client';
// app/i18n/LanguageSwitcher.tsx — ปุ่มสลับภาษา TH | EN
// บันทึกลง cookie แล้ว router.refresh() ให้ server render ใหม่ด้วยภาษาที่เลือก (ไม่เปลี่ยน URL, ไม่ต้องโหลดหน้าใหม่)
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_COOKIE, type Locale } from './config';
import { useI18n } from './I18nProvider';

// เขียน cookie นอก component (React Compiler ไม่ให้แก้ global ใน render scope)
function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    saveLocale(next);
    startTransition(() => router.refresh());
  };

  return (
    <div
      role="group"
      aria-label={t.lang.switch}
      className={cn(
        'inline-flex items-center h-9 p-0.5 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-sm',
        isPending && 'opacity-60',
        className
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          disabled={isPending}
          aria-pressed={l === locale}
          title={t.lang[l]}
          className={cn(
            'h-full px-2.5 rounded-full text-[11px] font-semibold uppercase transition-colors',
            l === locale ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-orange-700'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
