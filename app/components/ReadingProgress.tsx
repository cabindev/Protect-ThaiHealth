'use client';
// แถบส้มบาง ๆ บนสุดของจอ บอกว่าอ่านไปถึงไหน — โผล่หลังเลื่อนพ้นปก (บนปกส้มจะมองไม่เห็นอยู่แล้ว)
import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [p, setP] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setShow(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 top-0 z-[2100] h-[3px] transition-opacity duration-300 print:hidden ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="h-full origin-left bg-orange-600" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
