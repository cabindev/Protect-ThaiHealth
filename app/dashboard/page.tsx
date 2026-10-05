// app/dashboard/page.tsx — หน้าแรกของแดชบอร์ด (admin/superadmin เท่านั้น — กันไว้ที่ proxy.ts)
// โครงเปล่า: ทักทาย + แจ้งบัญชีรออนุมัติ + สถิติผู้ใช้ + ทางลัด — เพิ่มสถิติของโมดูลใหม่ในส่วน "พื้นที่โมดูล"
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, Users, ShieldCheck, UserPlus, LayoutGrid } from 'lucide-react';
import authOptions from '../lib/configs/auth/authOptions';
import prisma from '../lib/db';
import { isAdminRole } from '../lib/roles';
import { SITE } from '../lib/site';
import { getDict } from '../i18n/server';
import QuickActions from './components/QuickActions';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  const user = session.user;
  const isAdmin = isAdminRole(user.role);
  const t = await getDict();
  const yearLabel = t.year(new Date().getFullYear());

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [totalUsers, admins, pendingCount, newUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: ['admin', 'superadmin'] } } }),
    prisma.user.count({ where: { role: 'pending' } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const stats = [
    { icon: Users, label: t.dashboard.stats.users, value: totalUsers },
    { icon: ShieldCheck, label: t.dashboard.stats.admins, value: admins },
    { icon: Clock, label: t.dashboard.stats.pending, value: pendingCount },
    { icon: UserPlus, label: t.dashboard.stats.newUsers, value: newUsers },
  ];

  const today = new Date().toLocaleDateString(t.dateLocale, {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-8 space-y-8">

        {/* Greeting */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-orange-600 uppercase mb-2">
              {SITE.name} · {yearLabel}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              {t.dashboard.greeting(user.firstName)}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{t.dashboard.adminDashboard}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {t.roles[user.role] ?? user.role}
            </span>
            <p className="text-xs text-gray-400 mt-2">{today}</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <Link
            href="/dashboard/setting/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-orange-200 bg-orange-50 text-sm text-gray-800 hover:bg-orange-100 transition-colors"
          >
            <Clock className="w-5 h-5 text-orange-600 shrink-0" />
            <span className="flex-1">
              {t.dashboard.pendingBanner(pendingCount)}
            </span>
            <span className="text-orange-700 font-medium">{t.dashboard.review}</span>
          </Link>
        )}

        {/* สถิติผู้ใช้ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-orange-100 p-4">
              <Icon className="w-5 h-5 text-orange-500" />
              <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        {/* พื้นที่โมดูล — แทนที่ด้วยสถิติ/สรุปของโปรเจคใหม่ */}
        <section className="rounded-2xl border border-dashed border-orange-200 p-10 text-center">
          <LayoutGrid className="w-10 h-10 text-orange-200 mx-auto" />
          <p className="mt-3 text-sm font-medium text-gray-600">{t.dashboard.modulePlaceholder}</p>
          <p className="mt-1 text-xs text-gray-400">app/dashboard/page.tsx</p>
        </section>

        <QuickActions isAdmin={isAdmin} />

        <p className="text-center text-[11px] text-gray-300 pt-4">
          © {yearLabel} {SITE.name}
        </p>
      </div>
    </div>
  );
}
