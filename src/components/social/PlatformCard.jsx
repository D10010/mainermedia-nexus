import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import PrimaryButton from '../ui/PrimaryButton';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const PLATFORM_COLORS = {
  Instagram: '#E4405F',
  YouTube: '#FF0000',
  TikTok: '#000000',
  Facebook: '#1877F2',
  LinkedIn: '#0A66C2',
  Twitter: '#1DA1F2'
};

const PLATFORM_LOGOS = {
  Instagram: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
  YouTube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  TikTok: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg',
  Facebook: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
  LinkedIn: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
  Twitter: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg'
};

export default function PlatformCard({ 
  platform, 
  metrics, 
  insight,
  healthStatus,
  healthScore,
  accountUrl,
  accountId,
  lastSync
}) {
  const queryClient = useQueryClient();
  const platformColor = PLATFORM_COLORS[platform] || '#10b981';

  const syncMetricsMutation = useMutation({
    mutationFn: async () => {
      const functionName = `sync${platform}Metrics`;
      const response = await base44.functions.invoke(functionName, { accountId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialMetrics']);
      queryClient.invalidateQueries(['socialAccounts']);
    },
  });

  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className="w-3 h-3 text-gray-500" />;
    return value > 0 
      ? <TrendingUp className="w-3 h-3 text-emerald-500" /> 
      : <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-[#12161D] border border-gray-200 dark:border-white/[0.08] rounded-sm overflow-hidden hover:border-emerald-500/20 transition-colors">
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between"
        style={{ 
          background: `linear-gradient(135deg, ${platformColor}15 0%, transparent 100%)` 
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: `${platformColor}20` }}
          >
            <img 
              src={PLATFORM_LOGOS[platform]} 
              alt={platform}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-medium">{platform}</h3>
            {accountUrl && (
              <a 
                href={accountUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-500 flex items-center gap-1"
              >
                View profile <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {healthStatus && (
          <div className="flex items-center gap-2">
            <span className={`
              text-[10px] font-mono uppercase px-2 py-1 rounded-sm
              ${healthStatus === 'Growing' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' : ''}
              ${healthStatus === 'Stable' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-500' : ''}
              ${healthStatus === 'Needs Attention' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500' : ''}
            `}>
              {healthStatus}
            </span>
            {healthScore !== undefined && (
              <span className="text-sm font-mono text-gray-600 dark:text-gray-500">
                {healthScore}/100
              </span>
            )}
          </div>
        )}
      </div>

      {/* Last Sync */}
      {lastSync && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
          <span className="text-[10px] text-gray-600 dark:text-gray-500">
            Last synced: {new Date(lastSync).toLocaleString()}
          </span>
          <PrimaryButton
            variant="ghost"
            size="small"
            icon={RefreshCw}
            onClick={() => syncMetricsMutation.mutate()}
            loading={syncMetricsMutation.isPending}
            disabled={syncMetricsMutation.isPending}
          >
            Sync Now
          </PrimaryButton>
        </div>
      )}

      {/* Metrics Grid or Empty State */}
      {metrics ? (
        <div className="p-4 grid grid-cols-2 gap-4">
          {/* Reach */}
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-1">Reach</p>
            <p className="text-lg font-light text-gray-900 dark:text-white">{formatNumber(metrics.reach)}</p>
            {metrics.reachChange !== undefined && metrics.reachChange !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(metrics.reachChange)}
                <span className={`text-xs font-mono ${metrics.reachChange > 0 ? 'text-emerald-500' : metrics.reachChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {metrics.reachChange > 0 ? '+' : ''}{metrics.reachChange}%
                </span>
              </div>
            )}
          </div>

          {/* Engagement Rate */}
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-1">Engagement</p>
            <p className="text-lg font-light text-gray-900 dark:text-white">{metrics.engagementRate?.toFixed(1) || 0}%</p>
            {metrics.engagementChange !== undefined && metrics.engagementChange !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(metrics.engagementChange)}
                <span className={`text-xs font-mono ${metrics.engagementChange > 0 ? 'text-emerald-500' : metrics.engagementChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {metrics.engagementChange > 0 ? '+' : ''}{metrics.engagementChange}%
                </span>
              </div>
            )}
          </div>

          {/* Follower Net Change */}
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-1">Follower Velocity</p>
            <p className={`text-lg font-light ${metrics.netFollowerChange > 0 ? 'text-emerald-600 dark:text-emerald-500' : metrics.netFollowerChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {metrics.netFollowerChange > 0 ? '+' : ''}{formatNumber(metrics.netFollowerChange)}
            </p>
            {metrics.followerGrowthRate !== undefined && metrics.followerGrowthRate !== 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                {metrics.followerGrowthRate > 0 ? '+' : ''}{metrics.followerGrowthRate?.toFixed(1)}% growth rate
              </p>
            )}
          </div>

          {/* Link Clicks */}
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-1">Link Clicks</p>
            <p className="text-lg font-light text-gray-900 dark:text-white">{formatNumber(metrics.linkClicks)}</p>
            {metrics.clicksChange !== undefined && metrics.clicksChange !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(metrics.clicksChange)}
                <span className={`text-xs font-mono ${metrics.clicksChange > 0 ? 'text-emerald-500' : metrics.clicksChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {metrics.clicksChange > 0 ? '+' : ''}{metrics.clicksChange}%
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-700 dark:text-gray-500 mb-2">No metrics data yet</p>
          <p className="text-xs text-gray-600 dark:text-gray-600 mb-4">
            Click "Sync Now" to fetch the latest metrics from {platform}
          </p>
          <PrimaryButton
            variant="primary"
            size="small"
            icon={RefreshCw}
            onClick={() => syncMetricsMutation.mutate()}
            loading={syncMetricsMutation.isPending}
            disabled={syncMetricsMutation.isPending}
          >
            Sync Metrics
          </PrimaryButton>
        </div>
      )}

      {/* Insight */}
      {insight && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 dark:bg-[#0E1116] border border-emerald-500/20 rounded-sm p-3">
            <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed">
              {insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}