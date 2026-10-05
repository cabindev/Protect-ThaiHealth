# Protect ThaiHealth

(โฟลเดอร์ยังชื่อ `parliament` · ฐานข้อมูล `ProtectThaiHealth`) — ภาพรวมโปรเจค: `docs/PROJECT.md`

โครงสร้างเริ่มต้น (auth + dashboard เปล่า) ยกมาจาก `stopdrinknetwork` — รอรับโมดูลของโปรเจคใหม่

## เริ่มต้น (local)
```bash
# 1. เปิด MAMP (MySQL) แล้วสร้างฐานข้อมูล ProtectThaiHealth (utf8mb4)
npx prisma migrate deploy     # สร้างตาราง User + AuditLog
npm run dev                   # http://localhost:3000
# 2. สมัครบัญชีแรกที่ /auth/signup แล้วตั้งเป็น superadmin
node scripts/make-superadmin.mjs you@example.com
```
