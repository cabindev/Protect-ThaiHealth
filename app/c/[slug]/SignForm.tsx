'use client';
// ฟอร์มลงชื่อ: ลงนามในนาม (องค์กร/ส่วนตัว) / ชื่อ / นามสกุล / อีเมล / องค์กร + ตำแหน่ง / ประเทศ / ความคิดเห็น (ไม่บังคับ) / ลายเซ็นนิ้ว + ยินยอม (PDPA) → POST /api/campaigns/[slug]/sign
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Eraser, Link2, Share2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useI18n } from '@/app/i18n/I18nProvider';
import SignaturePad, { type SignaturePadHandle } from '@/app/components/SignaturePad';
import { Field, Notice, SubmitButton, inputClass } from '@/app/components/auth/AuthLayout';
import { countWords, MAX_COMMENT_CHARS, MAX_COMMENT_WORDS } from '@/app/lib/wordCount';

// countries มาจาก server — ชื่อประเทศจาก Intl ของ Node กับ browser ต่างเวอร์ชันกัน (เช่น "Hong Kong SAR China" vs "Hong Kong")
// ถ้าสร้างฝั่ง client จะ hydration mismatch
export default function SignForm({ slug, countries }: { slug: string; countries: { code: string; name: string }[] }) {
  const { t, locale } = useI18n();
  const c = t.campaign;
  const router = useRouter();
  const pad = useRef<SignaturePadHandle>(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', organization: '', position: '', country: 'TH' });
  // ค่าเริ่มต้น = ในนามส่วนตัว (คนส่วนใหญ่) — ลงนามแทนองค์กรต้องกดเลือกเอง
  const [signingAs, setSigningAs] = useState<'ORGANIZATION' | 'INDIVIDUAL'>('INDIVIDUAL');
  const asOrg = signingAs === 'ORGANIZATION';
  const [comment, setComment] = useState('');
  const words = countWords(comment);
  const tooLong = words > MAX_COMMENT_WORDS;
  const [showPublic, setShowPublic] = useState(true);
  const [padEmpty, setPadEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null); // ชื่อผู้ลงชื่อ หลังส่งสำเร็จ

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // เก็บ form ไว้ก่อน await — หลัง await แล้ว e.currentTarget ของ React เป็น null
    const formEl = e.currentTarget;
    setError(null);
    const required = [form.firstName, form.lastName, form.email, form.country, ...(asOrg ? [form.organization, form.position] : [])];
    if (required.some((v) => !v.trim())) return setError(c.errRequired);
    if (tooLong) return setError(c.errCommentLong(MAX_COMMENT_WORDS));

    setLoading(true);
    try {
      // ลายเซ็นไม่บังคับ: เซ็นแล้วค่อยแนบไป
      const blob = pad.current && !pad.current.isEmpty() ? await pad.current.toBlob() : null;
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.set(k, v.trim()));
      fd.set('signingAs', signingAs);
      if (comment.trim()) fd.set('comment', comment.trim());
      fd.set('showPublic', showPublic ? '1' : '0');
      fd.set('consent', '1'); // การกดปุ่ม "ลงชื่อ" ใต้ข้อความยินยอม = ยินยอม
      fd.set('website', String(new FormData(formEl).get('website') ?? ''));
      if (blob) fd.set('signature', new File([blob], 'signature.png', { type: 'image/png' }));
      const res = await fetch(`/api/campaigns/${slug}/sign`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || c.errNetwork);
      setDone(form.firstName.trim());
      router.refresh(); // อัปเดตตัวนับ/รายชื่อบนหน้า
      document.getElementById('sign')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : c.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const url = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
    const share = async () => {
      if (navigator.share) {
        await navigator.share({ url, title: document.title }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(c.copied);
      }
    };
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-12 h-12 text-orange-600 mx-auto" />
        <h2 className="mt-3 text-xl font-bold text-gray-900">{c.thanksTitle(done)}</h2>
        <p className="mt-2 text-sm text-gray-500">{c.thanksBody}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
          >
            <Share2 className="w-4 h-4" /> {c.share}
          </button>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-10 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900"
          >
            LINE
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-10 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900"
          >
            Facebook
          </a>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              toast.success(c.copied);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900"
          >
            <Link2 className="w-4 h-4" /> {c.copyLink}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate lang={locale}>
      <h2 className="text-lg font-bold text-gray-900">{c.formTitle}</h2>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-gray-500">
          {c.signingAs}
          <span className="text-orange-600 ml-1">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              // ส่วนตัวอยู่ซ้าย/บน (ค่าเริ่มต้น) · องค์กรอยู่ขวา/ล่าง
              { v: 'INDIVIDUAL', label: c.asIndividual, hint: c.asIndividualHint, Icon: User },
              { v: 'ORGANIZATION', label: c.asOrganization, hint: c.asOrganizationHint, Icon: Building2 },
            ] as const
          ).map(({ v, label, hint, Icon }) => (
            <label
              key={v}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                signingAs === v ? 'border-orange-600 bg-orange-50' : 'border-gray-300 hover:border-gray-500'
              )}
            >
              <input
                type="radio"
                name="signingAs"
                value={v}
                checked={signingAs === v}
                onChange={() => setSigningAs(v)}
                className="sr-only"
              />
              <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', signingAs === v ? 'text-orange-600' : 'text-gray-400')} />
              <span>
                <span className="block text-sm font-semibold text-gray-900">{label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={t.common.firstName} name="firstName" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
        <Field label={t.common.lastName} name="lastName" required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
      </div>
      <Field label={t.common.email} name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
      {asOrg ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={c.organization} name="organization" required autoComplete="organization" value={form.organization} onChange={set('organization')} />
          <Field label={c.position} name="position" required autoComplete="organization-title" placeholder={c.positionPlaceholder} value={form.position} onChange={set('position')} />
        </div>
      ) : (
        <div>
          <label htmlFor="organization" className="block mb-1 text-[13px] font-semibold text-gray-500">
            {c.affiliation} <span className="font-normal text-gray-400">{c.affiliationOptional}</span>
          </label>
          <input id="organization" name="organization" autoComplete="organization" value={form.organization} onChange={set('organization')} className={inputClass} />
        </div>
      )}
      <div>
        <label htmlFor="country" className="block mb-1 text-[13px] font-semibold text-gray-500">
          {c.country}
          <span className="text-orange-600 ml-1">*</span>
        </label>
        <select id="country" value={form.country} onChange={set('country')} className={`${inputClass} pr-6`} autoComplete="country">
          {countries.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1 gap-3">
          <label htmlFor="comment" className="text-[13px] font-semibold text-gray-500">
            {c.comment} <span className="font-normal text-gray-400">{c.commentOptional}</span>
          </label>
          <span className={`text-xs tabular-nums ${tooLong ? 'text-red-600 font-semibold' : 'text-gray-400'}`} aria-live="polite">
            {c.words(words, MAX_COMMENT_WORDS)}
          </span>
        </div>
        <textarea
          id="comment"
          name="comment"
          rows={5}
          maxLength={MAX_COMMENT_CHARS}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-invalid={tooLong}
          className={`w-full rounded-2xl border px-4 py-3 text-base leading-7 text-gray-900 focus:outline-none resize-y ${
            tooLong ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-orange-600'
          }`}
        />
        <p className="mt-1 text-xs text-gray-400">{c.commentHint}</p>
      </div>

      {/* honeypot — ซ่อนจากคน (บอทมักกรอกทุกช่อง) */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] font-semibold text-gray-500">
            {c.signature}
            <span className="text-gray-400 font-normal ml-1">{c.commentOptional}</span>
          </span>
          <button
            type="button"
            onClick={() => pad.current?.clear()}
            disabled={padEmpty}
            className="inline-flex items-center gap-1 -my-2 -mr-2 px-3 py-2.5 rounded-full text-[13px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40"
          >
            <Eraser className="w-3.5 h-3.5" /> {c.clear}
          </button>
        </div>
        <SignaturePad ref={pad} onChange={setPadEmpty} />
        <p className="mt-1 text-xs text-gray-400">{c.signatureHint}</p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={showPublic} onChange={(e) => setShowPublic(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-600 shrink-0" />
          {c.showPublic}
        </label>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <div>
        {/* ข้อความยินยอมอยู่ติดปุ่ม — การกดปุ่มคือการยืนยัน (แทนช่องติ๊กที่ต้องกดเพิ่ม) */}
        <p className="mb-3 text-xs leading-5 text-gray-500">{c.consent}</p>
        <SubmitButton loading={loading}>{c.submit}</SubmitButton>
      </div>
    </form>
  );
}
