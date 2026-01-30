import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Target,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  Globe,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import TextAreaField from '@/components/ui/TextAreaField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

export default function PartnerLeads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewLead, setShowNewLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const queryClient = useQueryClient();

  // Check URL for new lead param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setShowNewLead(true);
    }
  }, []);

  const [newLead, setNewLead] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    website: '',
    budget_range: '',
    service_interest: '',
    notes: '',
  });

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

  const { data: leads = [] } = useQuery({
    queryKey: ['partnerLeads', partner?.id],
    queryFn: () => base44.entities.Lead.filter({ partner_id: partner.id }, '-created_date'),
    enabled: !!partner?.id,
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create({
      ...data,
      partner_id: partner.id,
      status: 'Submitted',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerLeads']);
      setShowNewLead(false);
      setNewLead({
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        company_name: '',
        website: '',
        budget_range: '',
        service_interest: '',
        notes: '',
      });
    },
  });

  const statuses = ['all', 'Submitted', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
  
  const budgetOptions = [
    { value: 'Under $5K', label: 'Under $5K' },
    { value: '$5K - $10K', label: '$5K - $10K' },
    { value: '$10K - $25K', label: '$10K - $25K' },
    { value: '$25K - $50K', label: '$25K - $50K' },
    { value: '$50K - $100K', label: '$50K - $100K' },
    { value: '$100K+', label: '$100K+' },
  ];

  const serviceOptions = [
    { value: 'Branding', label: 'Branding' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Content Marketing', label: 'Content Marketing' },
    { value: 'SEO', label: 'SEO' },
    { value: 'Paid Advertising', label: 'Paid Advertising' },
    { value: 'Full Service', label: 'Full Service' },
    { value: 'Other', label: 'Other' },
  ];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitLead = (e) => {
    e.preventDefault();
    createLeadMutation.mutate(newLead);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Lead Management</h1>
          <p className="text-gray-500 mt-1">Submit and track your referral leads</p>
        </div>
        <PrimaryButton onClick={() => setShowNewLead(true)} icon={Plus}>
          Submit New Lead
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <InputField
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-3 py-2 text-[10px] font-mono uppercase tracking-wider rounded-sm whitespace-nowrap
                transition-all duration-200
                ${statusFilter === status
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#12161D] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                }
              `}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="lg:col-span-1 space-y-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`
                p-4 bg-[#12161D] border rounded-sm cursor-pointer transition-all duration-200
                ${selectedLead?.id === lead.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{lead.contact_name}</h3>
                  <p className="text-sm text-gray-500">{lead.company_name}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${selectedLead?.id === lead.id ? 'rotate-90' : ''}`} />
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={lead.status} size="small" />
                <span className="text-[10px] font-mono text-gray-600">
                  {format(new Date(lead.created_date), 'MMM d')}
                </span>
              </div>

              {lead.status === 'Won' && lead.commission_amount && (
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-mono text-emerald-400">
                    ${lead.commission_amount.toLocaleString()} earned
                  </span>
                </div>
              )}
            </div>
          ))}

          {filteredLeads.length === 0 && (
            <Panel>
              <EmptyState
                icon={Target}
                title="No leads found"
                description={searchTerm || statusFilter !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Submit your first lead to start earning"
                }
                actionLabel="Submit Lead"
                onAction={() => setShowNewLead(true)}
              />
            </Panel>
          )}
        </div>

        {/* Lead Details */}
        <div className="lg:col-span-2">
          {selectedLead ? (
            <Panel title="Lead Details" accent>
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <StatusBadge status={selectedLead.status} pulse={selectedLead.status === 'Contacted'} />
                  <span className="text-[10px] font-mono text-gray-500">
                    Submitted {format(new Date(selectedLead.created_date), 'MMMM d, yyyy')}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0E1116] rounded-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Company</span>
                    </div>
                    <p className="text-white">{selectedLead.company_name}</p>
                    {selectedLead.website && (
                      <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline">
                        {selectedLead.website}
                      </a>
                    )}
                  </div>
                  
                  <div className="p-4 bg-[#0E1116] rounded-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Contact</span>
                    </div>
                    <p className="text-white">{selectedLead.contact_name}</p>
                    <p className="text-sm text-gray-400">{selectedLead.contact_email}</p>
                    {selectedLead.contact_phone && (
                      <p className="text-sm text-gray-400">{selectedLead.contact_phone}</p>
                    )}
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Service Interest</span>
                    <p className="text-white mt-1">{selectedLead.service_interest || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Budget Range</span>
                    <p className="text-white mt-1">{selectedLead.budget_range || '—'}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Notes</span>
                    <p className="text-gray-300 mt-2 whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Commission (if won) */}
                {selectedLead.status === 'Won' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-500 uppercase">Commission Earned</span>
                        <p className="text-2xl font-light text-emerald-400 mt-1">
                          ${selectedLead.commission_amount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-emerald-500/30" />
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            <Panel>
              <EmptyState
                icon={Target}
                title="Select a lead"
                description="Choose a lead from the list to view details"
              />
            </Panel>
          )}
        </div>
      </div>

      {/* New Lead Modal */}
      <Modal
        isOpen={showNewLead}
        onClose={() => setShowNewLead(false)}
        title="Submit New Lead"
        size="large"
      >
        <form onSubmit={handleSubmitLead} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Contact Name"
              value={newLead.contact_name}
              onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
              required
              placeholder="John Smith"
            />
            <InputField
              label="Contact Email"
              type="email"
              value={newLead.contact_email}
              onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
              required
              placeholder="john@company.com"
            />
            <InputField
              label="Contact Phone"
              value={newLead.contact_phone}
              onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
            <InputField
              label="Company Name"
              value={newLead.company_name}
              onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
              required
              placeholder="Acme Inc."
            />
            <InputField
              label="Website"
              value={newLead.website}
              onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
              placeholder="https://example.com"
            />
            <SelectField
              label="Estimated Budget"
              value={newLead.budget_range}
              onChange={(e) => setNewLead({ ...newLead, budget_range: e.target.value })}
              options={budgetOptions}
              placeholder="Select budget range"
            />
            <div className="md:col-span-2">
              <SelectField
                label="Service Interest"
                value={newLead.service_interest}
                onChange={(e) => setNewLead({ ...newLead, service_interest: e.target.value })}
                options={serviceOptions}
                placeholder="Select service"
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Notes / Context"
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Any additional context about the lead..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowNewLead(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createLeadMutation.isPending}
              disabled={!newLead.contact_name || !newLead.contact_email || !newLead.company_name}
            >
              Submit Lead
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}