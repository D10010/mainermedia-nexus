import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Target,
  Search,
  Mail,
  Phone,
  Building2,
  Globe,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminLeads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allLeads']);
      setShowDetailModal(false);
      setSelectedLead(null);
    },
  });

  const statuses = ['Submitted', 'Contacted', 'Audit Scheduled', 'Audit Completed', 'Proposal Sent', 'Won', 'Lost'];
  
  const statusColors = {
    Submitted: 'bg-gray-500',
    Contacted: 'bg-blue-500',
    'Audit Scheduled': 'bg-purple-500',
    'Audit Completed': 'bg-amber-500',
    'Proposal Sent': 'bg-orange-500',
    Won: 'bg-emerald-500',
    Lost: 'bg-red-500',
  };

  const getPartnerName = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.company_name || 'Unknown';
  };

  const filteredLeads = leads.filter(lead =>
    lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group leads by status for Kanban view
  const leadsByStatus = statuses.reduce((acc, status) => {
    acc[status] = filteredLeads.filter(l => l.status === status);
    return acc;
  }, {});

  const moveLeadToStatus = (leadId, newStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      updateLeadMutation.mutate({ 
        id: leadId, 
        data: { status: newStatus }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Lead Pipeline</h1>
          <p className="text-gray-500 mt-1">Manage and track all partner referrals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-mono">{leads.length}</span> total leads
          </div>
        </div>
      </div>

      {/* Search */}
      <InputField
        placeholder="Search leads..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
      />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
        {statuses.map((status) => (
          <div key={status} className="min-w-[250px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">{status}</span>
              <span className="ml-auto text-[11px] font-mono text-gray-600">{leadsByStatus[status]?.length || 0}</span>
            </div>
            
            <div className="space-y-3">
              {leadsByStatus[status]?.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                  className="p-4 bg-[#12161D] border border-white/[0.08] rounded-sm cursor-pointer hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium text-sm">{lead.company_name}</h4>
                    {lead.budget_range && (
                      <span className="text-[10px] font-mono text-emerald-400">{lead.budget_range}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{lead.contact_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600">{getPartnerName(lead.partner_id)}</span>
                    <span className="text-[10px] font-mono text-gray-600">
                      {format(new Date(lead.created_date), 'MMM d')}
                    </span>
                  </div>
                  
                  {status !== 'Won' && status !== 'Lost' && (
                    <div className="flex gap-1 mt-3 pt-3 border-t border-white/[0.05]">
                      {statuses.slice(statuses.indexOf(status) + 1, statuses.indexOf(status) + 3).map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={(e) => { e.stopPropagation(); moveLeadToStatus(lead.id, nextStatus); }}
                          className="flex-1 text-[9px] font-mono uppercase py-1 px-2 bg-gray-800 text-gray-400 rounded-sm hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                        >
                          → {nextStatus.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {leadsByStatus[status]?.length === 0 && (
                <div className="p-4 border border-dashed border-white/[0.08] rounded-sm text-center">
                  <p className="text-xs text-gray-600">No leads</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lead Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedLead(null); }}
        title="Lead Details"
        size="large"
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedLead.status} />
              <span className="text-[10px] font-mono text-gray-500">
                From: {getPartnerName(selectedLead.partner_id)}
              </span>
            </div>

            {/* Contact & Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0E1116] rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">Company</span>
                </div>
                <p className="text-white font-medium">{selectedLead.company_name}</p>
                {selectedLead.website && (
                  <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline">
                    {selectedLead.website}
                  </a>
                )}
              </div>
              
              <div className="p-4 bg-[#0E1116] rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">Contact</span>
                </div>
                <p className="text-white font-medium">{selectedLead.contact_name}</p>
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

            {/* Update Status */}
            <div className="pt-4 border-t border-white/[0.08]">
              <SelectField
                label="Update Status"
                value={selectedLead.status}
                onChange={(e) => setSelectedLead({ ...selectedLead, status: e.target.value })}
                options={statuses.map(s => ({ value: s, label: s }))}
              />
              
              {selectedLead.status === 'Audit Completed' && (
                <div className="mt-4 space-y-4">
                  <InputField
                    label="Audit Completed Date"
                    type="date"
                    value={selectedLead.audit_completed_date || ''}
                    onChange={(e) => setSelectedLead({ ...selectedLead, audit_completed_date: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedLead({ ...selectedLead, audit_commission_paid: !selectedLead.audit_commission_paid })}
                      className={`
                        w-12 h-6 rounded-full transition-colors relative
                        ${selectedLead.audit_commission_paid ? 'bg-emerald-500' : 'bg-gray-700'}
                      `}
                    >
                      <div className={`
                        w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform
                        ${selectedLead.audit_commission_paid ? 'translate-x-6' : 'translate-x-0.5'}
                      `} />
                    </button>
                    <span className="text-sm text-gray-400">$500 Audit commission paid</span>
                  </div>
                </div>
              )}
              
              {selectedLead.status === 'Won' && (
                <div className="mt-4 space-y-4">
                  <SelectField
                    label="Service Option"
                    value={selectedLead.conversion_option || 'None'}
                    onChange={(e) => setSelectedLead({ ...selectedLead, conversion_option: e.target.value })}
                    options={[
                      { value: 'None', label: 'Select Option' },
                      { value: 'Option 1 - Independent', label: 'Option 1 - Independent Implementation' },
                      { value: 'Option 2 - Strategic Consulting', label: 'Option 2 - Strategic Consulting ($5k-$10k/mo)' },
                      { value: 'Option 3 - Full-Service', label: 'Option 3 - Full-Service Execution ($10k-$25k/mo)' },
                    ]}
                  />
                  
                  {(selectedLead.conversion_option === 'Option 2 - Strategic Consulting' || selectedLead.conversion_option === 'Option 3 - Full-Service') && (
                    <>
                      <InputField
                        label="Conversion Date"
                        type="date"
                        value={selectedLead.conversion_date || ''}
                        onChange={(e) => setSelectedLead({ ...selectedLead, conversion_date: e.target.value })}
                      />
                      <InputField
                        label="Monthly Retainer"
                        type="number"
                        value={selectedLead.monthly_retainer || ''}
                        onChange={(e) => setSelectedLead({ ...selectedLead, monthly_retainer: parseFloat(e.target.value) })}
                        icon={DollarSign}
                        placeholder="Enter monthly retainer amount"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedLead({ ...selectedLead, retention_commission_active: !selectedLead.retention_commission_active })}
                          className={`
                            w-12 h-6 rounded-full transition-colors relative
                            ${selectedLead.retention_commission_active ? 'bg-emerald-500' : 'bg-gray-700'}
                          `}
                        >
                          <div className={`
                            w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform
                            ${selectedLead.retention_commission_active ? 'translate-x-6' : 'translate-x-0.5'}
                          `} />
                        </button>
                        <div>
                          <span className="text-sm text-gray-400">5% retention commission active</span>
                          <p className="text-xs text-gray-600 mt-0.5">Only if converted within 30 days of audit</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <PrimaryButton variant="secondary" onClick={() => { setShowDetailModal(false); setSelectedLead(null); }}>
                Cancel
              </PrimaryButton>
              <PrimaryButton 
                onClick={() => updateLeadMutation.mutate({ 
                  id: selectedLead.id, 
                  data: {
                    status: selectedLead.status,
                    audit_completed_date: selectedLead.audit_completed_date,
                    audit_commission_paid: selectedLead.audit_commission_paid,
                    conversion_option: selectedLead.conversion_option,
                    conversion_date: selectedLead.conversion_date,
                    monthly_retainer: selectedLead.monthly_retainer,
                    retention_commission_active: selectedLead.retention_commission_active,
                  }
                })}
                loading={updateLeadMutation.isPending}
              >
                Save Changes
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}