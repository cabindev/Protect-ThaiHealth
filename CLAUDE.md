# Protect ThaiHealth (โฟลเดอร์ `parliament`)

## Project Overview
โครงสร้างเปล่ารอรับโปรเจคใหม่ — ยก **auth + dashboard** มาจาก `../stopdrinknetwork` (ซึ่งยกมาจาก `buddhistlent` อีกที)
ยังไม่มีโมดูลธุรกิจ: มีแค่ สมัคร/เข้าสู่ระบบ (อีเมล + Google), ลืม/รีเซ็ตรหัสผ่าน, อนุมัติบัญชีใหม่, โปรไฟล์, แดชบอร์ดแอดมิน

**Local DB**: `ProtectThaiHealth` (MySQL, MAMP — เดิมชื่อ `Parliament`) · ภาพรวม/สถานะโปรเจค: `docs/PROJECT.md`

## Design Theme (เหมือน stopdrinknetwork)
- ส้ม–ขาว–ดำ สีพื้นล้วน **ห้าม gradient** · ปุ่มหลัก `bg-orange-600 text-white hover:bg-orange-700` · พื้น `bg-white`
- Card `rounded-2xl border border-orange-100`, tint `bg-orange-50`
- Font: **IBM Plex Sans Thai** (ไทย+อังกฤษ) + **IBM Plex Mono** (บรรทัดเล็ก/ตัวเลข) ฝังจาก `@fontsource/*` ใน `app/layout.tsx`
  (ไม่ใช้ next/font/google — เซิร์ฟเวอร์ Plesk อาจออกเน็ตไม่ได้ตอน build) · Icons: lucide-react
- ปกแคมเปญ: พื้นส้มล้วน + แผนที่ halftone (`scripts/build-halftone-map.mjs` → `public/maps/thailand-halftone.svg` นิ่ง · `thailand-halftone-pulse.svg` มีคลื่นกรุงเทพฯ ใช้เฉพาะจอ QR)
  ตัวอักษรเข้มบนส้ม (ขาวบนส้มคอนทราสต์ไม่ผ่าน) · แอนิเมชัน `.hero-in` `.hero-drift` `.count-bump` `.plus-float` ใน globals.css ปิดเองเมื่อ prefers-reduced-motion
  · ภาพแชร์ลิงก์ `app/c/[slug]/opengraph-image.tsx` (ฟอนต์ .woff จาก fontsource — ตัวสร้างภาพไม่รองรับ woff2)
- **Navbar ลอย ไม่มีแถบพื้นหลัง** → หน้าเนื้อหาต้องเว้น `pt-20` เอง · Navbar ซ่อนตัวบน `/dashboard`

## Technology Stack
Next.js 16 (App Router, `proxy.ts` แทน middleware) / React 19 / TypeScript · MySQL + Prisma 6 (singleton `app/lib/db.ts`)
· NextAuth 4 (JWT, ไม่ใช้ adapter) · Tailwind 3 · nodemailer · react-hot-toast · browser-image-compression + heic2any

## Commands
```bash
npm run dev / npm run build / npm run lint      # lint ต้อง 0 error
npx prisma migrate deploy && npx prisma generate
node scripts/make-superadmin.mjs <email>        # ตั้ง superadmin คนแรก
```

## จุดที่ต้องแก้เมื่อเริ่มโปรเจคใหม่
| ไฟล์ | แก้อะไร |
|---|---|
| `app/lib/site.ts` | ชื่อระบบ, ตัวย่อโลโก้, `homeAfterLogin` (หน้าแรกหลัง login) |
| `app/i18n/dictionaries/th.ts` + `en.ts` | คำโปรย (`site.tagline`) และข้อความทุกหน้า |
| `components/Navbar.tsx` → `NAV_LINKS` | เมนูหน้าเว็บของโมดูลใหม่ |
| `app/dashboard/components/Sidebar.tsx` → `MAIN_MENU` / `SETTINGS_MENU` | เมนูแดชบอร์ด |
| `app/dashboard/components/QuickActions.tsx` → `groups` | ทางลัดหน้าแดชบอร์ด |
| `app/dashboard/page.tsx` | กล่อง "พื้นที่สำหรับโมดูล" → สถิติจริง |
| `proxy.ts` → `STAFF_ONLY` + `matcher` | prefix ที่ต้องเป็นบัญชีอนุมัติแล้ว |
| `prisma/schema.prisma` | เพิ่ม model + relation ใน User · เพิ่ม relation ใน `_count` ของ `app/api/admin/users/[id]/route.ts` |

