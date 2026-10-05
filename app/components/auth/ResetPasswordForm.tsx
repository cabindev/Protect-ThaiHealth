//app/components/auth/ResetPasswordForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout, PasswordField, SubmitButton, Notice } from './AuthLayout';
import { SITE } from '@/app/lib/site';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null | undefined>(undefined); // undefined = ยังไม่ได้อ่าน URL
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    setToken(urlToken);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password.length < 5) {
      setMessage(t.auth.reset.tooShort);
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t.auth.reset.mismatch);
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.auth.reset.error);
      }

      setMessage(t.auth.reset.success);
      setIsSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 2000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.auth.reset.error);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={SITE.name}
      title={t.auth.reset.title}
      subtitle={t.auth.reset.subtitle}
      footer={
        <Link href="/auth/signin" className="text-gray-900 font-semibold hover:text-orange-600 transition-colors">
          {t.auth.forgot.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <PasswordField
          label={t.auth.reset.newPassword}
          name="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label={t.auth.reset.confirm}
          name="confirmPassword"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {token === null && <Notice tone="danger">{t.auth.reset.invalidLink}</Notice>}
        {message && <Notice tone={isSuccess ? "success" : "danger"}>{message}</Notice>}

        <SubmitButton loading={isLoading}>{t.auth.reset.submit}</SubmitButton>
      </form>
    </AuthLayout>
  );
}
