import Link from 'next/link';
import { UserCheck, User, Home, PenLine } from 'lucide-react';
import { getDict } from '@/app/i18n/server';
import type { Dictionary } from '@/app/i18n/dictionaries';

interface QuickActionsProps {
  isAdmin: boolean;
}

interface Action {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requireAdmin?: boolean;
}

interface Group {
  label: string;
  sub: string;
  actions: Action[];
}

// เพิ่มทางลัดของโมดูลใหม่เป็นกลุ่มใหม่ใน groups (ข้อความอยู่ใน dictionary: t.dashboard.quick)
const buildGroups = (q: Dictionary['dashboard']['quick']): Group[] => [
  {
    label: q.system,
    sub: q.systemSub,
    actions: [
      { title: q.campaigns, description: q.campaignsDesc, href: '/dashboard/campaigns', icon: PenLine, requireAdmin: true },
      { title: q.users, description: q.usersDesc, href: '/dashboard/setting/admin', icon: UserCheck, requireAdmin: true },
      { title: q.profile, description: q.profileDesc, href: '/profile', icon: User },
    ],
  },
  {
    label: q.website,
    sub: q.websiteSub,
    actions: [
      { title: q.home, description: q.homeDesc, href: '/', icon: Home },
    ],
  },
];

export default async function QuickActions({ isAdmin }: QuickActionsProps) {
  const groups = buildGroups((await getDict()).dashboard.quick);
  return (
    <div className="space-y-7">
      {groups.map((group) => {
        const actions = group.actions.filter(a => !a.requireAdmin || isAdmin);
        if (actions.length === 0) return null;

        return (
          <div key={group.label}>
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <h2 className="text-sm font-semibold text-gray-800">{group.label}</h2>
              <span className="text-xs text-gray-400">· {group.sub}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group relative bg-white rounded-2xl border border-orange-100 p-5 transition-all hover:shadow-md hover:border-orange-300 active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{action.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
