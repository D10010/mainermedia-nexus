import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '../components/RoleGuard';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DollarSign,
  Target,
  TrendingUp,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Activity
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';

export default function PartnerDashboard() {
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

  const { data: payouts = [] } = useQuery({
    queryKey: ['partnerPayouts', partner?.id],
    queryFn: () => base44.entities.Payout.filter({ partner_id: partner.id }, '-created_date', 10),
    enabled: !!partner?.id,
  });

  // Calculate metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyLeads = leads.filter(l => {
    const date = new Date(l.created_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const wonLeads = leads.filter(l => l.status === 'Won');
  const thisMonthEarnings = wonLeads
    .filter(l => {
      const date = new Date(l.created_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, l) => sum + (l.commission_amount || 0), 0);

  const lastMonthEarnings = wonLeads
    .filter(l => {
      const date = new Date(l.created_date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === lastMonth && date.getFullYear() === year;
    })
    .reduce((sum, l) => sum + (l.commission_amount || 0), 0);

  const totalEarnings = wonLeads.reduce((sum, l) => sum + (l.commission_amount || 0), 0);
  const conversionRate = leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : 0;

  const earningsTrend = lastMonthEarnings > 0 
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(0) 
    : 0;

  // Lead status counts
  const statusCounts = {
    submitted: leads.filter(l => l.status === 'Submitted').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    proposal: leads.filter(l => l.status === 'Proposal Sent').length,
    won: wonLeads.length,
    lost: leads.filter(l => l.status === 'Lost').length,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <RoleGuard allowedRoles={['partner']}>
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            Partner Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Track your referrals and earnings
          </p>
        </div>
        <Link 
          to={createPageUrl('PartnerLeads') + '?new=true'}
          className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-sm text-sm font-medium
            hover:bg-emerald-600 transition-all shadow-[0_0_0_rgba(16,185,129,0)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
        >
          <Target className="w-4 h-4" />
          Submit New Lead
        </Link>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="This Month"
          value={formatCurrency(thisMonthEarnings)}
          trend={Number(earningsTrend)}
          icon={DollarSign}
          accent
        />
        <MetricCard
          label="Last Month"
          value={formatCurrency(lastMonthEarnings)}
          icon={DollarSign}
        />
        <MetricCard
          label="All Time Earnings"
          value={formatCurrency(totalEarnings)}
          icon={Wallet}
        />
        <MetricCard
          label="Available Balance"
          value={formatCurrency(partner?.available_balance || 0)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="lg:col-span-2">
          <Panel title="Lead Pipeline" statusIndicator="Live">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Submitted', count: statusCounts.submitted, color: 'bg-gray-500' },
                { label: 'Contacted', count: statusCounts.contacted, color: 'bg-blue-500' },
                { label: 'Qualified', count: statusCounts.qualified, color: 'bg-amber-500' },
                { label: 'Proposal', count: statusCounts.proposal, color: 'bg-orange-500' },
                { label: 'Won', count: statusCounts.won, color: 'bg-emerald-500' },
                { label: 'Lost', count: statusCounts.lost, color: 'bg-red-500' },
              ].map((stage) => (
                <div key={stage.label} className="text-center">
                  <div className={`w-full h-1 ${stage.color} rounded-full mb-3`} />
                  <p className="text-2xl font-light text-white">{stage.count}</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-1">
                    {stage.label}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-gray-400">Conversion Rate</span>
              </div>
              <span className="text-xl font-light text-white">{conversionRate}%</span>
            </div>
          </Panel>
        </div>

        {/* Payout Status */}
        <Panel title="Payout Status" accent>
          <div className="space-y-4">
            <div className="p-4 bg-[#0E1116] rounded-sm">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                Available for Payout
              </p>
              <p className="text-2xl font-light text-emerald-400">
                {formatCurrency(partner?.available_balance || 0)}
              </p>
            </div>
            
            {partner?.available_balance >= 100 ? (
              <Link
                to={createPageUrl('PartnerPayouts')}
                className="block w-full text-center bg-emerald-500 text-white px-4 py-3 rounded-sm text-sm font-medium
                  hover:bg-emerald-600 transition-all"
              >
                Request Payout
              </Link>
            ) : (
              <p className="text-xs text-gray-500 text-center">
                Minimum $100 required for payout
              </p>
            )}

            <div className="pt-4 border-t border-white/[0.05]">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
                Recent Payouts
              </p>
              <div className="space-y-2">
                {payouts.slice(0, 3).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {payout.status === 'Paid' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500" />
                      )}
                      <span className="text-xs text-gray-400">
                        {format(new Date(payout.created_date), 'MMM d')}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-white">
                      {formatCurrency(payout.amount)}
                    </span>
                  </div>
                ))}
                {payouts.length === 0 && (
                  <p className="text-xs text-gray-500 text-center">No payouts yet</p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Recent Leads */}
      <Panel 
        title="Recent Lead Activity"
        headerAction={
          <Link 
            to={createPageUrl('PartnerLeads')}
            className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Contact</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Company</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Service</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Commission</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 5).map((lead) => (
                <tr key={lead.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-white">{lead.contact_name}</p>
                      <p className="text-xs text-gray-500">{lead.contact_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">{lead.company_name}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">{lead.service_interest}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={lead.status} size="small" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    {lead.status === 'Won' ? (
                      <span className="text-sm font-mono text-emerald-400">
                        {formatCurrency(lead.commission_amount || 0)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    No leads submitted yet. Submit your first lead to start earning!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
    </RoleGuard>
  );
}