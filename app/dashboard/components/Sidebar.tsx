// app/dashboard/components/Sidebar.tsx
// Sidebar เมนูหลักของแดชบอร์ด — โครงสร้างเดียวกับ stopdrinknetwork
// เพิ่มเมนูของโมดูลใหม่ใน MAIN_MENU / SETTINGS_MENU (ไม่ต้องแก้ JSX) · ชื่อเมนูอ่านจาก dictionary
'use client'
import type { Session } from 'next-auth';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useDashboard } from '../context/DashboardContext';
import { cn } from '@/lib/utils';
import { SITE } from '@/app/lib/site';
import { isAdminRole } from '@/app/lib/roles';
import { useI18n } from '@/app/i18n/I18nProvider';
import type { Dictionary } from '@/app/i18n/dictionaries';
import {
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Menu,
  PanelLeft,
  X,
  UserCheck,
  Settings,
  Home,
  PenLine,
  QrCode,
  Users,
} from 'lucide-react';

interface SidebarProps {
  user: Session['user'];
}

interface MenuItem {
  name: (t: Dictionary) => string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requireAdmin?: boolean;
  exact?: boolean; // active เฉพาะ path ตรงตัว (ไม่นับหน้าลูก)
}

const MAIN_MENU: MenuItem[] = [
  { name: (t) => t.dashboard.title, href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: (t) => t.adminCampaigns.menu, href: '/dashboard/campaigns', icon: PenLine, requireAdmin: true },
  { name: (t) => t.nav.supporters, href: '/supporters', icon: Users, exact: true },
  { name: (t) => t.nav.qr, href: '/qr', icon: QrCode, exact: true },
  { name: (t) => t.common.profile, href: '/profile', icon: User, exact: true },
];

