import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Send, Users, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { LEAD_STATUSES } from '@/components/utils/constants';

export default function ReferralDetail() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');

  const [message, setMessage] = useState('');

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
    queryFn: () => base44.entities.LeadThread.filter({ lead_id: leadId, visibility: 'shared' }, '-created_date'),
    enabled: !!leadId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.LeadThread.create({
        lead_id: leadId,
        author_user_id: user.email,
        message_body: message,
        visibility: 'shared'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leadThreads', leadId]);
      setMessage('');
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

  if (!lead) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={createPageUrl('MyReferrals')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-light text-white tracking-tight">{lead.lead_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-1">
          <div className="bg-[#0E1116] border border-white/[0.08] rounded p-6 space-y-4">
            <h2 className="text-lg text-white font-light">Referral Information</h2>
            
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
              <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
              <p className="text-white">{LEAD_STATUSES[lead.status]}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Submitted</p>
              <p className="text-white">{formatDistanceToNow(new Date(lead.created_date), { addSuffix: true })}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Last Updated</p>
              <p className="text-white">{formatDistanceToNow(new Date(lead.updated_date), { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        {/* Communication Thread */}
        <div className="lg:col-span-2">
          <div className="bg-[#0E1116] border border-white/[0.08] rounded overflow-hidden">
            <div className="p-6 border-b border-white/[0.08]">
              <h2 className="text-lg text-white font-light">Messages</h2>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {allThreads.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-white">No messages yet</p>
                  <p className="text-gray-500 text-sm">Start a conversation with the MAINERMEDIA team.</p>
                </div>
              ) : (
                allThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="bg-[#0a0c10] border border-white/[0.08] rounded p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white font-medium">{getUserName(thread.author_user_id)}</p>
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
              <div className="flex items-start gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Messages are visible to the MAINERMEDIA team</span>
              </div>
              
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