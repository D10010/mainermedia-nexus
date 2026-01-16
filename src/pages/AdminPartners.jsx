import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Users,
  Plus,
  Search,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Edit2
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminPartners() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const [newPartner, setNewPartner] = useState({
    email: '',
    company_name: '',
    commission_rate: 10,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list('-created_date'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data) => {
      await base44.users.inviteUser(data.email, 'user');
      await base44.entities.Partner.create({
        user_id: data.email,
        company_name: data.company_name,
        commission_rate: data.commission_rate,
        status: 'Approved',
        approved_at: new Date().toISOString(),
        total_earnings: 0,
        available_balance: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPartners']);
      setShowAddPartner(false);
      setNewPartner({ email: '', company_name: '', commission_rate: 10 });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Partner.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allPartners']);
      setShowEditModal(false);
      setSelectedPartner(null);
    },
  });

  const approvePartnerMutation = useMutation({
    mutationFn: (id) => base44.entities.Partner.update(id, { 
      status: 'Approved', 
      approved_at: new Date().toISOString() 
    }),
    onSuccess: () => queryClient.invalidateQueries(['allPartners']),
  });

  const rejectPartnerMutation = useMutation({
    mutationFn: (id) => base44.entities.Partner.update(id, { status: 'Rejected' }),
    onSuccess: () => queryClient.invalidateQueries(['allPartners']),
  });

  const statuses = ['all', 'Pending', 'Approved', 'Rejected', 'Suspended'];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPartnerLeads = (partnerId) => leads.filter(l => l.partner_id === partnerId);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      key: 'company_name',
      label: 'Partner',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500 font-medium">
              {row.company_name?.[0]?.toUpperCase() || 'P'}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{row.company_name}</p>
            <p className="text-xs text-gray-500">{row.user_id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'commission_rate',
      label: 'Rate',
      render: (row) => (
        <span className="text-emerald-400 font-mono">{row.commission_rate || 10}%</span>
      )
    },
    {
      key: 'leads',
      label: 'Leads',
      render: (row) => {
        const partnerLeads = getPartnerLeads(row.id);
        const wonLeads = partnerLeads.filter(l => l.status === 'Won').length;
        return (
          <span className="text-gray-400">
            {partnerLeads.length} total / {wonLeads} won
          </span>
        );
      }
    },
    {
      key: 'total_earnings',
      label: 'Earnings',
      render: (row) => (
        <span className="text-white font-mono">{formatCurrency(row.total_earnings || 0)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="small" />
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Pending' && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); approvePartnerMutation.mutate(row.id); }}
                className="p-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); rejectPartnerMutation.mutate(row.id); }}
                className="p-2 text-red-500 hover:text-red-400 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedPartner(row); setShowEditModal(true); }}
            className="p-2 text-gray-500 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Partners</h1>
          <p className="text-gray-500 mt-1">Manage your referral partners</p>
        </div>
        <PrimaryButton onClick={() => setShowAddPartner(true)} icon={Plus}>
          Add Partner
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <InputField
            placeholder="Search partners..."
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

      {/* Pending Applications Alert */}
      {partners.filter(p => p.status === 'Pending').length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-mono text-sm">
              {partners.filter(p => p.status === 'Pending').length}
            </span>
          </div>
          <span className="text-amber-400">Partner applications pending review</span>
        </div>
      )}

      {/* Partner Table */}
      <Panel noPadding>
        {filteredPartners.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredPartners}
            onRowClick={(row) => { setSelectedPartner(row); setShowEditModal(true); }}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No partners found"
              description={searchTerm || statusFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "Add your first partner to get started"
              }
              actionLabel="Add Partner"
              onAction={() => setShowAddPartner(true)}
            />
          </div>
        )}
      </Panel>

      {/* Add Partner Modal */}
      <Modal
        isOpen={showAddPartner}
        onClose={() => setShowAddPartner(false)}
        title="Add New Partner"
      >
        <form onSubmit={(e) => { e.preventDefault(); createPartnerMutation.mutate(newPartner); }} className="space-y-6">
          <InputField
            label="Email"
            type="email"
            value={newPartner.email}
            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
            required
            placeholder="partner@company.com"
            icon={Mail}
          />
          <InputField
            label="Company Name"
            value={newPartner.company_name}
            onChange={(e) => setNewPartner({ ...newPartner, company_name: e.target.value })}
            required
            placeholder="Partner Company"
            icon={Building2}
          />
          <InputField
            label="Commission Rate (%)"
            type="number"
            min="1"
            max="50"
            value={newPartner.commission_rate}
            onChange={(e) => setNewPartner({ ...newPartner, commission_rate: parseInt(e.target.value) })}
            icon={DollarSign}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowAddPartner(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createPartnerMutation.isPending}
              disabled={!newPartner.email || !newPartner.company_name}
            >
              Send Invite
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Partner Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedPartner(null); }}
        title="Edit Partner"
        size="large"
      >
        {selectedPartner && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name"
                value={selectedPartner.company_name || ''}
                onChange={(e) => setSelectedPartner({ ...selectedPartner, company_name: e.target.value })}
                icon={Building2}
              />
              <InputField
                label="Commission Rate (%)"
                type="number"
                min="1"
                max="50"
                value={selectedPartner.commission_rate || 10}
                onChange={(e) => setSelectedPartner({ ...selectedPartner, commission_rate: parseInt(e.target.value) })}
                icon={DollarSign}
              />
              <SelectField
                label="Status"
                value={selectedPartner.status || 'Pending'}
                onChange={(e) => setSelectedPartner({ ...selectedPartner, status: e.target.value })}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                  { value: 'Suspended', label: 'Suspended' },
                ]}
              />
              <InputField
                label="Payment Method"
                value={selectedPartner.payment_method || ''}
                onChange={(e) => setSelectedPartner({ ...selectedPartner, payment_method: e.target.value })}
                disabled
              />
            </div>

            {/* Partner Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
              <div className="p-4 bg-[#0E1116] rounded-sm">
                <p className="text-[10px] font-mono text-gray-500 uppercase">Total Leads</p>
                <p className="text-xl font-light text-white mt-1">{getPartnerLeads(selectedPartner.id).length}</p>
              </div>
              <div className="p-4 bg-[#0E1116] rounded-sm">
                <p className="text-[10px] font-mono text-gray-500 uppercase">Conversions</p>
                <p className="text-xl font-light text-emerald-400 mt-1">
                  {getPartnerLeads(selectedPartner.id).filter(l => l.status === 'Won').length}
                </p>
              </div>
              <div className="p-4 bg-[#0E1116] rounded-sm">
                <p className="text-[10px] font-mono text-gray-500 uppercase">Total Earnings</p>
                <p className="text-xl font-light text-white mt-1">{formatCurrency(selectedPartner.total_earnings || 0)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <PrimaryButton variant="secondary" onClick={() => { setShowEditModal(false); setSelectedPartner(null); }}>
                Cancel
              </PrimaryButton>
              <PrimaryButton 
                onClick={() => updatePartnerMutation.mutate({ 
                  id: selectedPartner.id, 
                  data: {
                    company_name: selectedPartner.company_name,
                    commission_rate: selectedPartner.commission_rate,
                    status: selectedPartner.status,
                  }
                })}
                loading={updatePartnerMutation.isPending}
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