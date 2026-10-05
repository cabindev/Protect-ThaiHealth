# Deploy Protect ThaiHealth บน Plesk

ใช้แนวเดียวกับ stopdrinknetwork (`../stopdrinknetwork/docs/deploy-plesk.md`) — เซิร์ฟเวอร์ Plesk เดียวกันได้:
Node.js ผ่าน Passenger + `server.js` · DNS ผ่าน Cloudflare (Proxied) · SSL = Let's Encrypt ใน Plesk · ฐานข้อมูล MariaDB

> **ก่อนวันประชุม:** QR บนจอฉายจะชี้โดเมนจริงเองเมื่อเปิดผ่านโดเมน (ไม่ต้องแก้โค้ด) — ทดสอบสแกนจากมือถือจริงก่อนวันงาน

## สิ่งที่ต้องเตรียม
- **โดเมน** — ตัวอย่างในคู่มือใช้ `<DOMAIN>` (เช่น `protect.sdnthailand.com` หรือโดเมนใหม่)
  ควรเป็นชื่อที่ไม่ทำให้เข้าใจผิดว่าเป็นเว็บรัฐสภาหรือเว็บของ สสส.
- repo: `https://github.com/cabindev/Protect-ThaiHealth.git` branch `main`

## ตั้งครั้งแรก

1. **โดเมน/subdomain** — Plesk → Add Domain/Subdomain `<DOMAIN>` · Cloudflare เพิ่ม DNS (A record → IP เซิร์ฟเวอร์, Proxied)
   · Plesk → SSL/TLS → Let's Encrypt
2. **Git** — Plesk → `<DOMAIN>` → Git → repo ด้านบน branch `main` → deploy ไปที่ application root (เช่น `/<DOMAIN>`)
3. **ฐานข้อมูล** — Databases → Add Database ชื่อ **`ProtectThaiHealth`** (ตัวพิมพ์ใหญ่-เล็กมีผลบน Linux) + สร้าง user
   → phpMyAdmin (คลิกไอคอนจากแถวฐานข้อมูลใน Plesk) → แท็บ SQL/Import รันไฟล์ใน `prisma/production-sql/` **ตามลำดับ**:
   1. `2026-10-05_init.sql`
   2. `2026-10-05_campaign-signatures.sql`
   3. `2026-10-05_signature-comment.sql`
   4. `2026-10-05_signature-signing-as.sql`
   5. `2026-10-05_campaign-hero.sql`
   6. `2026-10-05_campaign-official-closes.sql`
   7. `2026-10-05_seed-thaihealth-campaign.sql` ← ข้อมูลแคมเปญ (ข้อความ/ปก/วันปิด) — **ไม่มีรายชื่อ เริ่มจาก 0**
4. **Node.js** — Plesk → `<DOMAIN>` → Node.js
   - Node.js 20 ขึ้นไป · Application mode **production**
   - Application root = โฟลเดอร์ repo · **Document root = `<repo>/public`** (ห้ามชี้ root ของแอป — nginx จะเปิด `uploads/` ตรง ๆ ได้)
   - Application startup file = **`server.js`**
   - Custom environment variables (ค่าจริงอยู่ที่นี่ที่เดียว ไม่มีไฟล์ .env บนเซิร์ฟเวอร์):

     | ตัวแปร | ค่า |
     |---|---|
     | `DATABASE_URL` | `mysql://<db user>:<รหัส>@localhost:3306/ProtectThaiHealth` (รหัสมีอักขระพิเศษต้อง URL-encode) |
     | `NEXTAUTH_URL` | `https://<DOMAIN>/` |
     | `NEXTAUTH_SECRET` | สร้างใหม่: `openssl rand -base64 32` (**ห้ามใช้ค่าเดียวกับเครื่อง dev**) |
     | `EMAIL_USER` / `EMAIL_PASS` | Gmail + App Password (ส่งลิงก์รีเซ็ตรหัสผ่าน / แจ้งแอดมินเมื่อมีคนสมัคร) |
     | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ถ้าจะเปิดเข้าสู่ระบบด้วย Google (เฉพาะทีมงาน — ผู้ลงชื่อไม่ต้อง login) |
   - กด **NPM install** → **Run script: build** → **Restart App**
5. **Google OAuth** (ถ้าใช้) — Google Cloud Console → Clients → เพิ่ม redirect URI `https://<DOMAIN>/api/auth/callback/google`
6. **บัญชีแอดมินคนแรก** — สมัครที่ `https://<DOMAIN>/auth/signup` แล้วรันใน phpMyAdmin
   (บนเซิร์ฟเวอร์รัน `node scripts/make-superadmin.mjs` ไม่ได้ เพราะ env ของ Plesk ไม่ถึง SSH):
   ```sql
   UPDATE `User` SET role = 'superadmin' WHERE email = '<อีเมลที่สมัคร>';
   ```
   แล้วออกจากระบบ–เข้าใหม่ → `/dashboard`

## ตรวจหลังขึ้นระบบ (ทำครบก่อนแชร์ลิงก์)
- [ ] `https://<DOMAIN>/` พาไปหน้าปก · ภาษาเริ่มต้นอังกฤษ · ปุ่ม TH สลับได้
- [ ] นับถอยหลังแสดง "… days left · closes 13 Oct 2026, 23:59 (Thailand time)"
- [ ] ลงชื่อทดสอบจาก **มือถือจริง** (iPhone + Android) ผ่านเน็ตมือถือ — เซ็นนิ้ว, ส่งสำเร็จ, หน้าขอบคุณ
- [ ] `/qr` → จอ QR · สแกน QR จากมือถือแล้วเปิดหน้าแคมเปญบนโดเมนจริง (ไม่ใช่ localhost)
- [ ] แดชบอร์ดเห็นรายชื่อทดสอบ + ภาพลายเซ็น · ส่งออก Excel · หน้าพิมพ์/บันทึก PDF
- [ ] เปิด `https://<DOMAIN>/api/files/signatures/...` โดยไม่ login ต้องได้ 401 (ภาพลายเซ็นไม่หลุด)
- [ ] **ลบรายชื่อทดสอบ** ในแดชบอร์ดก่อนแชร์ลิงก์จริง

## Deploy ครั้งต่อไป
1. `git push` ขึ้น GitHub
2. มีไฟล์ใหม่ใน `prisma/production-sql/` → Export ฐานข้อมูลก่อน แล้วรัน SQL ใน phpMyAdmin (ก่อนขั้น 3 — โค้ดใหม่อ่านคอลัมน์ใหม่ทันที)
3. Plesk → Git → **Pull now** → Node.js → **Run script: build** → **Restart App**

## สำรองข้อมูล
ข้อมูลจริง 2 ส่วน: **ฐานข้อมูล `ProtectThaiHealth`** + **โฟลเดอร์ `uploads/`** (ภาพลายเซ็น — ไม่อยู่ใน git)
ตั้ง Plesk Backup Manager รายวันไปเก็บนอกเซิร์ฟเวอร์ (วิธีเดียวกับ stopdrinknetwork) — **ตั้งก่อนเปิดลงชื่อ**
และหลังปิดรับ (13 ต.ค.) Export ฐานข้อมูล + ดาวน์โหลด PDF/Excel รายชื่อเก็บไว้เป็นหลักฐานประกอบการยื่น
