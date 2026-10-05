// app/lib/countries.ts — รหัสประเทศ ISO 3166-1 alpha-2 (เก็บรหัสใน DB, ชื่อแปลตามภาษาด้วย Intl.DisplayNames)
export const COUNTRY_CODES = [
  'AD','AE','AF','AG','AL','AM','AO','AR','AT','AU','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BN','BO','BR','BS','BT','BW','BY','BZ',
  'CA','CD','CF','CG','CH','CI','CL','CM','CN','CO','CR','CU','CV','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','ER','ES','ET',
  'FI','FJ','FM','FR','GA','GB','GD','GE','GH','GM','GN','GQ','GR','GT','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IN','IQ','IR','IS','IT',
  'JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MG',
  'MH','MK','ML','MM','MN','MO','MR','MT','MU','MV','MW','MX','MY','MZ','NA','NE','NG','NI','NL','NO','NP','NR','NZ','OM','PA','PE','PG','PH','PK',
  'PL','PS','PT','PW','PY','QA','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SI','SK','SL','SM','SN','SO','SR','SS','ST','SV','SY','SZ',
  'TD','TG','TH','TJ','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VN','VU','WS','XK','YE','ZA','ZM','ZW',
] as const;

const CODE_SET = new Set<string>(COUNTRY_CODES);
export const isCountryCode = (v: string) => CODE_SET.has(v);

// ชื่อประเทศตามภาษา (ทำงานได้ทั้ง server และ browser)
export function countryName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

// รายการสำหรับ <select> — ไทยขึ้นก่อน (ผู้ลงชื่อส่วนใหญ่) ที่เหลือเรียงตามชื่อในภาษานั้น
export function countryOptions(locale: string) {
  const collator = new Intl.Collator(locale);
  const rest = COUNTRY_CODES.filter((c) => c !== 'TH')
    .map((code) => ({ code, name: countryName(code, locale) }))
    .sort((a, b) => collator.compare(a.name, b.name));
  return [{ code: 'TH', name: countryName('TH', locale) }, ...rest];
}
