import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Download
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/MetricCard';
import PrimaryButton from '@/components/ui/PrimaryButton';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('6m');

  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list('-created_date'),
  });

  // Calculate monthly revenue
  const getMonthlyRevenue = () => {
    const months = [];
    const monthCount = dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.created_date);
          return invDate >= start && invDate <= end && inv.status === 'Paid';
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      months.push({
        month: format(date, 'MMM'),
        revenue: monthRevenue,
      });
    }
    return months;
  };

  // Calculate lead conversion funnel
  const getLeadFunnel = () => {
    return [
      { name: 'Submitted', value: leads.filter(l => l.status === 'Submitted').length },
      { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
      { name: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length },
      { name: 'Proposal', value: leads.filter(l => l.status === 'Proposal Sent').length },
      { name: 'Won', value: leads.filter(l => l.status === 'Won').length },
    ];
  };

  // Client by industry
  const getClientsByIndustry = () => {
    const industries = {};
    clients.forEach(client => {
      const industry = client.industry || 'Other';
      industries[industry] = (industries[industry] || 0) + 1;
    });
    return Object.entries(industries).map(([name, value]) => ({ name, value }));
  };

  // Partner performance
  const getPartnerPerformance = () => {
    return partners
      .filter(p => p.status === 'Approved')
      .map(partner => {
        const partnerLeads = leads.filter(l => l.partner_id === partner.id);
        const wonLeads = partnerLeads.filter(l => l.status === 'Won').length;
        return {
          name: partner.company_name?.slice(0, 15) || 'Unknown',
          leads: partnerLeads.length,
          conversions: wonLeads,
          earnings: partner.total_earnings || 0,
        };
      })
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);
  };

  // Key metrics
  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  
  const activeClients = clients.filter(c => c.status === 'Active').length;
  const conversionRate = leads.length > 0 
    ? ((leads.filter(l => l.status === 'Won').length / leads.length) * 100).toFixed(1)
    : 0;
  const avgDealSize = leads.filter(l => l.status === 'Won' && l.commission_amount).length > 0
    ? leads.filter(l => l.status === 'Won' && l.commission_amount)
        .reduce((sum, l) => sum + (l.commission_amount || 0), 0) / 
      leads.filter(l => l.status === 'Won' && l.commission_amount).length / 0.1 // Estimate based on 10% commission
    : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const revenueData = getMonthlyRevenue();
  const funnelData = getLeadFunnel();
  const industryData = getClientsByIndustry();
  const partnerData = getPartnerPerformance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 mt-1">Business performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['3m', '6m', '12m'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`
                  px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all
                  ${dateRange === range
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#12161D] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                  }
                `}
              >
                {range}
              </button>
            ))}
          </div>
          <PrimaryButton variant="secondary" icon={Download} size="small">
            Export
          </PrimaryButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          accent
        />
        <MetricCard
          label="Active Clients"
          value={activeClients}
          icon={Users}
        />
        <MetricCard
          label="Lead Conversion"
          value={`${conversionRate}%`}
          icon={Target}
        />
        <MetricCard
          label="Avg Deal Size"
          value={formatCurrency(avgDealSize)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Panel title="Revenue Over Time" statusIndicator="Live">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280" 
                  fontSize={10}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={10}
                  fontFamily="monospace"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12161D', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Lead Funnel */}
        <Panel title="Lead Conversion Funnel">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  stroke="#6B7280" 
                  fontSize={10}
                  fontFamily="monospace"
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  stroke="#6B7280" 
                  fontSize={10}
                  fontFamily="monospace"
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12161D', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#10b981" 
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients by Industry */}
        <Panel title="Clients by Industry">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12161D', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {industryData.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-400">{entry.name}</span>
                </div>
                <span className="text-sm font-mono text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Partner Leaderboard */}
        <div className="lg:col-span-2">
          <Panel title="Partner Performance">
            <div className="space-y-3">
              {partnerData.map((partner, index) => (
                <div 
                  key={partner.name}
                  className="flex items-center gap-4 p-3 bg-[#0E1116] rounded-sm"
                >
                  <div className={`
                    w-8 h-8 rounded-sm flex items-center justify-center font-mono text-sm
                    ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-800 text-gray-500'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{partner.name}</p>
                    <p className="text-xs text-gray-500">
                      {partner.leads} leads · {partner.conversions} conversions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono">{formatCurrency(partner.earnings)}</p>
                    <p className="text-[10px] text-gray-500">earned</p>
                  </div>
                </div>
              ))}
              {partnerData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No partner data available
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}