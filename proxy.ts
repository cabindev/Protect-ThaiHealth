// proxy.ts — Next 16 เปลี่ยนชื่อจาก middleware.ts (ทำงานเหมือนเดิม)
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SITE } from '@/app/lib/site';
import { SESSION_COOKIE } from '@/app/lib/configs/auth/cookie';

// ล็อกอินแล้วไม่ต้องเห็นหน้าเข้าสู่ระบบ / สมัครสมาชิกอีก (หน้าแรกเป็นรายการแคมเปญ ทุกคนเข้าได้)
const GUEST_ONLY = ['/auth/signin', '/auth/signup'];

// หน้าที่ต้องเป็นบัญชีอนุมัติแล้ว (ไม่ใช่ pending) — เพิ่ม prefix ของโมดูลใหม่ที่นี่ + ใน config.matcher
const STAFF_ONLY: string[] = [];

export async function proxy(request: NextRequest) {
  const user = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE, // ต้องตรงกับ authOptions.cookies ไม่งั้นอ่าน session ไม่เจอ
  });

  const { pathname } = request.nextUrl;

  if (user && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL(SITE.homeAfterLogin, request.url));
  }

  // บัญชีรออนุมัติ → หน้าแจ้งรออนุมัติ
  // (role ใน cookie อาจค้าง pending ชั่วครู่หลังอนุมัติ — หน้า /auth/pending เช็คจาก DB แล้วพากลับเอง)
  if (STAFF_ONLY.some((p) => pathname.startsWith(p))) {
    if (!user) return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
    if (user.role === 'pending') return NextResponse.redirect(new URL('/auth/pending', request.url));
  }

  if (
    pathname.startsWith('/dashboard') &&
    (!user || !['admin', 'superadmin'].includes(user.role as string))
  ) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/signin', '/auth/signup', '/dashboard/:path*'],
};