## Auth / Roles
- `pending` (สมัครใหม่ทั้งฟอร์มและ Google) → แอดมินอนุมัติเป็น `member` ที่ `/dashboard/setting/admin` · `admin` / `superadmin`
- `/dashboard/*` เฉพาะ admin/superadmin (กันที่ `proxy.ts` + layout) · API แอดมินใช้ `getAdminUser()` (อ่าน role จาก DB)
- ตัวช่วยสิทธิ์: `app/lib/roles.ts` (`isAdminRole`, `isStaffRole`) · ชื่อ role บนจอ = `t.roles[role]`
- jwt callback อ่าน role ใหม่จาก DB เฉพาะตอนยัง pending → อนุมัติแล้วใช้ได้ทันทีหลังกด `/auth/pending`
- โปรไฟล์แก้แล้วเรียก `session.update()` ให้ Navbar เปลี่ยนทันที
- Audit log ใช้ร่วมทุกโมดูล: `writeAuditLog({ entityType, ... })` ใน `app/lib/audit.ts`

## โมดูลแคมเปญลงชื่อ (petition) — เพิ่ม 5 ต.ค. 2026
ใช้รวบรวมรายชื่อเครือข่ายในไทย/ต่างประเทศ คัดค้านร่างแก้ไข พ.ร.บ. สสส. (แคมเปญแรก `/c/thaihealth`, สร้างด้วย `scripts/seed-thaihealth-campaign.mjs`)
- หน้าสาธารณะ (ไม่ต้อง login): `/` (แคมเปญเดียว → redirect ไปหน้าแคมเปญ) · `/c/[slug]` ปก + บริบท + แถลงการณ์ + ฟอร์มลงชื่อ + 5 คนล่าสุด
  · `/c/[slug]/supporters` ผู้สนับสนุนทั้งหมดแบ่งหน้าละ 50 · `/c/[slug]/present` จอ QR + ตัวนับสด (ห้องประชุม)
  · select ข้อมูลผู้ลงชื่อบนหน้าสาธารณะต้องใช้ `PUBLIC_SUPPORTER_SELECT` (ย่อ) / `PUBLIC_SUPPORTER_SELECT_DETAILED` (หน้า /supporters) + `publicSupporterWhere`
    จาก `app/c/[slug]/SupporterList.tsx` เท่านั้น — **ห้ามมีนามสกุล/อีเมล/signaturePath** · จอ present ล็อกภาษาอังกฤษ (`?lang=th` = ไทย)
- ฟิลด์: ชื่อ / นามสกุล / อีเมล / ชื่อองค์กร / ประเทศ (ISO 2 ตัว, `app/lib/countries.ts`) / ลายเซ็นนิ้ว **ไม่บังคับ** (`app/components/SignaturePad.tsx` → PNG · ไม่เซ็น = `signaturePath` เป็นสตริงว่าง)
  + ความคิดเห็น (ไม่บังคับ ≤ 2,500 คำ นับด้วย `app/lib/wordCount.ts` — Intl.Segmenter ตัดคำไทยได้ ใช้ตัวเดียวกันทั้งฟอร์มและ API · เห็นเฉพาะแอดมิน/CSV/หน้าพิมพ์ `?comments=1`)
  + แสดงบนหน้าสาธารณะ (ติ๊กไว้ให้ — ชื่อ ไม่มีนามสกุล + ตำแหน่ง + ประเทศ + ความคิดเห็น) · ยินยอม = กดปุ่ม "ลงชื่อ" ใต้ข้อความยินยอม
    (**ห้ามทำช่องยินยอมแบบติ๊กไว้ล่วงหน้า** — ไม่ถือเป็นความยินยอมตาม PDPA) · ลงนามในนาม ค่าเริ่มต้น = ส่วนตัว · อีเมลซ้ำในแคมเปญเดียวกัน = ปฏิเสธ (unique index)
