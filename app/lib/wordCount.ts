// app/lib/wordCount.ts — นับคำ (ใช้ทั้งฟอร์มและ API ให้ได้ผลตรงกัน)
// ภาษาไทยไม่มีช่องว่างระหว่างคำ → ใช้ Intl.Segmenter ตัดคำ (รองรับไทยทั้งใน Node และ browser)
export const MAX_COMMENT_WORDS = 2500;
// เพดานตัวอักษรกันข้อความยาวผิดปกติ (2,500 คำ ≈ 15,000–20,000 ตัวอักษร)
export const MAX_COMMENT_CHARS = 30000;

let segmenter: Intl.Segmenter | null = null;

export function countWords(text: string): number {
  const s = text.trim();
  if (!s) return 0;
  try {
    segmenter ??= new Intl.Segmenter('th', { granularity: 'word' });
    let n = 0;
    for (const part of segmenter.segment(s)) if (part.isWordLike) n++;
    return n;
  } catch {
    return s.split(/\s+/).length; // browser เก่ามากที่ไม่มี Intl.Segmenter
  }
}
