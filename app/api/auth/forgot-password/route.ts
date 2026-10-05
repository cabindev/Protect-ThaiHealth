// app/api/auth/forgot-password/route.ts — ส่งลิงก์รีเซ็ตรหัสผ่าน (อีเมลเป็นภาษาที่ผู้ใช้เลือกอยู่ตอนกดขอ)
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { transporter, esc } from "@/app/lib/mailer";
import prisma from "@/app/lib/db";
import { SITE } from "@/app/lib/site";
import { getDict } from "@/app/i18n/server";

export async function POST(req: NextRequest) {
  const t = await getDict();
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: t.api.userNotFound }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenCreatedAt: new Date(),
        resetTokenExpiresAt: expiresAt,
      },
    });

    // NEXTAUTH_URL มักลงท้ายด้วย "/" — ตัดออกก่อนต่อ path ไม่งั้นลิงก์ในอีเมลเป็น "//auth/..."
    const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
    const e = t.email;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${t.locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${e.resetSubject(SITE.name)}</title>
      </head>
      <body style="font-family: Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <tr>
            <td>
              <h2 style="color: #ea580c;">${e.resetHeading}</h2>
              <p>${e.resetGreeting(esc(user.firstName))}</p>
              <p>${e.resetIntro(SITE.name)}</p>
              <p>${e.resetCta}</p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold;">${e.resetButton}</a>
                  </td>
                </tr>
              </table>
              <p>${e.resetFallback}</p>
              <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">${resetUrl}</p>
              <p style="color: #dc2626; font-weight: bold;">${e.resetExpiry}</p>
              <p style="margin-top: 30px;">
                <strong>${SITE.name}</strong><br>
                ${t.site.tagline}
              </p>
              <p>${e.regards(SITE.name)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb;">
              <p>&copy; ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      // Gmail ส่งได้เฉพาะในนามบัญชีที่ล็อกอิน SMTP — ใส่โดเมนอื่นจะถูกแทนที่/ตกสแปม
      from: `"${SITE.name}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: e.resetSubject(SITE.name),
      html: htmlContent,
    });

    return NextResponse.json({ message: t.api.resetSent });
  } catch (error) {
    console.error("Error occurred:", error);
    return NextResponse.json({ error: t.api.resetSendFailed }, { status: 500 });
  }
}
