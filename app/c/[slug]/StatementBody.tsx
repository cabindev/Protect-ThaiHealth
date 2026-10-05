// แสดงข้อความแถลงการณ์ (ข้อความล้วนจากแดชบอร์ด) ให้อ่านง่าย — แปลงโครงสร้างเองจากรูปแบบบรรทัด:
// - บรรทัดขึ้นต้น "1. " "2. " … ติดกัน = รายการมีตัวเลขสีส้ม
// - บรรทัดสั้นที่ตามด้วยรายการทันที (เช่น "ข้อเรียกร้องของเรา") = หัวข้อย่อย
// - ที่เหลือ = ย่อหน้า (บรรทัดว่างคั่น)
// แสดงเป็นข้อความเท่านั้น (React escape ให้) — ไม่ตีความ HTML/markdown จากผู้ใช้
type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'ol'; items: { n: string; text: string }[] };

const NUM = /^(\d{1,2})[.)]\s+(.*)$/;

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join('\n') });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(NUM);
    if (!line) {
      flush();
      continue;
    }
    if (m) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ol') last.items.push({ n: m[1], text: m[2] });
      else blocks.push({ kind: 'ol', items: [{ n: m[1], text: m[2] }] });
      continue;
    }
    // บรรทัดสั้น ไม่มีจุดจบประโยค และบรรทัดถัดไปเป็นข้อ 1. → หัวข้อ
    const next = lines.slice(i + 1).find((l) => l.trim());
    if (!para.length && line.length <= 60 && !/[.。:]$/.test(line) && next && NUM.test(next.trim())) {
      flush();
      blocks.push({ kind: 'h', text: line });
      continue;
    }
    // ข้อความต่อจากข้อในรายการ (ไม่มีบรรทัดว่างคั่น) → ต่อท้ายข้อนั้น
    const last = blocks[blocks.length - 1];
    if (!para.length && last?.kind === 'ol' && lines[i - 1]?.trim()) {
      last.items[last.items.length - 1].text += '\n' + line;
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

export default function StatementBody({ text }: { text: string }) {
  return (
    <div className="space-y-5 text-[15px] sm:text-base text-gray-800 leading-7">
      {parse(text).map((b, i) =>
        b.kind === 'p' ? (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ) : b.kind === 'h' ? (
          <h3 key={i} className="pt-3 text-lg font-semibold text-gray-950">
            {b.text}
          </h3>
        ) : (
          <ol key={i} className="space-y-4">
            {b.items.map((it) => (
              <li key={it.n} className="flex gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-600 font-mono text-[13px] font-medium text-white"
                  aria-hidden="true"
                >
                  {it.n}
                </span>
                <span className="whitespace-pre-line">{it.text}</span>
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}