- API ลงชื่อ `app/api/campaigns/[slug]/sign`: ตรวจ PNG จาก magic bytes, honeypot `website`, จำกัด 20 ครั้ง/10 นาที ต่อ IP (เก็บแค่ sha256 ของ IP)
- แอดมิน `/dashboard/campaigns`: สร้าง/แก้ไข (ข้อความ 2 ภาษา), เปิด-ปิดรับ, ตารางรายชื่อ + ลบ, CSV (BOM + กัน CSV injection),
  หน้าพิมพ์ `/dashboard/campaigns/[id]/print` (Cmd+P → PDF, ไม่พิมพ์อีเมล)
- **ความเป็นส่วนตัว**: ภาพลายเซ็นอยู่ `uploads/signatures/<campaignId>/` เปิดผ่าน `/api/files` ได้เฉพาะแอดมิน · หน้าสาธารณะ select ได้แค่ firstName/position/country/comment (ห้ามนามสกุล/อีเมล/องค์กร/signaturePath)
- **ห้ามกรอกเลขบัตรประชาชนแทนใคร** — ระบบรับฟังความเห็นมาตรา 77 ของรัฐสภา แต่ละคนต้องกรอกเลขบัตรของตัวเอง หน้าแคมเปญจึงมีแค่ลิงก์ไปให้ (`officialUrl`)
- นับถอยหลัง `app/components/Countdown.tsx` (closesAt) — วันเวลาจัดรูปแบบฝั่ง server (`formatDeadline`, timeZone Asia/Bangkok) แล้วส่งเป็น string + `serverNow` กัน hydration ไม่ตรง
- กับดัก: ชื่อประเทศจาก `Intl.DisplayNames` ของ Node กับ browser ต่างกัน → สร้างรายการฝั่ง server แล้วส่งเป็น prop (ไม่งั้น hydration mismatch)
  · ใน submit handler ที่มี `await` ต้องเก็บ `e.currentTarget` ไว้ก่อน (หลัง await เป็น null)
  · หลัง `prisma generate` ต้อง restart dev server (client ถูก cache ใน globalThis)

## ภาษา (i18n) — ไทย / English
- **ห้ามเขียนข้อความบนจอตรง ๆ ในโค้ด** — เพิ่ม key ใน `app/i18n/dictionaries/th.ts` ก่อน แล้ว `en.ts` (พิมพ์ type `Dictionary` → ขาด key = build ไม่ผ่าน)
  ข้อความที่มีตัวแปรเขียนเป็นฟังก์ชัน เช่น `greeting: (name) => ...`
- Server Component / Route Handler: `const t = await getDict()` (`app/i18n/server.ts`)
  · Client Component: `const { t, locale } = useI18n()` (`app/i18n/I18nProvider.tsx`)
- ภาษาเก็บใน cookie `parliament.locale` (ไม่มี prefix ใน URL) — ไม่มี cookie = **อังกฤษ** (`DEFAULT_LOCALE`, ไม่ดูภาษา browser) · อีเมลแจ้งแอดมิน = ไทยเสมอ
  · ปุ่มสลับ `app/i18n/LanguageSwitcher.tsx` (อยู่ใน Navbar + TopNav ของแดชบอร์ด) เขียน cookie แล้ว `router.refresh()`
- dictionary มีฟังก์ชัน → **ห้ามส่ง `t` เป็น prop จาก Server ไป Client Component** (serialize ไม่ได้) ให้ client เรียก `useI18n()` เอง
- วันที่: `toLocaleDateString(t.dateLocale, ...)` · ปี: `t.year(y)` (ไทย = พ.ศ., อังกฤษ = ค.ศ.)
- API ส่งข้อความ error ตามภาษาผู้ใช้ (`t.api.*`) · อีเมลรีเซ็ตรหัสผ่าน = ภาษาตอนกดขอ · อีเมลแจ้งแอดมิน = ภาษาเริ่มต้น (ไทย)

