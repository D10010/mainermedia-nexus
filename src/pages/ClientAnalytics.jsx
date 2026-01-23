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
  Calendar,
  Plus,
  Target,
  MousePointer
} from 'lucide-react';
import RoleGuard from '../components/RoleGuard';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/MetricCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SocialMetricCard from '../components/social/SocialMetricCard';
import PlatformCard from '../components/social/PlatformCard';
import ConnectAccountModal from '../components/social/ConnectAccountModal';

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
  const [showConnectModal, setShowConnectModal] = useState(false);

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

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['socialAccounts', client?.id],
    queryFn: () => base44.entities.SocialMediaAccount.filter({ client_id: client.id }),
    enabled: !!client?.id,
  });

  const { data: socialMetrics = [] } = useQuery({
    queryKey: ['socialMetrics', client?.id],
    queryFn: () => base44.entities.SocialMetric.filter({ client_id: client.id }, '-date', 90),
    enabled: !!client?.id,
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

  // Calculate aggregated social metrics
  const getAggregatedMetrics = () => {
    const cutoff = subDays(new Date(), getDaysAgo());
    const recentMetrics = socialMetrics.filter(m => new Date(m.date) >= cutoff);
    
    if (recentMetrics.length === 0) return null;

    const totalReach = recentMetrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const avgEngagement = recentMetrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / recentMetrics.length;
    const totalNetFollowers = recentMetrics.reduce((sum, m) => sum + (m.net_follower_change || 0), 0);
    const totalClicks = recentMetrics.reduce((sum, m) => sum + (m.link_clicks || 0), 0);

    return {
      reach: totalReach,
      engagementRate: avgEngagement,
      netFollowerChange: totalNetFollowers,
      linkClicks: totalClicks,
    };
  };

  // Get platform-specific metrics
  const getPlatformMetrics = (platform) => {
    const cutoff = subDays(new Date(), getDaysAgo());
    const platformMetrics = socialMetrics.filter(m => 
      m.platform === platform && new Date(m.date) >= cutoff
    );

    if (platformMetrics.length === 0) return null;

    const latest = platformMetrics[0];
    const previous = platformMetrics[Math.floor(platformMetrics.length / 2)] || platformMetrics[0];

    const calculateChange = (current, prev) => {
      if (!prev || prev === 0) return 0;
      return ((current - prev) / prev * 100).toFixed(1);
    };

    return {
      reach: latest.reach || 0,
      reachChange: calculateChange(latest.reach, previous.reach),
      engagementRate: latest.engagement_rate || 0,
      engagementChange: calculateChange(latest.engagement_rate, previous.engagement_rate),
      netFollowerChange: latest.net_follower_change || 0,
      followerGrowthRate: latest.followers_gained && latest.followers_lost 
        ? ((latest.followers_gained - latest.followers_lost) / (latest.followers_gained + latest.followers_lost) * 100)
        : 0,
      linkClicks: latest.link_clicks || 0,
      clicksChange: calculateChange(latest.link_clicks, previous.link_clicks),
    };
  };

  const aggregatedMetrics = getAggregatedMetrics();

  return (
    <RoleGuard allowedRoles={['client']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Social Media Analytics</h1>
          <p className="text-gray-500 mt-1">Track momentum, attention quality, and business impact across platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <PrimaryButton 
            variant="primary" 
            icon={Plus} 
            size="small"
            onClick={() => setShowConnectModal(true)}
          >
            Connect Account
          </PrimaryButton>
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

      {/* Tier 1: Universal Metrics */}
      {aggregatedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SocialMetricCard
            label="Reach (Unique Accounts)"
            value={formatNumber(aggregatedMetrics.reach)}
            icon={Eye}
            accent
          />
          <SocialMetricCard
            label="Engagement Rate"
            value={`${aggregatedMetrics.engagementRate?.toFixed(1) || 0}%`}
            icon={Activity}
          />
          <SocialMetricCard
            label="Follower Velocity"
            value={formatNumber(aggregatedMetrics.netFollowerChange)}
            icon={Users}
          />
          <SocialMetricCard
            label="Link Clicks / Actions"
            value={formatNumber(aggregatedMetrics.linkClicks)}
            icon={MousePointer}
          />
        </div>
      )}

      {/* Connected Platforms */}
      {socialAccounts.length > 0 && (
        <Panel title="Platform Performance" subtitle="Week-over-week signals" statusIndicator="Live">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {socialAccounts.map((account) => {
              const metrics = getPlatformMetrics(account.platform);
              const latestMetric = socialMetrics.find(m => 
                m.platform === account.platform && m.account_id === account.id
              );
              
              return (
                <PlatformCard
                  key={account.id}
                  platform={account.platform}
                  metrics={metrics}
                  insight={latestMetric?.insight_text}
                  healthStatus={latestMetric?.health_status}
                  healthScore={latestMetric?.health_score}
                  accountUrl={account.account_url}
                />
              );
            })}
          </div>
        </Panel>
      )}

      {/* Empty state if no accounts */}
      {socialAccounts.length === 0 && (
        <Panel title="Get Started">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-sm bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Connect Your Social Media Accounts</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start tracking momentum, attention quality, and business impact across all your platforms in one unified dashboard.
            </p>
            <PrimaryButton 
              variant="primary" 
              icon={Plus}
              onClick={() => setShowConnectModal(true)}
            >
              Connect First Account
            </PrimaryButton>
          </div>
        </Panel>
      )}

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

      {/* Connect Account Modal */}
      <ConnectAccountModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        clientId={client?.id}
      />
    </div>
    </RoleGuard>
  );
}