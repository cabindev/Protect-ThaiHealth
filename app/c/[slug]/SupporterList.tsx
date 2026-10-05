// รายชื่อผู้สนับสนุนบนหน้าสาธารณะ (เฉพาะคนที่เลือกแสดง)
// - หน้าแคมเปญ (5 คนล่าสุด): แบบย่อ — ชื่อ + ตำแหน่ง + ประเทศ + ความคิดเห็น
// - หน้า /supporters (detailed): ครบทุกอย่าง ยกเว้นข้อมูลส่วนตัว (นามสกุล / อีเมล / ลายเซ็น)
import { countryName } from '@/app/lib/countries';

// ห้ามดึงนามสกุล/อีเมล/ลายเซ็น มาหน้าสาธารณะ — ใช้ select 2 ชุดนี้เท่านั้น
export const PUBLIC_SUPPORTER_SELECT = { id: true, firstName: true, position: true, country: true, comment: true } as const;
export const PUBLIC_SUPPORTER_SELECT_DETAILED = {
  ...PUBLIC_SUPPORTER_SELECT,
  organization: true,
  signingAs: true,
  createdAt: true,
} as const;
export const publicSupporterWhere = (campaignId: number) => ({ campaignId, showPublic: true });

const COMMENT_PREVIEW = 280; // ตัวอักษรที่แสดงก่อนกด "อ่านต่อ"

export interface PublicSupporter {
  id: number;
  firstName: string;
  position: string | null;
  country: string;
  comment: string | null;
  // เฉพาะแบบ detailed
  organization?: string;
  signingAs?: 'ORGANIZATION' | 'INDIVIDUAL';
  createdAt?: Date;
}

export interface DetailedLabels {
  asOrganization: string;
  asIndividual: string;
}

export default function SupporterList({
  rows,
  dateLocale,
  readMore,
  detailed,
}: {
  rows: PublicSupporter[];
  dateLocale: string;
  readMore: string;
  detailed?: DetailedLabels; // ส่งมา = แสดงแบบครบ (หน้า /supporters)
}) {
  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((s) => (
        <li key={s.id} className="py-3 text-sm">
          {detailed ? (
            <>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-gray-900">{s.firstName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    s.signingAs === 'ORGANIZATION' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {s.signingAs === 'ORGANIZATION' ? detailed.asOrganization : detailed.asIndividual}
                </span>
              </p>
              {(s.position || s.organization) && (
                <p className="mt-0.5 text-gray-700">{[s.position, s.organization].filter(Boolean).join(', ')}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {countryName(s.country, dateLocale)}
                {s.createdAt && <> · {s.createdAt.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}</>}
              </p>
            </>
          ) : (
            <p className="flex flex-wrap gap-x-2">
              <span className="font-medium text-gray-800">{s.firstName}</span>
              {s.position && <span className="text-gray-500">· {s.position}</span>}
              <span className="text-gray-400">· {countryName(s.country, dateLocale)}</span>
            </p>
          )}
          {s.comment &&
            (s.comment.length <= COMMENT_PREVIEW ? (
              <p className="mt-1.5 text-gray-600 leading-6 whitespace-pre-line">{s.comment}</p>
            ) : (
              // ความคิดเห็นยาว (สูงสุด 2,500 คำ) — ย่อไว้ กดอ่านต่อ
              <details className="mt-1.5 group">
                <summary className="cursor-pointer list-none text-gray-600 leading-6">
                  <span className="group-open:hidden">
                    {s.comment.slice(0, COMMENT_PREVIEW)}… <span className="text-orange-700 font-medium">{readMore}</span>
                  </span>
                </summary>
                <p className="text-gray-600 leading-6 whitespace-pre-line">{s.comment}</p>
              </details>
            ))}
        </li>
      ))}
    </ul>
  );
}
