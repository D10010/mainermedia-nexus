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
  TrendingUp,
  Activity,
  AlertTriangle,
  Shield
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';

export default function OwnerDashboard() {
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  // Find unassigned users
  const unassignedUsers = allUsers.filter(u => !u.user_role);
  const clients = allUsers.filter(u => u.user_role === 'client');
  const managers = allUsers.filter(u => u.user_role === 'client_manager');
  const agents = allUsers.filter(u => u.user_role === 'sales_agent');
  const activeClients = clients.filter(c => c.status === 'Active');

  // Calculate metrics
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

  const activeProjects = projects.filter(p => p.status === 'In Progress').length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <RoleGuard allowedRoles={['owner_admin']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            <h1 className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">
              System Overview
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">
            System Online
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Clients"
          value={activeClients.length}
          icon={Users}
          accent
        />
        <MetricCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={DollarSign}
        />
        <MetricCard
          label="New Leads"
          value={monthlyLeads}
          trendLabel="This month"
          icon={Target}
        />
        <MetricCard
          label="Active Projects"
          value={activeProjects}
          icon={Activity}
        />
      </div>

      {/* Unassigned Users Alert */}
      {unassignedUsers.length > 0 && (
        <Panel 
          title="Users Awaiting Role Assignment" 
          accent
          headerAction={
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-500">
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
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full rounded-sm object-cover" />
                    ) : (
                      <span className="text-amber-600 dark:text-amber-500 font-medium">
                        {(user.display_name || user.email)?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{user.display_name || user.email}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-500">
                      Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Link
                  to={createPageUrl('OwnerUsers')}
                  className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-sm hover:bg-emerald-500/30 transition-colors"
                >
                  Assign Role
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Overview */}
        <Panel title="Team Overview">
          <div className="space-y-3">
            <Link
              to={createPageUrl('OwnerManagers')}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-sm text-gray-900 dark:text-white">Client Managers</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{managers.length}</span>
            </Link>
            <Link
              to={createPageUrl('OwnerUsers')}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-sm text-gray-900 dark:text-white">Clients</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{clients.length}</span>
            </Link>
            <Link
              to={createPageUrl('OwnerUsers')}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-sm text-gray-900 dark:text-white">Sales Agents</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{agents.length}</span>
            </Link>
          </div>
        </Panel>

        {/* Recent Activity */}
        <Panel title="System Health" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-[#0E1116] rounded-sm">
              <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-2">Total Users</p>
              <p className="text-2xl font-light text-gray-900 dark:text-white">{allUsers.length}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0E1116] rounded-sm">
              <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-2">Total Leads</p>
              <p className="text-2xl font-light text-gray-900 dark:text-white">{leads.length}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0E1116] rounded-sm">
              <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-2">Total Projects</p>
              <p className="text-2xl font-light text-gray-900 dark:text-white">{projects.length}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0E1116] rounded-sm">
              <p className="text-[10px] font-mono uppercase text-gray-600 dark:text-gray-500 mb-2">Total Revenue</p>
              <p className="text-2xl font-light text-gray-900 dark:text-white">
                {formatCurrency(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.amount || 0), 0))}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
    </RoleGuard>
  );
}