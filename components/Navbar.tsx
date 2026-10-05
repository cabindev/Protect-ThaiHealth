'use client';
// Navbar ลอยไร้พื้นหลัง — แต่ละเมนูเป็นปุ่มขาวมุมมนของตัวเอง (หน้าอื่นต้องเว้น pt-20 เอง)
// ซ่อนตัวเองบน /dashboard ซึ่งมี Sidebar/TopNav ของตัวเองอยู่แล้ว
// เพิ่มเมนูของโมดูลใหม่ใน NAV_LINKS (label = ฟังก์ชันอ่านจาก dictionary)
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, User, LogOut, Menu, BarChart3, X, Clock, QrCode, Users } from 'lucide-react';
import { SITE } from '@/app/lib/site';
import { useI18n } from '@/app/i18n/I18nProvider';
import LanguageSwitcher from '@/app/i18n/LanguageSwitcher';
import type { Dictionary } from '@/app/i18n/dictionaries';

const PILL =
  'inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-sm text-xs font-medium text-gray-700 hover:bg-white hover:text-orange-700 transition-colors';
const MOBILE_ITEM =
  'flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-700';

type NavLink = {
  href: string;
  label: (t: Dictionary) => string;
  icon: React.ComponentType<{ className?: string }>;
  show: (s: { loggedIn: boolean; isPending: boolean; isAdmin: boolean }) => boolean;
};

const NAV_LINKS: NavLink[] = [
  // ทางลัดไปจอ QR ของแคมเปญ — ทุกคนเห็น (ใช้ยื่นมือถือให้คนข้าง ๆ สแกนต่อได้)
  { href: '/supporters', label: (t) => t.nav.supporters, icon: Users, show: () => true },
  { href: '/qr', label: (t) => t.nav.qr, icon: QrCode, show: () => true },
  { href: '/auth/pending', label: (t) => t.nav.pending, icon: Clock, show: (s) => s.isPending },
  { href: '/dashboard', label: (t) => t.nav.dashboard, icon: BarChart3, show: (s) => s.isAdmin },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.dropdown-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const role = session?.user?.role;
  const flags = {
    loggedIn: !!session?.user,
    isPending: role === 'pending',
    isAdmin: role === 'admin' || role === 'superadmin',
  };
  const links = NAV_LINKS.filter((l) => l.show(flags));

  // แดชบอร์ดมี Sidebar/TopNav ของตัวเอง · จอ QR ในห้องประชุมต้องสะอาด ไม่มีปุ่มรบกวน
  if (pathname?.startsWith('/dashboard') || pathname?.endsWith('/present')) return null;

  return (
    <nav className="fixed top-0 inset-x-0 z-[2000] pointer-events-none print:hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        {/* แบรนด์ */}
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-sm"
        >
          <span className="text-sm font-extrabold tracking-wide text-orange-600">{SITE.shortName}</span>
          <span className="hidden sm:inline text-xs font-medium text-gray-600">{SITE.name}</span>
        </Link>

        {/* เมนูหลัก (เดสก์ท็อป) */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2">
          {status === 'loading' ? (
            <div className="w-24 h-9 rounded-full bg-white/70 animate-pulse" />
          ) : (
            links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={PILL} title={label(t)}>
                <Icon className="w-4 h-4 text-gray-400" />
                {label(t)}
              </Link>
            ))
          )}

          <LanguageSwitcher />

          {session?.user ? (
            <div className="relative dropdown-menu">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                aria-label={t.common.userMenu}
                className="flex w-9 h-9 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-sm items-center justify-center overflow-hidden hover:border-orange-300 transition-colors"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-gray-500" />
                )}
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl py-1.5">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-800">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{session.user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {t.common.profile}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t.common.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => router.push('/auth/signin')} className={PILL}>
              <User className="w-4 h-4 text-gray-400" />
              {t.common.signIn}
            </button>
          )}
        </div>

        {/* มือถือ */}
        <div className="pointer-events-auto sm:hidden flex items-center gap-2">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={t.common.menu}
          className="flex w-9 h-9 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-sm items-center justify-center text-gray-600"
        >
          {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="pointer-events-auto sm:hidden mx-3 rounded-2xl bg-white border border-gray-200 shadow-xl p-2">
          <Link href="/" className={MOBILE_ITEM} onClick={() => setIsMenuOpen(false)}>
            <Home className="w-4 h-4 text-gray-400" /> {t.common.home}
          </Link>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={MOBILE_ITEM} onClick={() => setIsMenuOpen(false)}>
              <Icon className="w-4 h-4 text-gray-400" /> {label(t)}
            </Link>
          ))}

          <div className="mt-1 pt-1 border-t border-gray-100">
            {session?.user ? (
              <>
                <Link href="/profile" className={MOBILE_ITEM} onClick={() => setIsMenuOpen(false)}>
                  <User className="w-4 h-4 text-gray-400" /> {session.user.firstName}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs rounded-xl text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> {t.common.signOut}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  router.push('/auth/signin');
                  setIsMenuOpen(false);
                }}
                className={`${MOBILE_ITEM} w-full`}
              >
                <User className="w-4 h-4 text-gray-400" /> {t.common.signIn}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
