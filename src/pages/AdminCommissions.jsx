import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  DollarSign,
  Search,
  TrendingUp,
  FileText,
  Calendar,
  Building2,
  CheckCircle2
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/MetricCard';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AdminCommissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const queryClient = useQueryClient();

  const [newCommission, setNewCommission] = useState({
    partner_id: '',
    lead_id: '',
    client_id: '',
    type: 'Audit',
    amount: '',
    period: '',
    status: 'Pending',
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['allCommissions'],
    queryFn: () => base44.entities.Commission.list('-created_date'),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const createCommissionMutation = useMutation({
    mutationFn: (data) => base44.entities.Commission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCommissions']);
      setShowRecordModal(false);
      setNewCommission({ partner_id: '', lead_id: '', client_id: '', type: 'Audit', amount: '', period: '', status: 'Pending' });
    },
  });

  const approveCommissionMutation = useMutation({
    mutationFn: (id) => base44.entities.Commission.update(id, { status: 'Approved' }),
    onSuccess: () => queryClient.invalidateQueries(['allCommissions']),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id) => {
      const commission = commissions.find(c => c.id === id);
      await base44.entities.Commission.update(id, { 
        status: 'Paid',
        paid_date: new Date().toISOString().split('T')[0]
      });
      
      // Update partner totals
      if (commission) {
        const partner = partners.find(p => p.id === commission.partner_id);
        if (partner) {
          const field = commission.type === 'Audit' ? 'total_audit_commissions' : 'total_retention_commissions';
          await base44.entities.Partner.update(partner.id, {
            [field]: (partner[field] || 0) + commission.amount,
            available_balance: (partner.available_balance || 0) + commission.amount
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCommissions']);
      queryClient.invalidateQueries(['allPartners']);
    },
  });

  const getPartnerName = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.company_name || 'Unknown';
  };

  const getLeadInfo = (leadId) => {
    return leads.find(l => l.id === leadId);
  };

  const getClientInfo = (clientId) => {
    return clients.find(c => c.id === clientId);
  };

  const filteredCommissions = commissions.filter(commission => {
    const partner = partners.find(p => p.id === commission.partner_id);
    const matchesSearch = partner?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || commission.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate metrics
  const totalAuditCommissions = commissions
    .filter(c => c.type === 'Audit' && c.status === 'Paid')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const totalRetentionCommissions = commissions
    .filter(c => c.type === 'Retention' && c.status === 'Paid')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const pendingCommissions = commissions
    .filter(c => c.status === 'Pending' || c.status === 'Approved')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCommissions = commissions
    .filter(c => c.status === 'Paid' && c.paid_date && c.paid_date.startsWith(currentMonth))
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const columns = [
    {
      key: 'partner',
      label: 'Partner',
      render: (row) => {
        const partner = partners.find(p => p.id === row.partner_id);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-500 font-medium">
                {partner?.company_name?.[0]?.toUpperCase() || 'P'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{partner?.company_name}</p>
              {row.lead_id && (
                <p className="text-xs text-gray-500">
                  {getLeadInfo(row.lead_id)?.company_name || 'Lead'}
                </p>
              )}
              {row.client_id && (
                <p className="text-xs text-gray-500">
                  {getClientInfo(row.client_id)?.company_name || 'Client'}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <div>
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider
            ${row.type === 'Audit' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}
          `}>
            {row.type === 'Audit' ? '$500 Audit' : '5% Retention'}
          </span>
          {row.period && (
            <p className="text-xs text-gray-500 mt-1">{row.period}</p>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-lg font-light text-white">{formatCurrency(row.amount)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'paid_date',
      label: 'Date',
      render: (row) => (
        <span className="text-xs font-mono text-gray-500">
          {row.paid_date 
            ? format(new Date(row.paid_date), 'MMM d, yyyy')
            : format(new Date(row.created_date), 'MMM d, yyyy')
          }
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Pending' && (
            <PrimaryButton
              size="small"
              onClick={(e) => { e.stopPropagation(); approveCommissionMutation.mutate(row.id); }}
            >
              Approve
            </PrimaryButton>
          )}
          {row.status === 'Approved' && (
            <PrimaryButton
              size="small"
              icon={CheckCircle2}
              onClick={(e) => { e.stopPropagation(); markPaidMutation.mutate(row.id); }}
            >
              Mark Paid
            </PrimaryButton>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Commission Tracking</h1>
          <p className="text-gray-500 mt-1">Manage partner commission payments</p>
        </div>
        <PrimaryButton onClick={() => setShowRecordModal(true)}>
          Record Commission
        </PrimaryButton>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Audit Commissions"
          value={formatCurrency(totalAuditCommissions)}
          icon={FileText}
          accent
        />
        <MetricCard
          label="Retention Commissions"
          value={formatCurrency(totalRetentionCommissions)}
          icon={TrendingUp}
        />
        <MetricCard
          label="Pending Approval"
          value={formatCurrency(pendingCommissions)}
          icon={Calendar}
        />
        <MetricCard
          label="This Month"
          value={formatCurrency(thisMonthCommissions)}
          icon={DollarSign}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <InputField
            placeholder="Search by partner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        <SelectField
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'Audit', label: 'Audit' },
            { value: 'Retention', label: 'Retention' },
          ]}
          className="w-40"
        />
        <SelectField
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Paid', label: 'Paid' },
          ]}
          className="w-40"
        />
      </div>

      {/* Commissions Table */}
      <Panel noPadding>
        <DataTable
          columns={columns}
          data={filteredCommissions}
        />
      </Panel>

      {/* Record Commission Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record New Commission"
        size="large"
      >
        <form onSubmit={(e) => { e.preventDefault(); createCommissionMutation.mutate(newCommission); }} className="space-y-6">
          <SelectField
            label="Partner"
            value={newCommission.partner_id}
            onChange={(e) => setNewCommission({ ...newCommission, partner_id: e.target.value })}
            options={[
              { value: '', label: 'Select Partner' },
              ...partners.filter(p => p.status === 'Approved').map(p => ({ value: p.id, label: p.company_name }))
            ]}
            required
          />

          <SelectField
            label="Commission Type"
            value={newCommission.type}
            onChange={(e) => setNewCommission({ ...newCommission, type: e.target.value })}
            options={[
              { value: 'Audit', label: 'Audit Commission ($500)' },
              { value: 'Retention', label: 'Retention Commission (5% Monthly)' },
            ]}
            required
          />

          {newCommission.type === 'Audit' && (
            <SelectField
              label="Lead (Optional)"
              value={newCommission.lead_id}
              onChange={(e) => setNewCommission({ ...newCommission, lead_id: e.target.value })}
              options={[
                { value: '', label: 'Select Lead' },
                ...leads.filter(l => l.audit_completed_date).map(l => ({ 
                  value: l.id, 
                  label: `${l.company_name} - ${l.contact_name}` 
                }))
              ]}
            />
          )}

          {newCommission.type === 'Retention' && (
            <>
              <SelectField
                label="Client"
                value={newCommission.client_id}
                onChange={(e) => setNewCommission({ ...newCommission, client_id: e.target.value })}
                options={[
                  { value: '', label: 'Select Client' },
                  ...clients.filter(c => c.referring_partner_id).map(c => ({ 
                    value: c.id, 
                    label: c.company_name 
                  }))
                ]}
                required
              />
              <InputField
                label="Period (Month/Year)"
                type="month"
                value={newCommission.period}
                onChange={(e) => setNewCommission({ ...newCommission, period: e.target.value })}
                required
              />
            </>
          )}

          <InputField
            label="Amount"
            type="number"
            step="0.01"
            value={newCommission.amount}
            onChange={(e) => setNewCommission({ ...newCommission, amount: parseFloat(e.target.value) })}
            icon={DollarSign}
            placeholder={newCommission.type === 'Audit' ? '500.00' : 'Enter amount'}
            required
          />

          <SelectField
            label="Status"
            value={newCommission.status}
            onChange={(e) => setNewCommission({ ...newCommission, status: e.target.value })}
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Paid', label: 'Paid' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowRecordModal(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createCommissionMutation.isPending}
              disabled={!newCommission.partner_id || !newCommission.amount}
            >
              Record Commission
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}