import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  Target
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';

export default function PartnerCommissions() {
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

  // Calculate commission metrics
  const wonLeads = leads.filter(l => l.status === 'Won');
  const pendingLeads = leads.filter(l => ['Qualified', 'Proposal Sent'].includes(l.status));
  
  const totalEarnings = wonLeads.reduce((sum, l) => sum + (l.commission_amount || 0), 0);
  const pendingCommissions = pendingLeads.length * (partner?.commission_rate || 10) * 500; // Estimated
  const availableBalance = partner?.available_balance || 0;
  
  const commissionRate = partner?.commission_rate || 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      key: 'company_name',
      label: 'Lead',
      render: (row) => (
        <div>
          <p className="text-white font-medium">{row.company_name}</p>
          <p className="text-xs text-gray-500">{row.contact_name}</p>
        </div>
      )
    },
    {
      key: 'service_interest',
      label: 'Service',
      render: (row) => <span className="text-gray-400">{row.service_interest || '—'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="small" />
    },
    {
      key: 'commission_amount',
      label: 'Commission',
      render: (row) => (
        row.status === 'Won' && row.commission_amount ? (
          <span className="text-emerald-400 font-mono">{formatCurrency(row.commission_amount)}</span>
        ) : row.status === 'Lost' ? (
          <span className="text-gray-600">—</span>
        ) : (
          <span className="text-gray-500 text-xs">Pending</span>
        )
      )
    },
    {
      key: 'created_date',
      label: 'Date',
      render: (row) => (
        <span className="text-xs font-mono text-gray-500">
          {format(new Date(row.created_date), 'MMM d, yyyy')}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Commissions</h1>
        <p className="text-gray-500 mt-1">Track your earnings from successful referrals</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Earnings"
          value={formatCurrency(totalEarnings)}
          icon={DollarSign}
          accent
        />
        <MetricCard
          label="Available Balance"
          value={formatCurrency(availableBalance)}
          icon={Wallet}
        />
        <MetricCard
          label="Pending Commissions"
          value={formatCurrency(pendingCommissions)}
          trendLabel="Estimated"
          icon={Clock}
        />
        <MetricCard
          label="Commission Rate"
          value={`${commissionRate}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission Structure */}
        <Panel title="Commission Structure" accent>
          <div className="space-y-4">
            <div className="p-4 bg-[#0E1116] rounded-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Your Rate</span>
                <span className="text-2xl font-light text-emerald-400">{commissionRate}%</span>
              </div>
              <p className="text-xs text-gray-500">
                of the first year's contract value
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">How it works</h4>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm text-white">Submit a qualified lead</p>
                  <p className="text-xs text-gray-500">Provide contact and project details</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm text-white">We close the deal</p>
                  <p className="text-xs text-gray-500">Our team handles sales and onboarding</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm text-white">Get paid</p>
                  <p className="text-xs text-gray-500">Commission paid after client's first payment</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* All Commissions */}
        <div className="lg:col-span-2">
          <Panel title="Commission History" noPadding>
            {leads.length > 0 ? (
              <DataTable
                columns={columns}
                data={leads}
                emptyMessage="No commission data available"
              />
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Target}
                  title="No leads yet"
                  description="Submit your first lead to start earning commissions"
                />
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Earnings by Month */}
      <Panel title="Monthly Earnings">
        <div className="space-y-4">
          {(() => {
            // Group won leads by month
            const monthlyEarnings = wonLeads.reduce((acc, lead) => {
              const monthKey = format(new Date(lead.created_date), 'yyyy-MM');
              if (!acc[monthKey]) {
                acc[monthKey] = { month: monthKey, amount: 0, count: 0 };
              }
              acc[monthKey].amount += lead.commission_amount || 0;
              acc[monthKey].count += 1;
              return acc;
            }, {});

            const sortedMonths = Object.values(monthlyEarnings)
              .sort((a, b) => b.month.localeCompare(a.month))
              .slice(0, 6);

            if (sortedMonths.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No earnings data yet
                </div>
              );
            }

            return sortedMonths.map((data) => (
              <div key={data.month} className="flex items-center justify-between p-4 bg-[#0E1116] rounded-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {format(new Date(data.month + '-01'), 'MMMM yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">{data.count} conversion{data.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className="text-xl font-light text-emerald-400">
                  {formatCurrency(data.amount)}
                </span>
              </div>
            ));
          })()}
        </div>
      </Panel>
    </div>
  );
}