'use client';
// ปุ่ม "ร่วมลงชื่อ" ลอยด้านล่างจอ ระหว่างอ่านแถลงการณ์ — โผล่เฉพาะตอนที่ไม่เห็นทั้งปุ่มบน (#sign-cta) และฟอร์ม (#sign)
// (บนมือถือฟอร์มอยู่ลึกราว 3 หน้าจอ คนสแกน QR ในห้องประชุมไม่ต้องเลื่อนหาเอง)
import { useEffect, useState } from 'react';
import { PenLine } from 'lucide-react';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function StickySignButton() {
  const { t } = useI18n();
  // เริ่มซ่อนไว้จนวัดตำแหน่งได้ (กันกระพริบตอนโหลด)
  const [ctaVisible, setCtaVisible] = useState(true);
  const [formReached, setFormReached] = useState(true);
  const formVisible = ctaVisible || formReached;

  useEffect(() => {
    const cta = document.getElementById('sign-cta');
    const form = document.getElementById('sign');
    if (!form) return;
    // ฟอร์ม: ถือว่า "ถึงแล้ว" ตั้งแต่ขอบบนเข้ามาในจอ จนเลื่อนผ่านไปทั้งหมด
    const formIo = new IntersectionObserver(([e]) => setFormReached(e.isIntersecting || e.boundingClientRect.top < 0), {
      rootMargin: '0px 0px -15% 0px',
    });
    formIo.observe(form);
    // ปุ่มบน: เห็นอยู่ = ไม่ต้องมีปุ่มลอยซ้ำ
    const ctaIo = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting));
    // ปุ่มบนกับปุ่มลอยแสดงคู่กันเสมอ (ทั้งคู่ขึ้นเฉพาะตอนเปิดรับลงชื่อ) จึงมี #sign-cta ทุกครั้ง
    if (cta) ctaIo.observe(cta);
    return () => {
      formIo.disconnect();
      ctaIo.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[1500] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 pointer-events-none transition-all duration-200 print:hidden ${
        formVisible ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
      aria-hidden={formVisible}
    >
      <a
        href="#sign"
        tabIndex={formVisible ? -1 : 0}
        className={`mx-auto flex max-w-md items-center justify-center gap-2 h-12 rounded-full bg-orange-600 text-white text-[15px] font-semibold shadow-lg shadow-orange-900/20 hover:bg-orange-700 ${
          formVisible ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        <PenLine className="w-4 h-4" /> {t.campaign.signNow}
      </a>
    </div>
  );
}
