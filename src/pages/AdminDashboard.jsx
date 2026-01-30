import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '../components/RoleGuard';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users,
  DollarSign,
  Target,
  Wallet,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Activity,
  Folder,
  Clock
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityItem from '@/components/ui/ActivityItem';

export default function AdminDashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list('-created_date'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['allPayouts'],
    queryFn: () => base44.entities.Payout.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 10),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  // Find unassigned users
  const unassignedUsers = allUsers.filter(user => {
    if (user.role === 'admin') return false;
    const hasClient = clients.some(c => c.user_id === user.email);
    const hasPartner = partners.some(p => p.user_id === user.email);
    return !hasClient && !hasPartner;
  });

  // Calculate metrics
  const activeClients = clients.filter(c => c.status === 'Active').length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyRevenue = invoices
    .filter(i => {
      const date = new Date(i.created_date);
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear &&
             i.status === 'Paid';
    })
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const monthlyLeads = leads.filter(l => {
    const date = new Date(l.created_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const pendingPayouts = payouts
    .filter(p => p.status === 'Requested' || p.status === 'Approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const newLeads = leads.filter(l => l.status === 'Submitted');
  const pendingPartners = partners.filter(p => p.status === 'Pending');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const alerts = [
    ...unassignedUsers.map(u => ({ type: 'unassigned', message: `User needs role: ${u.full_name || u.email}`, id: u.id })),
    ...overdueInvoices.map(i => ({ type: 'overdue', message: `Invoice overdue`, id: i.id })),
    ...newLeads.slice(0, 3).map(l => ({ type: 'lead', message: `New lead: ${l.company_name}`, id: l.id })),
    ...pendingPartners.map(p => ({ type: 'partner', message: `Partner application: ${p.company_name}`, id: p.id })),
  ].slice(0, 5);

  return (
    <RoleGuard allowedRoles={['admin']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-500 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-500 uppercase tracking-wider">
            System Online
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Clients"
          value={activeClients}
          icon={Users}
          accent
        />
        <MetricCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={DollarSign}
        />
        <MetricCard
          label="Partner Referrals"
          value={monthlyLeads}
          trendLabel="This month"
          icon={Target}
        />
        <MetricCard
          label="Pending Payouts"
          value={formatCurrency(pendingPayouts)}
          icon={Wallet}
        />
      </div>

      {/* Unassigned Users */}
      {unassignedUsers.length > 0 && (
        <Panel 
          title="Users Awaiting Role Assignment" 
          accent
          headerAction={
            <span className="text-[10px] font-mono text-amber-500">
              {unassignedUsers.length} {unassignedUsers.length === 1 ? 'user' : 'users'}
            </span>
          }
        >
          <div className="space-y-3">
            {unassignedUsers.map((user) => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-600 dark:text-amber-500 font-medium">
                      {(user.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{user.full_name || user.email}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-500">
                      Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={createPageUrl('AdminClients')}
                    className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-sm hover:bg-emerald-500/30 transition-colors"
                  >
                    Assign Role
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Panel 
          title="Alerts & Actions" 
          accent
          headerAction={
            alerts.length > 0 && (
              <span className="text-[10px] font-mono text-amber-500">
                {alerts.length} items
              </span>
            )
          }
        >
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm border-l-2 border-amber-500"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-500 mt-0.5">Requires attention</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-600 dark:text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All caught up!</p>
              </div>
            )}
          </div>
        </Panel>

        {/* Lead Pipeline Overview */}
        <Panel title="Lead Pipeline">
          <div className="space-y-3">
            {[
              { label: 'New Leads', count: leads.filter(l => l.status === 'Submitted').length, color: 'bg-gray-500' },
              { label: 'In Contact', count: leads.filter(l => l.status === 'Contacted').length, color: 'bg-blue-500' },
              { label: 'Qualified', count: leads.filter(l => l.status === 'Qualified').length, color: 'bg-amber-500' },
              { label: 'Proposal Sent', count: leads.filter(l => l.status === 'Proposal Sent').length, color: 'bg-orange-500' },
              { label: 'Won', count: leads.filter(l => l.status === 'Won').length, color: 'bg-emerald-500' },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{stage.label}</span>
                </div>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{stage.count}</span>
              </div>
            ))}
          </div>
          <Link
            to={createPageUrl('AdminLeads')}
            className="mt-4 block text-center text-xs text-emerald-500 hover:text-emerald-400"
          >
            View Pipeline →
          </Link>
        </Panel>

        {/* Recent Activity */}
        <Panel title="Recent Activity">
          <div className="space-y-1">
            {activityLogs.slice(0, 5).map((log) => (
              <ActivityItem
                key={log.id}
                icon={Activity}
                title={log.action}
                description={`${log.entity_type} - ${log.entity_name || log.entity_id}`}
                timestamp={log.created_date}
              />
            ))}
            {activityLogs.length === 0 && (
              <div className="text-center py-4 text-gray-600 dark:text-gray-500 text-sm">
                No recent activity
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Panel 
          title="Recent Clients"
          headerAction={
            <Link 
              to={createPageUrl('AdminClients')}
              className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <div 
                key={client.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-500 font-medium">
                      {client.company_name?.[0]?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{client.company_name}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-500">{client.industry}</p>
                  </div>
                </div>
                <StatusBadge status={client.status} size="small" />
              </div>
            ))}
            {clients.length === 0 && (
              <div className="text-center py-4 text-gray-600 dark:text-gray-500 text-sm">
                No clients yet
              </div>
            )}
          </div>
        </Panel>

        {/* Recent Projects */}
        <Panel 
          title="Active Projects"
          headerAction={
            <Link 
              to={createPageUrl('AdminProjects')}
              className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {projects.filter(p => p.status === 'In Progress').slice(0, 5).map((project) => (
              <div 
                key={project.id}
                className="p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{project.name}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-500 mt-0.5">{project.description?.slice(0, 40)}...</p>
                  </div>
                  <StatusBadge status={project.status} size="small" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    {project.end_date && format(new Date(project.end_date), 'MMM d')}
                  </div>
                  <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {projects.filter(p => p.status === 'In Progress').length === 0 && (
              <div className="text-center py-4 text-gray-600 dark:text-gray-500 text-sm">
                No active projects
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Partner Performance */}
      <Panel 
        title="Partner Performance"
        headerAction={
          <Link 
            to={createPageUrl('AdminPartners')}
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
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500">Partner</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500">Status</th>
                <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500">Leads</th>
                <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500">Conversions</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {partners.filter(p => p.status === 'Approved').slice(0, 5).map((partner) => {
                const partnerLeads = leads.filter(l => l.partner_id === partner.id);
                const wonLeads = partnerLeads.filter(l => l.status === 'Won');
                return (
                  <tr key={partner.id} className="border-b border-white/[0.05]">
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">{partner.company_name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={partner.status} size="small" />
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-400">{partnerLeads.length}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-400">{wonLeads.length}</td>
                    <td className="px-4 py-4 text-right text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(partner.total_earnings || 0)}
                    </td>
                  </tr>
                );
              })}
              {partners.filter(p => p.status === 'Approved').length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600 dark:text-gray-500">
                    No approved partners yet
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