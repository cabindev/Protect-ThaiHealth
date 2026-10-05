// app/components/auth/SignUpForm.tsx
'use client'

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User } from "lucide-react"
import GoogleSignInButton from "./GoogleSignInButton"
import { AuthLayout, OrDivider, Field, PasswordField, SubmitButton, Notice } from "./AuthLayout"
import { SITE } from "@/app/lib/site"
import { useI18n } from "@/app/i18n/I18nProvider"
import imageCompression from "browser-image-compression"

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  image: File | null
}

export default function SignUpForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    image: null
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError(t.auth.signUp.invalidImage)
        return
      }

      // รูปโปรไฟล์ใช้ขนาดเล็ก — บีบอัดฝั่ง browser ก่อน (รูปมือถือใหญ่มาก)
      let finalFile = file
      if (file.size > 512 * 1024) {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
          finalFile = new File([compressed], file.name, { type: compressed.type })
        } catch {
          // บีบอัดไม่ได้ก็ใช้ไฟล์เดิม
        }
      }

      setFormData({ ...formData, image: finalFile })

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(finalFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) data.append(key, value)
      })

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: data
      })

      if (response.ok) {
        router.push('/auth/signin')
      } else {
        const error = await response.json()
        setError(error.error || t.auth.signUp.error)
      }
    } catch {
      setError(t.auth.signUp.networkError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={SITE.name}
      title={t.auth.signUp.title}
      subtitle={t.site.tagline}
      footer={
        <>
          {t.auth.signUp.haveAccount}{" "}
          <Link href="/auth/signin" className="text-gray-900 font-semibold hover:text-orange-600 transition-colors">
            {t.common.signIn}
          </Link>
        </>
      }
    >
      <div className="space-y-7">
        <GoogleSignInButton />

        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-2 gap-5">
            <Field
              label={t.common.firstName}
              name="firstName"
              required
              autoComplete="given-name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Field
              label={t.common.lastName}
              name="lastName"
              required
              autoComplete="family-name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <Field
            label={t.common.email}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <PasswordField
            label={t.common.password}
            name="password"
            required
            minLength={5}
            autoComplete="new-password"
            placeholder={t.auth.signUp.passwordHint}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div>
            <p className="text-[13px] font-semibold text-gray-500 mb-3">
              {t.auth.signUp.photo} <span className="font-normal text-gray-400">{t.auth.signUp.optional}</span>
            </p>
            <label className="flex items-center gap-4 cursor-pointer group">
              <span className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-orange-50 border border-orange-100 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={22} className="text-orange-300" />
                )}
              </span>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                {imagePreview ? t.auth.signUp.changePhoto : t.auth.signUp.choosePhoto}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {error && <Notice tone="danger">{error}</Notice>}

          <SubmitButton loading={isLoading}>{t.common.signUp}</SubmitButton>
        </form>
      </div>
    </AuthLayout>
  )
}
