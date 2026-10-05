// app/lib/roles.ts — สิทธิ์ตาม role (member/admin/superadmin/pending)
export const ADMIN_ROLES = ['admin', 'superadmin'] as const;

export const isAdminRole = (role: string | undefined) => role === 'admin' || role === 'superadmin';
// อนุมัติแล้ว (ไม่ใช่ pending) — เห็นข้อมูลภายในได้
export const isStaffRole = (role: string | undefined) => role === 'member' || isAdminRole(role);

// ชื่อ role ที่แสดงบนหน้าจออยู่ใน dictionary: t.roles[role]
