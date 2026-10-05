'use client';
// ปุ่มเปิด/ปิดรับลงชื่อ
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function ToggleOpen({ id, isOpen, accepting }: { id: number; isOpen: boolean; accepting: boolean }) {
  const { t } = useI18n();
  const a = t.adminCampaigns;
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: !isOpen }),
    });
    setBusy(false);
    if (!res.ok) return toast.error((await res.json().catch(() => ({}))).error || t.profile.saveFailed);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${accepting ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {accepting ? a.open : a.closed}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 ${
          isOpen ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'bg-orange-600 text-white hover:bg-orange-700'
        }`}
      >
        {isOpen ? a.toggleClose : a.toggleOpen}
      </button>
    </div>
  );
}
