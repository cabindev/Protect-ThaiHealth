import { getDict } from '@/app/i18n/server';
import CampaignForm from '../CampaignForm';

export default async function NewCampaignPage() {
  const t = await getDict();
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t.adminCampaigns.newCampaign}</h1>
      <CampaignForm
        initial={{ slug: '', titleTh: '', titleEn: '', summaryTh: '', summaryEn: '', statementTh: '', statementEn: '', officialUrl: '', heroTitleTh: '', heroTitleEn: '', heroSubtitleTh: '', heroSubtitleEn: '', heroQuoteTh: '', heroQuoteEn: '', closesAt: '', officialClosesAt: '', isOpen: true, showSigners: true }}
      />
    </div>
  );
}
