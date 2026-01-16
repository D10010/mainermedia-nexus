import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Folder,
  TrendingUp,
  Eye,
  Users,
  Activity,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityItem from '@/components/ui/ActivityItem';
import ProgressBar from '@/components/ui/ProgressBar';

export default function ClientDashboard() {
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

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', client?.id],
    queryFn: () => base44.entities.Project.filter({ client_id: client.id }),
    enabled: !!client?.id,
  });

  const { data: kpiMetrics = [] } = useQuery({
    queryKey: ['clientKPIs', client?.id],
    queryFn: () => base44.entities.KPIMetric.filter({ client_id: client.id }, '-date', 30),
    enabled: !!client?.id,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const all = await base44.entities.Announcement.filter({ is_published: true }, '-published_at', 5);
      return all.filter(a => a.target_audience === 'All' || a.target_audience === 'Clients');
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['clientInvoices', client?.id],
    queryFn: () => base44.entities.Invoice.filter({ client_id: client.id }, '-created_date', 5),
    enabled: !!client?.id,
  });

  // Calculate metrics
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const pendingItems = projects.filter(p => p.status === 'Planning' || p.status === 'On Hold').length;
  
  // Get latest KPIs by type
  const getLatestKPI = (name) => {
    const metrics = kpiMetrics.filter(k => k.metric_name === name);
    return metrics[0] || { metric_value: 0, trend: 0 };
  };

  const viewsKPI = getLatestKPI('Views');
  const engagementKPI = getLatestKPI('Engagement Rate');
  const followersKPI = getLatestKPI('Followers');

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-500 uppercase tracking-wider">
            All systems operational
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Projects"
          value={activeProjects}
          icon={Folder}
          accent
        />
        <MetricCard
          label="Total Views"
          value={formatNumber(viewsKPI.metric_value)}
          trend={viewsKPI.trend}
          icon={Eye}
        />
        <MetricCard
          label="Engagement Rate"
          value={`${engagementKPI.metric_value?.toFixed(1) || 0}%`}
          trend={engagementKPI.trend}
          icon={Activity}
        />
        <MetricCard
          label="Follower Growth"
          value={formatNumber(followersKPI.metric_value)}
          trend={followersKPI.trend}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Panel 
            title="Active Projects" 
            statusIndicator="Live"
            headerAction={
              <Link 
                to={createPageUrl('ClientProjects')}
                className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <div className="space-y-4">
              {projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled').slice(0, 4).map((project) => (
                <div 
                  key={project.id}
                  className="p-4 bg-[#0E1116] rounded-sm border border-white/[0.05] hover:border-emerald-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{project.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{project.description?.slice(0, 60)}...</p>
                    </div>
                    <StatusBadge status={project.status} size="small" />
                  </div>
                  <ProgressBar value={project.progress || 0} size="small" />
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No active projects yet
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Upcoming Deadlines */}
        <Panel title="Upcoming" accent>
          <div className="space-y-3">
            {projects
              .filter(p => p.end_date && new Date(p.end_date) > new Date())
              .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
              .slice(0, 5)
              .map((project) => (
                <div key={project.id} className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{project.name}</p>
                    <p className="text-[10px] font-mono text-gray-500">
                      {format(new Date(project.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            {projects.filter(p => p.end_date).length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No upcoming deadlines
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Panel title="Recent Invoices">
          <div className="space-y-2">
            {invoices.slice(0, 4).map((invoice) => (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-[#0E1116] rounded-sm"
              >
                <div className="flex items-center gap-3">
                  {invoice.status === 'Paid' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : invoice.status === 'Overdue' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm text-white">
                      {invoice.invoice_number || `INV-${invoice.id?.slice(-6)}`}
                    </p>
                    <p className="text-[10px] font-mono text-gray-500">
                      {invoice.due_date && format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-white">${invoice.amount?.toLocaleString()}</p>
                  <StatusBadge status={invoice.status} size="small" showDot={false} />
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No invoices yet
              </div>
            )}
          </div>
        </Panel>

        {/* Announcements */}
        <Panel title="Updates & Announcements">
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id}
                className="pb-4 border-b border-white/[0.05] last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-white text-sm font-medium">{announcement.title}</h4>
                  {announcement.priority === 'High' && (
                    <span className="text-[9px] font-mono text-red-400 bg-red-500/20 px-2 py-0.5 rounded-sm">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {announcement.content}
                </p>
                <p className="text-[10px] font-mono text-gray-600 mt-2">
                  {announcement.published_at && format(new Date(announcement.published_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No announcements
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}