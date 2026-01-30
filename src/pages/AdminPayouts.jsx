import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Building2
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminPayouts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const queryClient = useQueryClient();

  const { data: payouts = [] } = useQuery({
    queryKey: ['allPayouts'],
    queryFn: () => base44.entities.Payout.list('-created_date'),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const approvePayoutMutation = useMutation({
    mutationFn: (id) => base44.entities.Payout.update(id, { 
      status: 'Approved', 
      approved_at: new Date().toISOString() 
    }),
    onSuccess: () => queryClient.invalidateQueries(['allPayouts']),
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async (id) => {
      const payout = payouts.find(p => p.id === id);
      const partner = partners.find(p => p.id === payout?.partner_id);
      
      await base44.entities.Payout.update(id, { status: 'Rejected' });
      
      // Restore balance to partner
      if (partner) {
        await base44.entities.Partner.update(partner.id, {
          available_balance: (partner.available_balance || 0) + (payout?.amount || 0)
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['allPayouts']),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Payout.update(selectedPayout.id, { 
        status: 'Paid', 
        paid_at: new Date().toISOString(),
        payment_reference: paymentReference
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPayouts']);
      setShowProcessModal(false);
      setSelectedPayout(null);
      setPaymentReference('');
    },
  });

  const statuses = ['all', 'Requested', 'Approved', 'Processing', 'Paid', 'Rejected'];

  const getPartnerName = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.company_name || 'Unknown';
  };

  const getPartnerInfo = (partnerId) => {
    return partners.find(p => p.id === partnerId);
  };

  const filteredPayouts = payouts.filter(payout => {
    const partner = getPartnerInfo(payout.partner_id);
    const matchesSearch = partner?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const pendingTotal = payouts
    .filter(p => p.status === 'Requested' || p.status === 'Approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const processingTotal = payouts
    .filter(p => p.status === 'Processing')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const paidThisMonth = payouts
    .filter(p => {
      if (p.status !== 'Paid' || !p.paid_at) return false;
      const paidDate = new Date(p.paid_at);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const columns = [
    {
      key: 'partner',
      label: 'Partner',
      render: (row) => {
        const partner = getPartnerInfo(row.partner_id);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-500 font-medium">
                {partner?.company_name?.[0]?.toUpperCase() || 'P'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{partner?.company_name}</p>
              <p className="text-xs text-gray-500">{row.payment_method}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-xl font-light text-white">{formatCurrency(row.amount)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'requested_at',
      label: 'Requested',
      render: (row) => (
        <span className="text-xs font-mono text-gray-500">
          {format(new Date(row.requested_at || row.created_date), 'MMM d, yyyy')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Requested' && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); approvePayoutMutation.mutate(row.id); }}
                className="p-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); rejectPayoutMutation.mutate(row.id); }}
                className="p-2 text-red-500 hover:text-red-400 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === 'Approved' && (
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedPayout(row); setShowProcessModal(true); }}
              className="px-3 py-1 text-xs font-mono bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30"
            >
              Mark Paid
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Payouts</h1>
        <p className="text-gray-500 mt-1">Process partner payout requests</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Pending Approval"
          value={formatCurrency(pendingTotal)}
          icon={Clock}
          accent
        />
        <MetricCard
          label="Processing"
          value={formatCurrency(processingTotal)}
          icon={Wallet}
        />
        <MetricCard
          label="Paid This Month"
          value={formatCurrency(paidThisMonth)}
          icon={CheckCircle2}
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

      {/* Payouts Table */}
      <Panel noPadding>
        {filteredPayouts.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredPayouts}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Wallet}
              title="No payouts found"
              description={searchTerm || statusFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "No payout requests yet"
              }
            />
          </div>
        )}
      </Panel>

      {/* Process Payout Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => { setShowProcessModal(false); setSelectedPayout(null); setPaymentReference(''); }}
        title="Mark Payout as Paid"
      >
        {selectedPayout && (
          <div className="space-y-6">
            <div className="p-4 bg-[#0E1116] rounded-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <span className="text-white">{getPartnerName(selectedPayout.partner_id)}</span>
                </div>
                <span className="text-xl font-light text-emerald-400">
                  {formatCurrency(selectedPayout.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="text-gray-300">{selectedPayout.payment_method}</span>
              </div>
            </div>

            <InputField
              label="Payment Reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Transaction ID, check number, etc."
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <PrimaryButton variant="secondary" onClick={() => { setShowProcessModal(false); setSelectedPayout(null); setPaymentReference(''); }}>
                Cancel
              </PrimaryButton>
              <PrimaryButton 
                onClick={() => markAsPaidMutation.mutate()}
                loading={markAsPaidMutation.isPending}
              >
                Confirm Payment
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}