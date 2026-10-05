// app/lib/adminAuth.ts — ตรวจสิทธิ์ admin/superadmin สำหรับ API ฝั่งจัดการระบบ
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/configs/auth/authOptions';
import prisma from '@/app/lib/db';
import { isAdminRole } from '@/app/lib/roles';

// คืนข้อมูล user ปัจจุบันถ้ามีสิทธิ์ระดับแอดมิน (อ่าน role จาก DB ไม่เชื่อ cookie) — ไม่งั้นคืน null
export async function getAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || !isAdminRole(user.role)) return null;
  return user;
}
