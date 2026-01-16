import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
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
  Eye,
  Users,
  Activity,
  Download,
  Calendar
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/MetricCard';
import PrimaryButton from '@/components/ui/PrimaryButton';

const PLATFORM_COLORS = {
  Instagram: '#E4405F',
  YouTube: '#FF0000',
  TikTok: '#000000',
  Facebook: '#1877F2',
  Website: '#10b981',
  LinkedIn: '#0A66C2',
  Twitter: '#1DA1F2',
  All: '#6B7280'
};

export default function ClientAnalytics() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: client } = useQuery({
    queryKey: ['currentClient', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const clients = await base44.entities.Client.filter({ user_id: user.email });
      return clients[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: kpiMetrics = [] } = useQuery({
    queryKey: ['clientKPIs', client?.id],
    queryFn: () => base44.entities.KPIMetric.filter({ client_id: client.id }, '-date'),
    enabled: !!client?.id,
  });

  // Filter metrics by date range
  const getDaysAgo = () => {
    switch (dateRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const cutoffDate = subDays(new Date(), getDaysAgo());
  
  const filteredMetrics = kpiMetrics.filter(m => {
    const metricsDate = new Date(m.date);
    const platformMatch = selectedPlatform === 'All' || m.platform === selectedPlatform;
    return metricsDate >= cutoffDate && platformMatch;
  });

  // Group metrics by type
  const getLatestMetric = (name) => {
    const metrics = filteredMetrics.filter(k => k.metric_name === name);
    return metrics[0] || { metric_value: 0, trend: 0 };
  };

  const viewsKPI = getLatestMetric('Views');
  const engagementKPI = getLatestMetric('Engagement Rate');
  const followersKPI = getLatestMetric('Followers');
  const clicksKPI = getLatestMetric('Clicks');

  // Prepare chart data
  const prepareTimeSeriesData = (metricName) => {
    const data = filteredMetrics
      .filter(m => m.metric_name === metricName)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .reduce((acc, m) => {
        const dateKey = format(new Date(m.date), 'MMM d');
        const existing = acc.find(d => d.date === dateKey);
        if (existing) {
          existing.value += m.metric_value;
        } else {
          acc.push({ date: dateKey, value: m.metric_value });
        }
        return acc;
      }, []);
    return data;
  };

  // Platform breakdown
  const platformBreakdown = kpiMetrics
    .filter(m => m.metric_name === 'Views' && new Date(m.date) >= cutoffDate)
    .reduce((acc, m) => {
      const platform = m.platform || 'Other';
      if (!acc[platform]) acc[platform] = 0;
      acc[platform] += m.metric_value;
      return acc;
    }, {});

  const pieData = Object.entries(platformBreakdown).map(([name, value]) => ({
    name,
    value,
    color: PLATFORM_COLORS[name] || '#6B7280'
  }));

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const viewsData = prepareTimeSeriesData('Views');
  const engagementData = prepareTimeSeriesData('Engagement Rate');

  const platforms = ['All', 'Instagram', 'YouTube', 'TikTok', 'Facebook', 'Website', 'LinkedIn'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your campaign performance across all platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <PrimaryButton variant="secondary" icon={Download} size="small">
            Export Report
          </PrimaryButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Date Range */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`
                px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm
                transition-all duration-200
                ${dateRange === range.value
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#12161D] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                }
              `}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`
                px-3 py-2 text-xs font-mono uppercase tracking-wider rounded-sm whitespace-nowrap
                transition-all duration-200
                ${selectedPlatform === platform
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#12161D] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                }
              `}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Views"
          value={formatNumber(viewsKPI.metric_value)}
          trend={viewsKPI.trend}
          icon={Eye}
          accent
        />
        <MetricCard
          label="Engagement Rate"
          value={`${engagementKPI.metric_value?.toFixed(2) || 0}%`}
          trend={engagementKPI.trend}
          icon={Activity}
        />
        <MetricCard
          label="Follower Growth"
          value={formatNumber(followersKPI.metric_value)}
          trend={followersKPI.trend}
          icon={Users}
        />
        <MetricCard
          label="Clicks"
          value={formatNumber(clicksKPI.metric_value)}
          trend={clicksKPI.trend}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views Over Time */}
        <div className="lg:col-span-2">
          <Panel title="Views Over Time" statusIndicator="Live">
            <div className="h-80">
              {viewsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6B7280" 
                      fontSize={10}
                      fontFamily="monospace"
                    />
                    <YAxis 
                      stroke="#6B7280" 
                      fontSize={10}
                      fontFamily="monospace"
                      tickFormatter={formatNumber}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#12161D', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '2px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value) => [formatNumber(value), 'Views']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No data available for this period
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Platform Breakdown */}
        <Panel title="Platform Breakdown">
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#12161D', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '2px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [formatNumber(value), 'Views']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-400">{entry.name}</span>
                </div>
                <span className="text-sm font-mono text-white">{formatNumber(entry.value)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Engagement Over Time */}
      <Panel title="Engagement Rate Trend">
        <div className="h-64">
          {engagementData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  fontSize={10}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={10}
                  fontFamily="monospace"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12161D', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Engagement Rate']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No data available for this period
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}