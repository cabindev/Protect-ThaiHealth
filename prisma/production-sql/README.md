# SQL สำหรับฐานข้อมูล production

แนวเดียวกับ stopdrinknetwork: เซิร์ฟเวอร์ deploy ด้วย `git pull` และแก้ฐานข้อมูลด้วย SQL โดยตรง (phpMyAdmin) — **ไม่รัน prisma migrate บนเซิร์ฟเวอร์**
แก้ `schema.prisma` ทุกครั้ง = สร้าง migration ฝั่ง local + ไฟล์ `<YYYY-MM-DD>_<ชื่อ>.sql` ในโฟลเดอร์นี้ (MySQL 5.7+/MariaDB)

| ไฟล์ | เนื้อหา | รันบน production แล้ว |
|---|---|---|
| `2026-10-05_init.sql` | ตารางเริ่มต้น: User (role pending/member/admin/superadmin) + AuditLog | ยัง |
| `2026-10-05_campaign-signatures.sql` | ตาราง Campaign + Signature (แคมเปญลงชื่อ) — รันหลัง init | ยัง |
| `2026-10-05_signature-comment.sql` | คอลัมน์ Signature.comment (ความคิดเห็นเพิ่มเติม) — รันหลัง campaign-signatures | ยัง |
| `2026-10-05_signature-signing-as.sql` | Signature.signingAs (ในนามองค์กร/ส่วนตัว) + position | ยัง |
| `2026-10-05_campaign-hero.sql` | ปกแคมเปญ: heroTitle/Subtitle/Quote (Th/En) | ยัง |
| `2026-10-05_campaign-official-closes.sql` | Campaign.officialClosesAt (วันปิดของระบบรัฐสภา แสดงในกล่องลิงก์) | ยัง |
