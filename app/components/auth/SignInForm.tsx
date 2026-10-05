//app/components/auth/SignInForm.tsx
'use client'

import { useState, FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import GoogleSignInButton from "./GoogleSignInButton"
import { AuthLayout, OrDivider, Field, PasswordField, SubmitButton, Notice } from "./AuthLayout"
import { SITE } from "@/app/lib/site"
import { useI18n } from "@/app/i18n/I18nProvider"

// รับเฉพาะ path ในเว็บเราเอง — กัน ?callbackUrl= พาออกไปเว็บอื่น (NextAuth ส่งมาเป็น URL เต็ม)
// ไม่ระบุ (หรือเป็นหน้าแรก) = ไป SITE.homeAfterLogin ไม่ค้างที่ landing
function safeCallback(raw: string | null): string {
  if (!raw) return SITE.homeAfterLogin
  if (raw === "/") return SITE.homeAfterLogin
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw
  if (typeof window === "undefined") return SITE.homeAfterLogin // ตอน SSR ยังไม่รู้ origin — ค่านี้ไม่ได้ถูกเขียนลง DOM
  try {
    const url = new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin || url.pathname === "/") return SITE.homeAfterLogin
    return url.pathname + url.search
  } catch {
    return SITE.homeAfterLogin
  }
}

export default function SignInForm() {
  const searchParams = useSearchParams()
  const { t } = useI18n()
  // NextAuth ส่ง ?error= กลับมาหน้านี้เมื่อ login ด้วย Google ไม่สำเร็จ (pages.signIn ใน authOptions)
  const errorCode = searchParams.get("error")
  const [error, setError] = useState<string | null>(
    errorCode && errorCode !== "CredentialsSignin"
      ? t.auth.signIn.oauth[errorCode] ?? t.auth.signIn.oauthDefault
      : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const data = new FormData(e.currentTarget)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: String(data.get("email")),
        password: String(data.get("password")),
      })

      if (result?.error) {
        setError(t.auth.signIn.invalid)
      } else {
        router.replace(callbackUrl)
        router.refresh()
      }
    } catch {
      setError(t.auth.signIn.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={SITE.name}
      title={t.auth.signIn.title}
      subtitle={t.site.tagline}
      footer={
        <>
          {t.auth.signIn.noAccount}{" "}
          <Link href="/auth/signup" className="text-gray-900 font-semibold hover:text-orange-600 transition-colors">
            {t.common.signUp}
          </Link>
        </>
      }
    >
      <div className="space-y-7">
        <GoogleSignInButton callbackUrl={callbackUrl} />

        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-7">
          <Field label={t.common.email} name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          <div>
            <PasswordField label={t.common.password} name="password" required autoComplete="current-password" placeholder="••••••" />
            <Link
              href="/auth/forgot-password"
              className="inline-block mt-2 text-[13px] font-semibold text-gray-400 hover:text-orange-600 transition-colors"
            >
              {t.auth.signIn.forgot}
            </Link>
          </div>

          {error && <Notice tone="danger">{error}</Notice>}

          <SubmitButton loading={isLoading}>{t.common.signIn}</SubmitButton>
        </form>
      </div>
    </AuthLayout>
  )
}
