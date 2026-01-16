import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Copy,
  CheckCircle2,
  Search,
  Presentation,
  Mail,
  Link as LinkIcon
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import EmptyState from '@/components/ui/EmptyState';

export default function PartnerResources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partner } = useQuery({
    queryKey: ['currentPartner', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const partners = await base44.entities.Partner.filter({ user_id: user.email });
      return partners[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['partnerResources'],
    queryFn: () => base44.entities.Document.filter({ is_public: true }, '-created_date'),
  });

  // Generate referral link
  const referralLink = partner?.id ? `https://mainermedia.com/ref/${partner.id}` : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredResources = resources.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group resources by category
  const groupedResources = filteredResources.reduce((acc, resource) => {
    const category = resource.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(resource);
    return acc;
  }, {});

  const categoryIcons = {
    'Resource': BookOpen,
    'Contract': FileText,
    'Brand Asset': Presentation,
    'Report': FileText,
    'Other': FileText
  };

  // Sample email templates
  const emailTemplates = [
    {
      name: 'Initial Outreach',
      subject: 'Transform Your Digital Presence with MAINERMEDIA',
      preview: 'Hi [Name], I wanted to introduce you to MAINERMEDIA...'
    },
    {
      name: 'Follow-up Email',
      subject: 'Following up on our conversation',
      preview: 'Hi [Name], I wanted to follow up on our recent conversation about...'
    },
    {
      name: 'Case Study Share',
      subject: 'See how [Company] achieved 300% growth',
      preview: 'Hi [Name], I thought you might be interested in seeing how...'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Resources</h1>
        <p className="text-gray-500 mt-1">Sales materials and tools to help you succeed</p>
      </div>

      {/* Referral Link */}
      <Panel title="Your Referral Link" accent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 p-4 bg-[#0E1116] rounded-sm border border-white/[0.08]">
              <LinkIcon className="w-5 h-5 text-emerald-500" />
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
            </div>
          </div>
          <PrimaryButton onClick={copyReferralLink} icon={copiedLink ? CheckCircle2 : Copy}>
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </PrimaryButton>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Share this link with potential clients. When they sign up through this link, you'll automatically be credited for the referral.
        </p>
      </Panel>

      {/* Search */}
      <InputField
        placeholder="Search resources..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Templates */}
        <Panel title="Email Templates">
          <div className="space-y-3">
            {emailTemplates.map((template, i) => (
              <div 
                key={i}
                className="p-4 bg-[#0E1116] rounded-sm border border-white/[0.05] hover:border-emerald-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{template.subject}</p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{template.preview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Sales Collateral */}
        <div className="lg:col-span-2">
          {Object.keys(groupedResources).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedResources).map(([category, docs]) => {
                const CategoryIcon = categoryIcons[category] || FileText;
                return (
                  <Panel key={category} title={category}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {docs.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-4 p-4 bg-[#0E1116] rounded-sm border border-white/[0.05] hover:border-emerald-500/30 transition-all"
                        >
                          <div className="w-12 h-12 rounded-sm bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                            <CategoryIcon className="w-6 h-6 text-gray-500 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                                {doc.name}
                              </h3>
                              <Download className="w-4 h-4 text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{doc.file_type}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </Panel>
                );
              })}
            </div>
          ) : (
            <Panel>
              <EmptyState
                icon={BookOpen}
                title="No resources available"
                description={searchTerm 
                  ? "Try adjusting your search" 
                  : "Sales materials will be added here soon"
                }
              />
            </Panel>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <Panel title="Sales Tips">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Know Your Audience',
              description: 'Understand the prospect\'s industry and challenges before reaching out.'
            },
            {
              title: 'Lead with Value',
              description: 'Share relevant case studies and results before pitching services.'
            },
            {
              title: 'Follow Up Consistently',
              description: 'Most deals close after 5+ touchpoints. Be persistent but not pushy.'
            }
          ].map((tip, i) => (
            <div key={i} className="p-4 bg-[#0E1116] rounded-sm border-l-2 border-emerald-500">
              <h4 className="text-white font-medium text-sm">{tip.title}</h4>
              <p className="text-xs text-gray-500 mt-2">{tip.description}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}