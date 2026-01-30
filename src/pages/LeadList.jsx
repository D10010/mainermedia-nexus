import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, Filter } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { LEAD_STATUSES, getStatusColor } from '../components/utils/constants';

export default function LeadList() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allLeads = [] } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => base44.entities.Lead.list('-updated_date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  // Filter leads based on user role
  const leads = allLeads.filter(lead => {
    if (!user) return false;
    
    if (user.role === 'owner_admin') return true;
    if (user.role === 'internal_user') return lead.assigned_internal_user_id === user.email;
    if (user.role === 'external_user') return lead.created_by_user_id === user.email;
    
    return false;
  }).filter(lead => {
    if (statusFilter === 'all') return true;
    return lead.status === statusFilter;
  });

  const getUserName = (userId) => {
    const foundUser = allUsers.find(u => u.email === userId);
    return foundUser?.name || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Leads</h1>
          <p className="text-gray-500 mt-1">{leads.length} leads</p>
        </div>
        <Link
          to={createPageUrl('CreateLead')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#0E1116] border border-white/[0.08] text-white text-sm rounded outline-none focus:border-green-500"
        >
          <option value="all">All Status</option>
          {Object.entries(LEAD_STATUSES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Lead Table */}
      <div className="bg-[#0E1116] border border-white/[0.08] rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Lead Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Assigned To</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center">
                  <div className="space-y-3">
                    <p className="text-white text-lg">No leads yet</p>
                    <p className="text-gray-500 text-sm">Add your first lead to start tracking conversations and progress.</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={createPageUrl('LeadDetail') + `?id=${lead.id}`}
                      className="text-white hover:text-green-400 transition-colors"
                    >
                      {lead.lead_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{lead.company_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(lead.status)}`}>
                      {LEAD_STATUSES[lead.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getUserName(lead.assigned_internal_user_id) ? (
                      <span className="text-gray-400">{getUserName(lead.assigned_internal_user_id)}</span>
                    ) : (
                      <span className="text-gray-600">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatDistanceToNow(new Date(lead.updated_date), { addSuffix: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}