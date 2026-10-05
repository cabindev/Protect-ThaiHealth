// app/api/files/[...path]/route.ts — serve ไฟล์จากโฟลเดอร์ uploads/ (นอก public/) ต้อง login
// เก็บนอก public เพราะ production build จะไม่ serve ไฟล์ที่เพิ่มหลัง build
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import path from 'path';
import fs from 'fs/promises';
import authOptions from '@/app/lib/configs/auth/authOptions';
import { isAdminRole, isStaffRole } from '@/app/lib/roles';
import { NO_STORE, UPLOAD_ROOT } from '@/app/lib/uploads';
import { getDict } from '@/app/i18n/server';

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);
  const t = await getDict();
  if (!session?.user) {
    return NextResponse.json({ error: t.api.loginRequired }, { status: 401, headers: NO_STORE });
  }

  const { path: segments } = await params;
  // บัญชีรออนุมัติ: เปิดได้แค่รูปโปรไฟล์ (avatars/) — ไฟล์อื่นเป็นข้อมูลภายใน
  if (!isStaffRole(session.user.role) && segments[0] !== 'avatars') {
    return NextResponse.json({ error: t.api.pendingApproval }, { status: 403, headers: NO_STORE });
  }
  // ภาพลายเซ็นของผู้ลงชื่อแคมเปญ = ข้อมูลส่วนบุคคล → เฉพาะแอดมิน
  if (segments[0] === 'signatures' && !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: t.api.adminOnly }, { status: 403, headers: NO_STORE });
  }
  const filePath = path.join(UPLOAD_ROOT, ...segments);

  // กัน path traversal — ไฟล์ที่ resolve แล้วต้องอยู่ใต้ uploads/ เท่านั้น
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400, headers: NO_STORE });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: t.api.fileNotFound }, { status: 404, headers: NO_STORE });
  }
}
