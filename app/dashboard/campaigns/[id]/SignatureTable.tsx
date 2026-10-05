'use client';
// ตารางรายชื่อผู้ลงชื่อ (แอดมิน): ค้นหา + ดูลายเซ็น + ลบ (กดสองจังหวะ ไม่ใช้ confirm())
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useI18n } from '@/app/i18n/I18nProvider';

export interface SignatureRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  position: string | null;
  signingAs: 'ORGANIZATION' | 'INDIVIDUAL';
  country: string;
  countryLabel: string;
  comment: string | null;
  signaturePath: string;
  showPublic: boolean;
  createdAt: string;
}

export default function SignatureTable({ rows }: { rows: SignatureRow[] }) {
  const { t } = useI18n();
  const a = t.adminCampaigns;
  const router = useRouter();
  const [q, setQ] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.firstName, r.lastName, r.email, r.organization, r.position ?? '', r.countryLabel, r.comment ?? ''].some((v) => v.toLowerCase().includes(s))
    );
  }, [q, rows]);

  const remove = async (id: number) => {
    setBusy(id);
    const res = await fetch(`/api/admin/signatures/${id}`, { method: 'DELETE' });
    setBusy(null);
    setConfirmId(null);
    if (!res.ok) return toast.error((await res.json().catch(() => ({}))).error || t.profile.saveFailed);
    toast.success(a.removed);
    router.refresh();
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(t.dateLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <section className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
      <div className="p-4 border-b border-orange-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={a.search}
            className="w-full pl-9 pr-3 py-2 border border-orange-100 rounded-lg text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-orange-50/60 text-xs text-orange-700">
            <tr>
              {[a.cols.no, a.cols.name, a.cols.org, a.cols.country, a.cols.signature, a.cols.date, ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-orange-50/30">
                <td className="px-4 py-3 text-gray-400 tabular-nums">{rows.length - rows.indexOf(r)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 whitespace-nowrap">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                  {r.comment && (
                    // แอดมินเห็นความคิดเห็นเต็ม (ยาวมากเลื่อนอ่านในกล่อง)
                    <p className="mt-1.5 max-w-md text-xs text-gray-700 leading-5 whitespace-pre-line rounded-lg bg-orange-50/60 p-3 max-h-60 overflow-y-auto">
                      <span className="font-semibold text-orange-800">{a.cols.comment}: </span>
                      {r.comment}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <span
                    className={`inline-block mb-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      r.signingAs === 'ORGANIZATION' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.signingAs === 'ORGANIZATION' ? t.campaign.asOrganization : t.campaign.asIndividual}
                  </span>
                  <p>{r.organization || '—'}</p>
                  {r.position && <p className="text-xs text-gray-500">{r.position}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.countryLabel}</td>
                <td className="px-4 py-2">
                  {r.signaturePath ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ไฟล์ผ่าน /api/files (ต้อง login) next/image ใช้ไม่ได้
                    <img src={`/api/files/${r.signaturePath}`} alt="" className="h-12 w-auto max-w-[160px] object-contain rounded border border-gray-100 bg-white" loading="lazy" />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {confirmId === r.id ? (
                    <span className="inline-flex gap-1">
                      <button type="button" onClick={() => remove(r.id)} disabled={busy === r.id} className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                        {a.confirmRemove}
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className="px-2 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100">
                        {t.common.cancel}
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label={a.remove}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
