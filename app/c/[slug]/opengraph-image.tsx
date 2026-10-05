// app/c/[slug]/opengraph-image.tsx — ภาพตัวอย่างเวลาแชร์ลิงก์ (LINE / Facebook / X) 1200×630
// โทนเดียวกับปก: พื้นส้ม + แผนที่ halftone + พาดหัว + ตัวนับ · ภาษาอังกฤษ (ภาษาเริ่มต้น — บอท preview ไม่มี cookie)
// ฟอนต์อ่านจาก fontsource ในเครื่อง (woff — ตัวสร้างภาพไม่รองรับ woff2) ไม่ดึงจากเน็ต
import { ImageResponse } from 'next/og';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/app/lib/db';
import { localizeCampaign } from '@/app/lib/campaign';
import { getDictionaryFor } from '@/app/i18n/dictionaries';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Protect ThaiHealth';

const font = (pkg: string, file: string) => fs.readFile(path.join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  const t = getDictionaryFor('en');
  const l = campaign ? localizeCampaign(campaign, 'en') : null;
  const [count, orgs, countries, map, bold, semi, mono] = await Promise.all([
    campaign ? prisma.signature.count({ where: { campaignId: campaign.id } }) : 0,
    campaign
      ? prisma.signature.groupBy({ by: ['organization'], where: { campaignId: campaign.id, signingAs: 'ORGANIZATION' } }).then((r) => r.length)
      : 0,
    campaign ? prisma.signature.groupBy({ by: ['country'], where: { campaignId: campaign.id } }).then((r) => r.length) : 0,
    fs.readFile(path.join(process.cwd(), 'public/maps/thailand-halftone.svg'), 'utf8'),
    font('ibm-plex-sans-thai', 'ibm-plex-sans-thai-latin-700-normal.woff'),
    font('ibm-plex-sans-thai', 'ibm-plex-sans-thai-latin-600-normal.woff'),
    font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff'),
  ]);
  // ภาพนิ่งไม่ต้องมีแอนิเมชันคลื่น — ตัดบล็อก <style> ออกให้วงแหวนไม่ค้างกลางทาง
  const mapUri = `data:image/svg+xml;base64,${Buffer.from(map.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<circle class="r[^"]*"[^>]*\/>/g, '')).toString('base64')}`;

  const title = l?.hero?.title ?? l?.title ?? 'Protect ThaiHealth';
  const stats = [t.campaign.signers(count), orgs > 0 ? t.campaign.organizationsCount(orgs) : null, countries > 0 ? t.campaign.countries(countries) : null]
    .filter(Boolean)
    .join(' · ');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ea580c', position: 'relative', fontFamily: 'Plex' }}>
        {/* แผนที่ชิดขวา ไทยอยู่ครึ่งขวาของภาพ */}
        <img src={mapUri} alt="" width={720} height={821} style={{ position: 'absolute', right: -80, top: -120 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 72px', width: 760, color: '#030712' }}>
          <div style={{ fontFamily: 'Mono', fontSize: 24, opacity: 0.8 }}>Protect ThaiHealth</div>
          <div style={{ marginTop: 22, fontSize: 64, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{title}</div>
          {l?.hero?.subtitle && <div style={{ marginTop: 18, fontSize: 30, fontWeight: 600, opacity: 0.85 }}>{l.hero.subtitle}</div>}
          {l?.hero?.quote && <div style={{ marginTop: 18, fontSize: 26, fontWeight: 600 }}>{`“${l.hero.quote}”`}</div>}
          <div style={{ display: 'flex', marginTop: 34, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexShrink: 0, whiteSpace: 'nowrap', background: '#030712', color: '#fff', borderRadius: 12, padding: '14px 26px', fontSize: 26, fontWeight: 700 }}>
              {t.campaign.signNow}
            </div>
            <div style={{ marginLeft: 22, fontFamily: 'Mono', fontSize: 22, opacity: 0.85 }}>{stats}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Plex', data: bold, weight: 700, style: 'normal' },
        { name: 'Plex', data: semi, weight: 600, style: 'normal' },
        { name: 'Mono', data: mono, weight: 500, style: 'normal' },
      ],
    }
  );
}
