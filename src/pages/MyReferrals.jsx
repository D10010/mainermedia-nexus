import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LEAD_STATUSES, getStatusColor } from '@/components/utils/constants';

export default function MyReferrals() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allLeads = [] } = useQuery({
    queryKey: ['myReferrals'],
    queryFn: () => base44.entities.Lead.filter({ 
      created_by_user_id: user?.email,
      source: 'referral'
    }, '-updated_date'),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">My Referrals</h1>
          <p className="text-gray-500 mt-1">{allLeads.length} referrals</p>
        </div>
        <Link
          to={createPageUrl('SubmitReferral')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Submit Referral
        </Link>
      </div>

      {/* Referrals Table */}
      <div className="bg-[#0E1116] border border-white/[0.08] rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Lead Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {allLeads.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center">
                  <div className="space-y-3">
                    <p className="text-white text-lg">No referrals yet</p>
                    <p className="text-gray-500 text-sm">Submit your first referral to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              allLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={createPageUrl('ReferralDetail') + `?id=${lead.id}`}
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