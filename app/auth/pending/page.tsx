// app/auth/pending/page.tsx — แจ้งบัญชีรอผู้ดูแลระบบอนุมัติ (role pending)
// สมัครใหม่ (ฟอร์ม/Google) ได้ pending เสมอ → เห็นแค่หน้าสาธารณะจนกว่าแอดมินอนุมัติ
// อ่าน role จาก DB (cookie อาจยังเป็น pending หลังอนุมัติ) — อนุมัติแล้วกดปุ่มเพื่อรีเฟรช session
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle2 } from 'lucide-react';
import authOptions from '@/app/lib/configs/auth/authOptions';
import prisma from '@/app/lib/db';
import { isStaffRole } from '@/app/lib/roles';
import { SITE } from '@/app/lib/site';
import { getDict } from '@/app/i18n/server';
import RefreshSessionButton from './RefreshSessionButton';

export async function generateMetadata() {
  const t = await getDict();
  return { title: `${t.auth.pending.metaTitle} — ${SITE.name}` };
}

export default async function PendingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) }, select: { role: true, email: true } });
  const approved = isStaffRole(user?.role);
  const t = await getDict();

  return (
    <main className="min-h-screen bg-white pt-24 pb-10 px-4">
      <div className="max-w-md mx-auto text-center">
        {approved ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-orange-600 mx-auto" />
            <h1 className="mt-4 text-xl font-bold text-gray-800">{t.auth.pending.approvedTitle}</h1>
            <p className="mt-2 text-sm text-gray-500">{t.auth.pending.approvedBody}</p>
            <RefreshSessionButton />
          </>
        ) : (
          <>
            <Clock className="w-12 h-12 text-orange-600 mx-auto" />
            <h1 className="mt-4 text-xl font-bold text-gray-800">{t.auth.pending.title}</h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {t.auth.pending.bodyBefore} <span className="font-medium text-gray-700">{user?.email}</span>{' '}
              {t.auth.pending.bodyAfter}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/profile/edit" className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">
                {t.auth.pending.fillProfile}
              </Link>
              <Link href="/" className="px-4 py-2.5 rounded-xl border border-orange-200 text-orange-700 text-sm font-medium hover:bg-orange-50">
                {t.common.home}
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">{t.auth.pending.hint}</p>
          </>
        )}
      </div>
    </main>
  );
}
