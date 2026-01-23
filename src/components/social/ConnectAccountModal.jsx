import React, { useState } from 'react';
import Modal from '../ui/Modal';
import PrimaryButton from '../ui/PrimaryButton';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

const PLATFORMS = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Twitter', label: 'Twitter' },
];

export default function ConnectAccountModal({ isOpen, onClose, clientId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    platform: '',
    account_name: '',
    account_url: '',
  });

  const createAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialMediaAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialAccounts']);
      onClose();
      setFormData({ platform: '', account_name: '', account_url: '' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAccountMutation.mutate({
      ...formData,
      client_id: clientId,
      is_active: true,
      connection_status: 'Connected',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Social Media Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Platform"
          value={formData.platform}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          options={PLATFORMS}
          required
        />
        
        <InputField
          label="Account Name"
          placeholder="e.g., @yourcompany"
          value={formData.account_name}
          onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
          required
        />
        
        <InputField
          label="Profile URL"
          placeholder="https://..."
          value={formData.account_url}
          onChange={(e) => setFormData({ ...formData, account_url: e.target.value })}
          required
        />

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-3">
          <p className="text-xs text-amber-400">
            <strong>Note:</strong> Full API integration requires OAuth setup for each platform. 
            For now, you can add accounts manually and we'll track metrics as they're entered.
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
          <PrimaryButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            type="submit"
            variant="primary"
            icon={Plus}
            loading={createAccountMutation.isPending}
            disabled={createAccountMutation.isPending || !formData.platform || !formData.account_name}
          >
            Connect Account
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}