'use client';
import { Printer } from 'lucide-react';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function PrintButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
    >
      <Printer className="w-4 h-4" /> {t.adminCampaigns.print}
    </button>
  );
}
