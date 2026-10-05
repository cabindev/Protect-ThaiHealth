import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/app/lib/db';
import { getDict } from '@/app/i18n/server';

export async function POST(req: NextRequest) {
  const t = await getDict();
  try {
    const { token, password } = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: t.api.resetInvalidToken }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenCreatedAt: null,
        resetTokenExpiresAt: null,
        lastPasswordReset: new Date(),
      },
    });

    if (updatedUser) {
      return NextResponse.json({ message: t.api.resetSuccess });
    } else {
      return NextResponse.json({ error: t.api.resetFailed }, { status: 500 });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: t.api.resetFailed }, { status: 500 });
  }
}
