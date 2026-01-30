import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubmitReferral() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    lead_name: '',
    company_name: '',
    contact_email: '',
    contact_phone: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.Lead.create({
        ...formData,
        created_by_user_id: user.email,
        source: 'referral',
        status: 'new'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['myReferrals']);
      queryClient.invalidateQueries(['allLeads']);
      navigate(createPageUrl('ReferralDetail') + `?id=${data.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={createPageUrl('MyReferrals')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-light text-white tracking-tight">Submit Referral</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0E1116] border border-white/[0.08] rounded p-6 space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Lead Name *</label>
          <input
            type="text"
            value={formData.lead_name}
            onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
            className="w-full px-4 py-2 bg-[#0a0c10] border border-white/[0.08] text-white rounded outline-none focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Company Name *</label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full px-4 py-2 bg-[#0a0c10] border border-white/[0.08] text-white rounded outline-none focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Contact Email</label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            className="w-full px-4 py-2 bg-[#0a0c10] border border-white/[0.08] text-white rounded outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Contact Phone</label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            className="w-full px-4 py-2 bg-[#0a0c10] border border-white/[0.08] text-white rounded outline-none focus:border-green-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Submitting...' : 'Submit Referral'}
          </button>
          <Link
            to={createPageUrl('MyReferrals')}
            className="px-6 py-2 border border-white/[0.08] text-gray-400 hover:text-white rounded transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}