const SETTINGS_MENU: MenuItem[] = [
  { name: (t) => t.dashboard.sidebar.users, href: '/dashboard/setting/admin', icon: UserCheck, requireAdmin: true },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar } = useDashboard();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { t } = useI18n();
  const s = t.dashboard.sidebar;

  // เปิดเมนูอัตโนมัติตามหน้าที่กำลังเปิดอยู่
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/setting')) {
      setIsSettingsMenuOpen(true);
    }
  }, [pathname]);

  // ปิด sidebar บนมือถือเมื่อเปลี่ยนหน้า
  useEffect(() => {
    toggleMobileSidebar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isAdmin = isAdminRole(user?.role);
  const allowed = (m: MenuItem) => !m.requireAdmin || isAdmin;
  const isActive = (m: MenuItem) => (m.exact ? pathname === m.href : !!pathname?.startsWith(m.href));

  const itemClass = (active: boolean) =>
    cn(
      "group flex items-center w-full p-2 rounded-lg text-sm transition-colors focus:outline-none",
      active ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-orange-50/60",
      sidebarCollapsed && "justify-center"
    );
  const iconBox = cn("flex items-center justify-center", sidebarCollapsed ? "h-8 w-8" : "h-4 w-4");
  const iconSize = sidebarCollapsed ? "w-5 h-5" : "w-4 h-4";
  const settingsItems = SETTINGS_MENU.filter(allowed);

  return (
    <>
      {/* Overlay สำหรับกดปิด sidebar บนมือถือ */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => toggleMobileSidebar(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "print:hidden fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-orange-100 transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-64",
          "lg:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b border-orange-100 px-3 bg-orange-600">
          {!sidebarCollapsed ? (
            <div className="flex items-center">
              <Link href="/dashboard">
                <span className="text-sm font-extrabold text-white tracking-wide">{SITE.shortName}</span>
              </Link>
              <Link href="/" className="ml-2">
                <span className="text-white font-semibold text-sm tracking-wide uppercase">{SITE.name}</span>
              </Link>
            </div>
          ) : (
            <Link href="/dashboard" className="mx-auto">
              <span className="text-sm font-extrabold text-white tracking-wide">{SITE.shortName}</span>
            </Link>
          )}

          {/* ปุ่มปิดบนมือถือ */}
          <button
            type="button"
            onClick={() => toggleMobileSidebar(false)}
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/15 lg:hidden"
            aria-label={s.close}
          >
            <X className="h-4 w-4" />
          </button>

          {/* ปุ่มย่อ/ขยายบนจอใหญ่ */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/15 hidden lg:block"
            aria-label={sidebarCollapsed ? s.expand : s.collapse}
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar menu */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="mt-2">
            {!sidebarCollapsed && (
              <h4 className="px-2 text-base text-center font-semibold text-orange-700 uppercase tracking-wide mb-2">
                {s.panel}
              </h4>
            )}

            {MAIN_MENU.filter(allowed).map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.href} className="px-2 mb-2">
                  <Link href={m.href} className={itemClass(isActive(m))} title={sidebarCollapsed ? m.name(t) : ""}>
                    <div className={iconBox}>
                      <Icon className={iconSize} />
                    </div>
                    {!sidebarCollapsed && <span className="ml-2 font-medium text-sm">{m.name(t)}</span>}
                  </Link>
                </div>
              );
            })}

            {/* Settings menu */}
            {settingsItems.length > 0 && (
              <div className="px-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                  className={itemClass(!!pathname?.startsWith("/dashboard/setting"))}
                  title={sidebarCollapsed ? s.settings : ""}
                >
                  <div className={iconBox}>
                    <Settings className={iconSize} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between w-full ml-2">
                      <span className="font-medium text-sm">{s.settings}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isSettingsMenuOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  )}
                </button>

                {isSettingsMenuOpen && !sidebarCollapsed && (
                  <div className="mt-1 ml-2">
                    <ul className="space-y-1">
                      {settingsItems.map((subMenu) => {
                        const Icon = subMenu.icon;
                        return (
                          <li key={subMenu.href}>
                            <Link
                              href={subMenu.href}
                              className={`flex items-center p-2 text-sm rounded-lg transition-colors focus:outline-none ${
                                isActive(subMenu)
                                  ? "bg-orange-100 text-orange-800"
                                  : "text-gray-600 hover:bg-orange-50/60 hover:text-gray-900"
                              }`}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              <span className="text-xs font-normal">{subMenu.name(t)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* กลับหน้าหลักเว็บไซต์ */}
            {!sidebarCollapsed && (
              <div className="px-3 mt-6 mb-1">
                <div className="border-t border-orange-100 pt-3">
                  <span className="text-[10px] text-gray-300 uppercase tracking-widest">{s.website}</span>
                </div>
              </div>
            )}
            <div className="px-2 mb-2">
              <Link
                href="/"
                className={cn(
                  "group flex items-center w-full p-2 rounded-lg text-sm text-gray-500 hover:bg-orange-50/60 hover:text-orange-700 transition-colors focus:outline-none",
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? s.backHome : ""}
              >
                <div className={iconBox}>
                  <Home className={iconSize} />
                </div>
                {!sidebarCollapsed && <span className="ml-2 font-normal text-sm">{s.backHome}</span>}
              </Link>
            </div>
          </div>
        </div>

        {/* User info & logout */}
        <div className="border-t border-orange-100 p-3 bg-orange-50/50">
          <div
            className={cn(
              "flex items-center bg-white p-2 rounded-lg border border-orange-100",
              sidebarCollapsed && "justify-center"
            )}
          >
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-orange-700">
                    {user?.firstName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="ml-2 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {user?.firstName || ""} {user?.lastName || ""}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                <p className="text-xs mt-1 bg-orange-100 text-orange-700 inline-block px-2 py-0.5 rounded-full border border-orange-200">
                  {t.roles[user?.role] ?? user?.role}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                toast.loading(t.common.signingOut);
                await signOut({ callbackUrl: "/" });
              } catch (error) {
                toast.error(t.common.signOutError);
                console.error('Sign out error:', error);
              }
            }}
            className={cn(
              "mt-2 flex items-center p-2 rounded-lg w-full text-gray-600 hover:bg-red-50 hover:text-red-600 text-sm transition-colors",
              sidebarCollapsed && "justify-center"
            )}
            aria-label={t.common.signOut}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-2 font-normal">{t.common.signOut}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
