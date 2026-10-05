// scripts/make-superadmin.mjs — ตั้งบัญชีแรกเป็น superadmin (ทุกคนสมัครแล้วได้ pending จึงต้องมีคนแรกที่อนุมัติได้)
// ใช้: สมัครผ่านหน้าเว็บก่อน แล้วรัน  node scripts/make-superadmin.mjs you@example.com
import { PrismaClient } from '@prisma/client';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('ใช้: node scripts/make-superadmin.mjs <email>');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({ where: { email }, data: { role: 'superadmin' } });
  console.log(`✓ ${user.firstName} ${user.lastName} (${user.email}) เป็น superadmin แล้ว (ถ้าล็อกอินค้างไว้ตอนยัง pending จะอัปเดตเอง ไม่งั้นออกแล้วเข้าใหม่)`);
} catch {
  console.error(`ไม่พบบัญชี ${email} — สมัครผ่านหน้าเว็บก่อน`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
