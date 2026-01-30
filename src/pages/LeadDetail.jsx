import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Send, Lock, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadDetail() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');

  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState('shared');
  const [newStatus, setNewStatus] = useState('');
  const [newAssignee, setNewAssignee] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.get(leadId),
    enabled: !!leadId,
  });

  const { data: allThreads = [] } = useQuery({
    queryKey: ['leadThreads', leadId],
    queryFn: () => base44.entities.LeadThread.filter({ lead_id: leadId }, '-created_date'),
    enabled: !!leadId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const internalUsers = allUsers.filter(u => u.role === 'internal_user' || u.role === 'owner_admin');

  // Filter threads based on user permissions
  const threads = allThreads.filter(thread => {
    if (!user) return false;
    
    if (user.role === 'owner_admin' || user.role === 'internal_user') return true;
    
    return thread.visibility === 'shared';
  });

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.LeadThread.create({
        lead_id: leadId,
        author_user_id: user.email,
        message_body: message,
        visibility: visibility
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leadThreads', leadId]);
      setMessage('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      return await base44.entities.Lead.update(leadId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', leadId]);
      queryClient.invalidateQueries(['allLeads']);
    },
  });

  const assignLeadMutation = useMutation({
    mutationFn: async (userId) => {
      return await base44.entities.Lead.update(leadId, { assigned_internal_user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', leadId]);
      queryClient.invalidateQueries(['allLeads']);
      setNewAssignee('');
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      createThreadMutation.mutate();
    }
  };

  const getUserName = (userId) => {
    const foundUser = allUsers.find(u => u.email === userId);
    return foundUser?.name || 'Unknown User';
  };

  const canManageLead = user?.role === 'owner_admin' || user?.role === 'internal_user';

  if (!lead) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={createPageUrl('LeadList')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-light text-white tracking-tight">{lead.lead_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0E1116] border border-white/[0.08] rounded p-6 space-y-4">
            <h2 className="text-lg text-white font-light">Lead Information</h2>
            
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Company</p>
              <p className="text-white">{lead.company_name}</p>
            </div>

            {lead.contact_email && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                <p className="text-white">{lead.contact_email}</p>
              </div>
            )}

            {lead.contact_phone && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                <p className="text-white">{lead.contact_phone}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Source</p>
              <p className="text-white capitalize">{lead.source}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Created</p>
              <p className="text-white">{format(new Date(lead.created_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Admin Controls */}
          {canManageLead && (
            <div className="bg-[#0E1116] border border-white/[0.08] rounded p-6 space-y-4">
              <h2 className="text-lg text-white font-light">Manage Lead</h2>
              
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-white/[0.08] text-white text-sm rounded outline-none focus:border-green-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="meeting_set">Meeting Set</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Assigned To</label>
                <select
                  value={lead.assigned_internal_user_id || ''}
                  onChange={(e) => assignLeadMutation.mutate(e.target.value || null)}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-white/[0.08] text-white text-sm rounded outline-none focus:border-green-500"
                >
                  <option value="">Unassigned</option>
                  {internalUsers.map(u => (
                    <option key={u.email} value={u.email}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Communication Thread */}
        <div className="lg:col-span-2">
          <div className="bg-[#0E1116] border border-white/[0.08] rounded overflow-hidden">
            <div className="p-6 border-b border-white/[0.08]">
              <h2 className="text-lg text-white font-light">Communication</h2>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {threads.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="bg-[#0a0c10] border border-white/[0.08] rounded p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium">{getUserName(thread.author_user_id)}</p>
                        {thread.visibility === 'internal' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            <Lock className="w-3 h-3" />
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(thread.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{thread.message_body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Message Form */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/[0.08] space-y-3">
              {canManageLead && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="shared"
                      checked={visibility === 'shared'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="text-green-500"
                    />
                    <span className="text-sm text-gray-400">Shared</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="internal"
                      checked={visibility === 'internal'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="text-green-500"
                    />
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Internal Only
                    </span>
                  </label>
                </div>
              )}
              
              <div className="flex gap-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows="3"
                  className="flex-1 px-4 py-2 bg-[#0a0c10] border border-white/[0.08] text-white rounded outline-none focus:border-green-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || createThreadMutation.isPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 self-end"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}