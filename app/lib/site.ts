// app/lib/site.ts — ชื่อ/ค่าคงที่ของระบบ (Navbar, Sidebar, หน้า auth, อีเมล)
// ชื่อเลือก 5 ต.ค. 2026 (เดิม "PRL Parliament" — เลี่ยงชื่อที่คล้ายเว็บรัฐสภา) · คำโปรย (tagline) แยกตามภาษาอยู่ใน app/i18n/dictionaries
export const SITE = {
  name: 'Protect ThaiHealth',
  shortName: 'PTH', // โลโก้ตัวอักษรบน Navbar/Sidebar
  // หน้าแรกของคนที่ล็อกอินแล้ว (ใช้ใน proxy.ts + SignInForm) — เปลี่ยนเมื่อมีโมดูลหลัก
  homeAfterLogin: '/profile',
} as const;
