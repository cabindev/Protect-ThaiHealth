'use client';
// app/components/SignaturePad.tsx — กล่องเซ็นชื่อด้วยนิ้ว/เมาส์/ปากกา (pointer events)
// ต่อยอดจาก activerun/CheckinScanner แต่แก้ 2 จุด:
// 1. ขนาด canvas จริงตามขนาดที่แสดง × devicePixelRatio — ของเดิม fix 600px แล้ว CSS ยืด ทำให้เส้นไม่ตรงนิ้วบนมือถือ + ภาพแตก
// 2. วาดเส้นโค้งต่อเนื่องด้วย quadraticCurveTo ให้ลายเซ็นลื่นขึ้น
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  clear: () => void;
  toBlob: () => Promise<Blob | null>; // PNG พื้นขาว (เปิดดู/พิมพ์ได้ชัด)
}

const SignaturePad = forwardRef<SignaturePadHandle, { className?: string; onChange?: (empty: boolean) => void }>(
  function SignaturePad({ className, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const strokes = useRef(0); // นับจุดที่วาด — กันกดจิ้มจุดเดียวแล้วถือว่าเซ็นแล้ว
    const last = useRef<{ x: number; y: number } | null>(null);

    const setup = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111827';
      strokes.current = 0;
      onChange?.(true);
    }, [onChange]);

    // ตั้งขนาดครั้งแรก + เมื่อหมุนจอ/ย่อหน้าต่าง (การเปลี่ยนขนาดล้างลายเซ็น — ให้เซ็นใหม่)
    useEffect(() => {
      setup();
      let w = canvasRef.current?.getBoundingClientRect().width;
      const onResize = () => {
        const nw = canvasRef.current?.getBoundingClientRect().width;
        if (nw && nw !== w) {
          w = nw;
          setup();
        }
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [setup]);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      drawing.current = true;
      const p = pos(e);
      last.current = p;
      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };

    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current || !last.current) return;
      const ctx = canvasRef.current!.getContext('2d')!;
      const p = pos(e);
      const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
      ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
      last.current = p;
      strokes.current += 1;
      if (strokes.current === 8) onChange?.(false);
    };

    const end = () => {
      drawing.current = false;
      last.current = null;
    };

    useImperativeHandle(ref, () => ({
      isEmpty: () => strokes.current < 8,
      clear: setup,
      toBlob: () =>
        new Promise((resolve) => {
          const src = canvasRef.current!;
          // พื้นโปร่งใส → วางบนพื้นขาวก่อน export
          const out = document.createElement('canvas');
          out.width = src.width;
          out.height = src.height;
          const ctx = out.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(src, 0, 0);
          out.toBlob(resolve, 'image/png');
        }),
    }));

    return (
      <canvas
        ref={canvasRef}
        className={cn('block w-full h-48 sm:h-56 rounded-2xl border border-gray-300 bg-white touch-none cursor-crosshair', className)}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
    );
  }
);

export default SignaturePad;
