// app/lib/uploads.ts — ไฟล์ที่ผู้ใช้อัปโหลดเก็บใน uploads/ (นอก public/) แล้วเสิร์ฟผ่าน /api/files
// ห้ามเขียนไฟล์ผู้ใช้ลง public/ — production ไม่เสิร์ฟไฟล์ที่เพิ่มหลัง build
import path from 'path';

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

// response error ของ route เสิร์ฟไฟล์ต้องใส่ — Cloudflare เติม max-age=14400 ให้ response ที่ไม่มี Cache-Control
// → browser จำ 404 ไว้ 4 ชม. (บทเรียนจาก stopdrinknetwork)
export const NO_STORE = { 'Cache-Control': 'no-store' };

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB ต่อไฟล์
