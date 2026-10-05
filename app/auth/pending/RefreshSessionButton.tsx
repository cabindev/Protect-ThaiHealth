'use client';
// อนุมัติแล้วแต่ cookie ยังเป็น pending → update() ให้ jwt callback อ่าน role ใหม่จาก DB แล้วไปหน้าหลัก
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SITE } from '@/app/lib/site';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function RefreshSessionButton() {
  const { update } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await update();
        router.push(SITE.homeAfterLogin);
        router.refresh();
      }}
      className="mt-6 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-60"
    >
      {busy ? t.auth.pending.entering : t.auth.pending.enter}
    </button>
  );
}
