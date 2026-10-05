// app/dashboard/campaigns/[id]/print/page.tsx — รายชื่อผู้ลงนามครบทุกฟิลด์ (แอดมินเท่านั้น)
// พิมพ์ หรือ บันทึกเป็น PDF (ปุ่มพิมพ์ → ปลายทาง "บันทึกเป็น PDF") + ดาวน์โหลด Excel (CSV) จากหน้านี้ได้เลย
// กระดาษ A4 แนวนอน เพื่อให้คอลัมน์ครบ — ความคิดเห็นอยู่แถวถัดไปใต้แต่ละคน
import { notFound } from 'next/navigation';
import prisma from '@/app/lib/db';
import { localizeCampaign } from '@/app/lib/campaign';
import { countryName } from '@/app/lib/countries';
import { getDict, getLocale } from '@/app/i18n/server';
import PrintButton from './PrintButton';

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [campaign, t, locale] = await Promise.all([
    Number.isInteger(id) ? prisma.campaign.findUnique({ where: { id } }) : null,
    getDict(),
    getLocale(),
  ]);
  if (!campaign) notFound();
  const a = t.adminCampaigns;
  const rows = await prisma.signature.findMany({ where: { campaignId: id }, orderBy: { createdAt: 'asc' } });
  const l = localizeCampaign(campaign, locale);
  const orgCount = new Set(rows.filter((r) => r.signingAs === 'ORGANIZATION').map((r) => r.organization.trim().toLowerCase())).size;
  const fmt = (d: Date) =>
    d.toLocaleString(t.dateLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 print:p-0 print:max-w-none bg-white">
      {/* A4 แนวนอน + ขอบกระดาษพอดี — เฉพาะหน้านี้ */}
      <style>{`@media print { @page { size: A4 landscape; margin: 12mm; } }`}</style>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{a.printTitle}</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{l.title}</h1>
          <p className="text-xs text-gray-600 mt-1">
            {t.campaign.signers(rows.length)} · {t.campaign.orgs(orgCount)} · {a.printedAt(new Date().toLocaleString(t.dateLocale))}
          </p>
        </div>
        <div className="print:hidden text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <a
              href={`/api/admin/campaigns/${id}/export`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-orange-200 text-orange-700 text-sm font-medium hover:bg-orange-50"
            >
              {a.exportCsv}
            </a>
            <PrintButton />
          </div>
          <p className="mt-2 text-xs text-gray-400">{a.printHint}</p>
        </div>
      </div>

      <table className="w-full mt-6 text-[12px] border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left align-bottom">
            <th className="py-2 pr-2 w-8">{a.cols.no}</th>
            <th className="py-2 pr-2">{a.cols.name}</th>
            <th className="py-2 pr-2">{a.cols.signingAs}</th>
            <th className="py-2 pr-2">{a.cols.org} / {a.cols.position}</th>
            <th className="py-2 pr-2">{a.cols.email}</th>
            <th className="py-2 pr-2">{a.cols.country}</th>
            <th className="py-2 pr-2">{a.cols.date}</th>
            <th className="py-2 w-44">{a.cols.signature}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => [
            <tr key={r.id} className={`${r.comment ? '' : 'border-b border-gray-300'} break-inside-avoid align-middle`}>
              <td className="py-1.5 pr-2 tabular-nums">{i + 1}</td>
              <td className="py-1.5 pr-2 font-medium">
                {r.firstName} {r.lastName}
              </td>
              <td className="py-1.5 pr-2 whitespace-nowrap">
                {r.signingAs === 'ORGANIZATION' ? t.campaign.asOrganization : t.campaign.asIndividual}
              </td>
              <td className="py-1.5 pr-2">
                {r.organization || '—'}
                {r.position && <span className="block text-[11px] text-gray-600">{r.position}</span>}
              </td>
              <td className="py-1.5 pr-2 break-all">{r.email}</td>
              <td className="py-1.5 pr-2">{countryName(r.country, t.dateLocale)}</td>
              <td className="py-1.5 pr-2 whitespace-nowrap">{fmt(r.createdAt)}</td>
              <td className="py-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- ไฟล์ผ่าน /api/files (ต้อง login) */}
                <img src={`/api/files/${r.signaturePath}`} alt="" className="h-12 w-auto max-w-[170px] object-contain" />
              </td>
            </tr>,
            r.comment ? (
              <tr key={`${r.id}-c`} className="border-b border-gray-300">
                <td />
                <td colSpan={7} className="pb-3 pr-2 text-[11.5px] leading-5 text-gray-700 whitespace-pre-line">
                  <span className="font-semibold">{a.cols.comment}: </span>
                  {r.comment}
                </td>
              </tr>
            ) : null,
          ])}
        </tbody>
      </table>
    </div>
  );
}
