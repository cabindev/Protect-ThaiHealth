// app/profile/page.tsx — โปรไฟล์ของฉัน (ต้อง login)
// เพิ่มสรุปข้อมูล/ผลงานของโมดูลใหม่ใต้การ์ดโปรไฟล์
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, CalendarDays, Phone, SquarePen, Clock } from 'lucide-react';
import authOptions from '@/app/lib/configs/auth/authOptions';
import prisma from '@/app/lib/db';
import { getDict } from '@/app/i18n/server';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      phone: true,
      organization: true,
      position: true,
    },
  });
  if (!user) redirect('/auth/signin');
  const t = await getDict();
  const joined = new Intl.DateTimeFormat(t.dateLocale, { dateStyle: 'medium' }).format(user.createdAt);

  return (
    <main className="min-h-screen bg-white pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {user.role === 'pending' && (
          <Link
            href="/auth/pending"
            className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl border border-orange-200 bg-orange-50 text-sm text-gray-800 hover:bg-orange-100 transition-colors"
          >
            <Clock className="w-5 h-5 text-orange-600 shrink-0" />
            <span className="flex-1">{t.profile.pendingBanner}</span>
          </Link>
        )}

        <section className="bg-white rounded-2xl border border-orange-100 p-6">
          <div className="flex flex-wrap items-center gap-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-orange-100"
              />
            ) : (
              <span className="flex w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100 items-center justify-center">
                <User className="w-9 h-9 text-orange-600" />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-800">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              {(user.position || user.organization) && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {[user.position, user.organization].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                  {t.roles[user.role] ?? user.role}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    {user.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t.profile.joined(joined)}
                </span>
              </div>
            </div>

            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              <SquarePen className="w-4 h-4" /> {t.profile.edit}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
