// app/lib/configs/auth/cookie.ts — ชื่อ cookie session ของระบบนี้ (ใช้ทั้ง authOptions และ proxy.ts)
// ตั้งชื่อเฉพาะ เพราะหลายโปรเจคใน htdocs รันบน localhost:3000 เหมือนกัน — ถ้าใช้ชื่อ default (next-auth.session-token)
// cookie ของโปรเจคอื่น (คนละ NEXTAUTH_SECRET) จะถูกส่งมาด้วย → JWT_SESSION_ERROR "decryption operation failed"
// production ทั้งหมดอยู่หลัง https (Cloudflare + Plesk) — ถือเป็น secure เสมอ แม้ลืมตั้ง NEXTAUTH_URL
export const SECURE_COOKIE = (process.env.NEXTAUTH_URL ?? '').startsWith('https://') || process.env.NODE_ENV === 'production';
// production (https) ต้องขึ้นต้นด้วย __Secure- ตามข้อกำหนดของ browser
export const SESSION_COOKIE = `${SECURE_COOKIE ? '__Secure-' : ''}parliament.session-token`;
