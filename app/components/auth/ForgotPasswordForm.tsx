//app/components/auth/ForgotPasswordForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { AuthLayout, Field, SubmitButton, Notice } from './AuthLayout';
import { SITE } from '@/app/lib/site';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { t } = useI18n();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || t.auth.forgot.sent);
        setIsSuccess(true);
        setEmail('');
      } else {
        setMessage(data.error || t.auth.forgot.error);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error occurred:', error);
      setMessage(t.auth.forgot.error);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={SITE.name}
      title={t.auth.forgot.title}
      subtitle={t.auth.forgot.subtitle}
      footer={
        <Link href="/auth/signin" className="text-gray-900 font-semibold hover:text-orange-600 transition-colors">
          {t.auth.forgot.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <Field
          label={t.common.email}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {message && <Notice tone={isSuccess ? "success" : "danger"}>{message}</Notice>}

        <SubmitButton loading={isLoading}>{t.auth.forgot.submit}</SubmitButton>
      </form>
    </AuthLayout>
  );
}
