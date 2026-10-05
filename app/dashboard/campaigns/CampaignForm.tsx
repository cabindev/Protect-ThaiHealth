'use client';
// ฟอร์มสร้าง/แก้ไขแคมเปญ (แอดมิน) — ข้อความ 2 ภาษา: ช่องอังกฤษว่าง = หน้าสาธารณะใช้ภาษาไทยแทน
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useI18n } from '@/app/i18n/I18nProvider';

export interface CampaignInitial {
  id?: number;
  slug: string;
  titleTh: string;
  titleEn: string;
  summaryTh: string;
  summaryEn: string;
  statementTh: string;
  statementEn: string;
  officialUrl: string;
  heroTitleTh: string;
  heroTitleEn: string;
  heroSubtitleTh: string;
  heroSubtitleEn: string;
  heroQuoteTh: string;
  heroQuoteEn: string;
  closesAt: string; // yyyy-MM-ddTHH:mm (datetime-local) หรือ ''
  officialClosesAt: string;
  isOpen: boolean;
  showSigners: boolean;
}

const input =
  'w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400';
const label = 'block text-gray-700 text-sm font-medium mb-1';

export default function CampaignForm({ initial }: { initial: CampaignInitial }) {
  const { t } = useI18n();
  const a = t.adminCampaigns;
  const f = a.fields;
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);

  const text = (k: keyof CampaignInitial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(initial.id ? `/api/admin/campaigns/${initial.id}` : '/api/admin/campaigns', {
        method: initial.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...v,
          closesAt: v.closesAt ? new Date(v.closesAt).toISOString() : null,
          officialClosesAt: v.officialClosesAt ? new Date(v.officialClosesAt).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.profile.saveFailed);
      toast.success(a.saved);
      router.push(`/dashboard/campaigns/${initial.id ?? data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.saveFailed);
      setSaving(false);
    }
  };

  // required = ช่องภาษาไทยบังคับกรอก (ปกไม่บังคับทั้งคู่)
  const pair = (th: keyof CampaignInitial, en: keyof CampaignInitial, rows?: number, required = true) => (
    <div className="grid lg:grid-cols-2 gap-4">
      {([th, en] as const).map((k) => (
        <div key={k}>
          <label className={label} htmlFor={k}>
            {f[k as keyof typeof f]}
            {required && k === th && <span className="text-red-500 ml-1">*</span>}
          </label>
          {rows ? (
            <textarea id={k} rows={rows} value={String(v[k])} onChange={text(k)} className={`${input} leading-6`} required={required && k === th} />
          ) : (
            <input id={k} value={String(v[k])} onChange={text(k)} className={input} required={required && k === th} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6 bg-white rounded-2xl border border-orange-100 p-6">
      <div>
        <label className={label} htmlFor="slug">
          {f.slug}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          /c/
          <input
            id="slug"
            value={v.slug}
            onChange={(e) => setV((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
            className={input}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </div>
      </div>
      <fieldset className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-gray-800">{f.hero}</legend>
        <p className="text-xs text-gray-500 -mt-1">{f.heroHint}</p>
        {pair('heroTitleTh', 'heroTitleEn', undefined, false)}
        {pair('heroSubtitleTh', 'heroSubtitleEn', undefined, false)}
        {pair('heroQuoteTh', 'heroQuoteEn', undefined, false)}
      </fieldset>
      {pair('titleTh', 'titleEn')}
      {pair('summaryTh', 'summaryEn', 6)}
      {pair('statementTh', 'statementEn', 18)}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="officialUrl">{f.officialUrl}</label>
          <input id="officialUrl" type="url" value={v.officialUrl} onChange={text('officialUrl')} className={input} placeholder="https://" />
        </div>
        <div>
          <label className={label} htmlFor="closesAt">{f.closesAt}</label>
          <input id="closesAt" type="datetime-local" value={v.closesAt} onChange={text('closesAt')} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="officialClosesAt">{f.officialClosesAt}</label>
          <input id="officialClosesAt" type="datetime-local" value={v.officialClosesAt} onChange={text('officialClosesAt')} className={input} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={v.isOpen} onChange={(e) => setV((p) => ({ ...p, isOpen: e.target.checked }))} className="w-4 h-4 accent-orange-600" />
          {f.isOpen}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={v.showSigners} onChange={(e) => setV((p) => ({ ...p, showSigners: e.target.checked }))} className="w-4 h-4 accent-orange-600" />
          {f.showSigners}
        </label>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-lg font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300"
      >
        {saving ? t.profile.saving : a.save}
      </button>
    </form>
  );
}
