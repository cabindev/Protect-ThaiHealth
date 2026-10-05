//api/auth/signup/route.ts
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { notifyAdminsOfSignup } from '@/app/lib/mailer';
import prisma from '@/app/lib/db';
import { getDict } from '@/app/i18n/server';
import { IMAGE_TYPES, MAX_FILE_SIZE, UPLOAD_ROOT } from '@/app/lib/uploads';

export async function POST(request: NextRequest) {
  const t = await getDict();
  try {
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const image = formData.get('image') as File | null;

    // Check if user with the same email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse(JSON.stringify({ error: t.api.emailExists }), { status: 400 });
    }

    // Validate password strength
    if (password.length < 5) {
      return new NextResponse(JSON.stringify({ error: t.api.passwordTooShort }), { status: 400 });
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // รูปโปรไฟล์ → uploads/avatars/ แล้วอ้างผ่าน /api/files (เหมือนหน้าแก้โปรไฟล์)
    // ห้ามเขียนลง public/ — production ไม่เสิร์ฟไฟล์ที่เพิ่มหลัง build และ public/img อยู่ใน .gitignore
    let imagePath = '';
    if (image instanceof File && image.size > 0) {
      if (!IMAGE_TYPES.includes(image.type)) {
        return new NextResponse(JSON.stringify({ error: t.api.imageType }), { status: 400 });
      }
      if (image.size > MAX_FILE_SIZE) {
        return new NextResponse(JSON.stringify({ error: t.api.imageTooLarge }), { status: 400 });
      }
      const ext = (path.extname(image.name) || '.jpg').toLowerCase();
      const fileName = `signup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const absPath = path.join(UPLOAD_ROOT, 'avatars', fileName);
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, Buffer.from(await image.arrayBuffer()));
      imagePath = `/api/files/avatars/${fileName}`;
    }

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        image: imagePath || null,
        role: 'pending', // รอแอดมินอนุมัติก่อนเห็นข้อมูลภายใน
      },
    });

    // แจ้งแอดมินให้อนุมัติ — ไม่ await (ส่งเมลช้า/พลาดต้องไม่ทำให้การสมัครค้าง)
    void notifyAdminsOfSignup({ firstName, lastName, email, via: 'form' });

    // Return success response
    return new NextResponse(JSON.stringify({ message: t.api.signupSuccess, userId: newUser.id }), { status: 200 });
  } catch (error) {
    console.error('Error creating user:', error);
    return new NextResponse(JSON.stringify({ error: t.api.signupFailed }), { status: 500 });
  }
}

export async function GET() {
  const t = await getDict();
  try {
    const userCount = await prisma.user.count();
    return new NextResponse(JSON.stringify({ userCount }), { status: 200 });
  } catch (error) {
    console.error('Error fetching user count:', error);
    return new NextResponse(JSON.stringify({ error: t.api.userCountFailed }), { status: 500 });
  }
}
