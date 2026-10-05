// app/lib/audit.ts — บันทึก audit log (ใคร แก้อะไร เมื่อไหร่) ใช้ร่วมทุกโมดูลผ่าน entityType
import prisma from '@/app/lib/db';

export interface FieldChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

const asText = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
};

// เทียบค่าเก่า-ใหม่ตามรายการฟิลด์ที่ติดตาม คืนเฉพาะฟิลด์ที่เปลี่ยนจริง
export function diffFields(
  tracked: { field: string; label: string }[],
  before: Record<string, unknown>,
  after: Record<string, unknown>
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const { field, label } of tracked) {
    const from = asText(before[field]);
    const to = asText(after[field]);
    if (from !== to) changes.push({ field, label, from, to });
  }
  return changes;
}

export async function writeAuditLog(params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: number;
  entityName: string;
  userId: number;
  changes?: (FieldChange | string)[]; // string = โน้ตอิสระ
}) {
  const { action, entityType, entityId, entityName, userId, changes } = params;
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        userId,
        changes: changes && changes.length > 0 ? JSON.stringify(changes) : null,
      },
    });
  } catch (error) {
    // audit ต้องไม่ทำให้การทำงานหลักล้มเหลว — log ไว้แล้วปล่อยผ่าน
    console.error('writeAuditLog failed:', error);
  }
}

// แปลง changes ที่เก็บเป็น JSON string กลับเป็น object (ทนต่อข้อมูลเสีย)
export function parseChanges(raw: string | null): (FieldChange | string)[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