## กับดัก (บทเรียนจาก stopdrinknetwork)
1. **ห้ามเขียนไฟล์ผู้ใช้ลง `public/`** — เก็บใน `uploads/` แล้วเสิร์ฟผ่าน `/api/files/...` (ต้อง login, pending เปิดได้แค่ `avatars/`)
2. **response error ของ route เสิร์ฟไฟล์ต้องใส่ `NO_STORE`** (`app/lib/uploads.ts`) — Cloudflare cache 404 ไว้ 4 ชม.
3. **อ่าน `e.target.files` ก่อนเคลียร์ `value`** ของ `<input type="file">` เสมอ
4. **ข้อความผู้ใช้ใน HTML string (อีเมล ฯลฯ) ต้อง escape** — ใช้ `esc()` ใน `app/lib/mailer.ts`
5. **แก้ schema = migration local + ไฟล์ SQL ใน `prisma/production-sql/`** (production แก้ DB ด้วย SQL โดยตรง)
   `migrate dev` รันใน agent ไม่ได้ → `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`
   → เซฟเป็น `prisma/migrations/<YYYYMMDDHHMMSS>_<ชื่อ>/migration.sql` → `migrate deploy` → `generate`
6. ห้ามใช้ `confirm()/alert()` ของ browser — ใช้ปุ่มกดสองจังหวะ / toast แทน
7. **cookie session ใช้ชื่อเฉพาะ `parliament.session-token`** (`app/lib/configs/auth/cookie.ts`) — หลายโปรเจคใน htdocs รัน
   localhost:3000 เหมือนกัน ชื่อ default ชนกันแล้วขึ้น JWT_SESSION_ERROR "decryption operation failed"
   · `proxy.ts` ต้องส่ง `cookieName` ให้ `getToken` ตรงกันเสมอ

## Structure
```
app/
├── page.tsx                     # Landing (โครงเปล่า)
├── layout.tsx                   # SessionProvider + Navbar + Toaster
├── auth/                        # signin/ signup/ forgot-password/ reset-password/ pending/
├── profile/                     # page.tsx (โปรไฟล์) · edit/ · components/ProfileForm.tsx
├── dashboard/
│   ├── layout.tsx               # DashboardProvider + TopNavProvider + DashboardClient (Sidebar + TopNav)
│   ├── page.tsx                 # ทักทาย + บัญชีรออนุมัติ + สถิติผู้ใช้ + พื้นที่โมดูล + QuickActions
│   ├── components/              # DashboardClient, Sidebar, TopNav, QuickActions
│   ├── context/                 # DashboardContext (ย่อ/ขยาย sidebar), TopNavContext (select all)
│   └── setting/admin/page.tsx   # จัดการผู้ใช้: อนุมัติ/ปฏิเสธ pending, สลับสิทธิ์ admin
├── api/
│   ├── auth/                    # [...nextauth], signup, forgot-password, reset-password
│   ├── admin/users/             # GET รายชื่อ+สถิติ · toggle-role · [id] DELETE (ปฏิเสธ pending)
│   ├── profile/route.ts         # PATCH โปรไฟล์ตัวเอง (รูป → uploads/avatars/)
│   └── files/[...path]/route.ts # เสิร์ฟไฟล์จาก uploads/
├── components/                  # SessionProvider, auth/ (AuthLayout, ฟอร์มต่าง ๆ, ปุ่ม Google)
├── i18n/                        # config, server (getDict), I18nProvider (useI18n), LanguageSwitcher, dictionaries/{th,en}
└── lib/                         # site, roles, db, adminAuth, audit, mailer, uploads, configs/auth/{authOptions,cookie}
components/Navbar.tsx
lib/utils.ts                     # cn()
proxy.ts · server.js (Plesk/Passenger) · scripts/make-superadmin.mjs
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
