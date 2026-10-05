// scripts/seed-thaihealth-campaign.mjs — สร้าง/อัปเดตแคมเปญคัดค้านร่างแก้ไข พ.ร.บ. สสส. (ร่างแรก — แก้ต่อได้ในแดชบอร์ด)
// ใช้: node scripts/seed-thaihealth-campaign.mjs   (รันซ้ำได้ — อัปเดตเฉพาะข้อความ ไม่แตะรายชื่อ)
import { PrismaClient } from '@prisma/client';

const data = {
  slug: 'thaihealth',
  titleTh: 'แถลงการณ์คัดค้านร่าง พ.ร.บ. กองทุนสนับสนุนการสร้างเสริมสุขภาพ (ฉบับที่ ..) พ.ศ. .... — ปกป้องความเป็นอิสระของ สสส.',
  titleEn: 'Statement opposing the draft amendment to Thailand’s Health Promotion Foundation Act — protect the independence of ThaiHealth',
  summaryTh: `ร่างพระราชบัญญัติกองทุนสนับสนุนการสร้างเสริมสุขภาพ (ฉบับที่ ..) พ.ศ. .... เสนอโดยนายอนุทิน ชาญวีรกูล กับคณะ อยู่ระหว่างรับฟังความคิดเห็นตามมาตรา 77 ของรัฐธรรมนูญ ระหว่างวันที่ 30 กันยายน – 14 ตุลาคม 2569

สาระสำคัญคือยกเลิกเงินบำรุงกองทุนร้อยละ 2 จากภาษีสุราและยาสูบ ซึ่งเป็นแหล่งงบประมาณโดยตรงของ สสส. มาตั้งแต่ปี 2544 แล้วให้ได้รับ "เงินจากงบประมาณรายจ่ายประจำปี" และ "เงินอุดหนุนจากรัฐบาลตามความจำเป็น" แทน`,
  summaryEn: `A draft amendment to the Health Promotion Foundation Act, proposed by Mr. Anutin Charnvirakul and others, is open for public comment under Section 77 of the Thai Constitution from 30 September to 14 October 2026.

It would abolish the 2% surcharge on alcohol and tobacco excise taxes that has directly funded the Thai Health Promotion Foundation (ThaiHealth) since 2001, replacing it with annual budget appropriations and "government subsidies as necessary".`,
  statementTh: `พวกเรา องค์กรภาคประชาสังคม เครือข่าย และบุคคลทั้งในประเทศไทยและต่างประเทศ ที่ทำงานด้านการสร้างเสริมสุขภาพ ขอแสดงจุดยืนคัดค้านร่างพระราชบัญญัติกองทุนสนับสนุนการสร้างเสริมสุขภาพ (ฉบับที่ ..) พ.ศ. .... ซึ่งเสนอให้ยกเลิกเงินบำรุงกองทุนร้อยละ 2 ที่จัดเก็บจากภาษีสุราและยาสูบ (มาตรา 11–15 แห่งพระราชบัญญัติกองทุนสนับสนุนการสร้างเสริมสุขภาพ พ.ศ. 2544) ด้วยเหตุผลดังนี้

1. เงินบำรุงโดยตรงถูกออกแบบมาเพื่อให้งานสร้างเสริมสุขภาพเป็นอิสระจากการเมืองและกลุ่มผลประโยชน์ การเปลี่ยนไปพึ่งงบประมาณรายจ่ายประจำปีจะทำให้งานป้องกันปัญหาสุขภาพต้องผ่านการต่อรองทางการเมืองทุกปี และเปิดช่องให้ถูกแทรกแซงได้ตั้งแต่ขั้นจัดทำงบประมาณ

2. เงินบำรุงมาจากภาษีสินค้าที่ก่อให้เกิดอันตรายต่อสุขภาพ เพื่อนำกลับมาลดอันตรายนั้น ตามหลัก "ผู้ก่อปัญหาเป็นผู้จ่าย" และเป็นต้นแบบที่หลายประเทศนำไปศึกษา

3. สสส. มีกลไกตรวจสอบอยู่แล้ว ทั้งคณะกรรมการกองทุน การรายงานผลการดำเนินงานต่อสภาผู้แทนราษฎรและวุฒิสภาทุกปี และการตรวจสอบทั้งภายในและภายนอก หากมีข้อบกพร่องควรแก้ที่การบริหารจัดการ ไม่ใช่เปลี่ยนแหล่งที่มาของงบประมาณ

4. ร่างนี้กระทบภาคีที่ทำงานกับประชาชนโดยตรง ทั้งองค์กรพัฒนาเอกชน มูลนิธิ ชุมชน สถาบันการศึกษา โรงพยาบาล และองค์กรปกครองส่วนท้องถิ่น ซึ่งขับเคลื่อนงานลดปัจจัยเสี่ยงจากสุรา ยาสูบ และปัญหาสุขภาพอื่น ๆ มากว่า 20 ปี

5. การรับฟังความคิดเห็นออนไลน์เพียง 15 วัน ไม่เพียงพอสำหรับการเปลี่ยนหลักการสำคัญของระบบที่ใช้มากว่า 20 ปี

ข้อเรียกร้องของเรา
1. ขอให้ถอนร่างพระราชบัญญัติฉบับนี้ และคงบทบัญญัติมาตรา 11–15 ไว้ตามเดิม
2. หากรัฐบาลเห็นว่ามีปัญหาด้านวินัยการเงินการคลัง ขอให้เปิดเผยเหตุผลและข้อมูลประกอบต่อสาธารณะ และจัดการรับฟังความคิดเห็นอย่างกว้างขวางและมีส่วนร่วมอย่างแท้จริง
3. ขอให้คุ้มครองความเป็นอิสระของกองทุนที่มีภารกิจเฉพาะ รวมถึงไทยพีบีเอส กองทุนพัฒนากีฬาแห่งชาติ และกองทุนผู้สูงอายุ ซึ่งมีการเสนอร่างแก้ไขในทำนองเดียวกัน`,
  statementEn: `We, civil society organizations, networks and individuals in Thailand and around the world working in health promotion, oppose the draft amendment to the Health Promotion Foundation Act, which would abolish the 2% surcharge on alcohol and tobacco excise taxes (Sections 11–15 of the Health Promotion Foundation Act B.E. 2544 (2001)), for the following reasons:

1. Direct, earmarked funding was designed to keep health promotion independent from politics and vested interests. Moving to annual budget appropriations would subject prevention work to political bargaining every year and open the door to interference from the moment budgets are drafted.

2. The surcharge is levied on products that harm health and is used to reduce that harm — a "polluter pays" principle — and the model has been studied by many other countries.

3. ThaiHealth is already accountable: through its governing board, annual reports to the House of Representatives and the Senate, and internal and external audits. Any shortcomings should be fixed through governance, not by changing the source of funding.

4. The draft directly affects partners who work with communities — NGOs, foundations, community groups, academic institutions, hospitals and local governments — that have reduced risks from alcohol, tobacco and other health problems for more than 20 years.

5. A 15-day online consultation is not enough to change a core principle of a system that has operated for more than two decades.

Our demands
1. Withdraw this draft and keep Sections 11–15 as they are.
2. If the government believes there is a fiscal-discipline problem, publish its reasoning and supporting evidence, and hold a broad and genuinely participatory consultation.
3. Protect the independence of other dedicated funds — Thai PBS, the National Sports Development Fund and the Older Persons Fund — which face similar proposed amendments.`,
  officialUrl: 'https://www.parliament.go.th/section77/survey_detail.php?id=632',
  // ปิดรับ 13 ต.ค. 2569 23:59:59 เวลาไทย (ก่อนรัฐสภาปิด 1 วัน เผื่อพิมพ์/ยื่น) · รัฐสภาปิดรับฟัง 14 ต.ค. 23:59:59
  closesAt: new Date('2026-10-13T23:59:59+07:00'),
  officialClosesAt: new Date('2026-10-14T23:59:59+07:00'),
  // ปกตามแบบที่เครือข่ายเสนอ (5 ต.ค. 2569) — ไม่ใส่โลโก้ สสส. (ตกลงกันแล้วว่าไม่ใช้โลโก้หน่วยงาน)
  heroTitleEn: "Save Thailand's Earmarked Tax!",
  heroSubtitleEn: 'Save Thai Health Promotion Foundation',
  heroQuoteEn: "Keep It, Don't Kill It: Thailand's Global Health Model.",
  heroTitleTh: 'ปกป้องภาษีบาปเพื่อสุขภาพคนไทย!',
  heroSubtitleTh: 'ปกป้องกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)',
  heroQuoteTh: 'รักษาไว้ อย่าทำลาย: ต้นแบบสุขภาพของไทยในเวทีโลก',
};

const prisma = new PrismaClient();
try {
  const c = await prisma.campaign.upsert({ where: { slug: data.slug }, update: data, create: data });
  console.log(`✓ แคมเปญ #${c.id} /c/${c.slug}`);
} finally {
  await prisma.$disconnect();
}
