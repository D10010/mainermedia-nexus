import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  User,
  Wallet,
  Building2,
  CreditCard,
  Upload,
  Save,
  CheckCircle2,
  X
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function PartnerSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partner } = useQuery({
    queryKey: ['currentPartner', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const partners = await base44.entities.Partner.filter({ user_id: user.email });
      return partners[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    payment_method: 'PayPal',
    payment_details: '',
    avatar_url: '',
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user || partner) {
      setFormData({
        full_name: user?.full_name || '',
        company_name: partner?.company_name || '',
        payment_method: partner?.payment_method || 'PayPal',
        payment_details: partner?.payment_details || '',
        avatar_url: user?.avatar_url || '',
      });
    }
  }, [user, partner]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, avatar_url: file_url });
      
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries(['currentUser']);
      
      setSuccessMessage('Avatar updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setFormData({ ...formData, avatar_url: '' });
    await base44.auth.updateMe({ avatar_url: '' });
    queryClient.invalidateQueries(['currentUser']);
    setSuccessMessage('Avatar removed');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
      });
      
      if (partner?.id) {
        await base44.entities.Partner.update(partner.id, {
          company_name: formData.company_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['currentPartner']);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      if (partner?.id) {
        await base44.entities.Partner.update(partner.id, {
          payment_method: formData.payment_method,
          payment_details: formData.payment_details,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentPartner']);
      setSuccessMessage('Payment settings updated');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const paymentMethods = [
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Bank Transfer', label: 'Bank Transfer (ACH)' },
    { value: 'Check', label: 'Check' },
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payment', label: 'Payment', icon: Wallet },
    { id: 'tax', label: 'Tax Info', icon: CreditCard },
  ];

  const getPaymentPlaceholder = () => {
    switch (formData.payment_method) {
      case 'PayPal': return 'PayPal email address';
      case 'Bank Transfer': return 'Bank account details';
      case 'Check': return 'Mailing address';
      default: return 'Payment details';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your partner account and payout settings</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-400">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <Panel noPadding>
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all
                    ${activeTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Panel>

          {/* Stats */}
          <Panel title="Account Stats" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Commission Rate</span>
                <span className="text-sm text-emerald-400">{partner?.commission_rate || 10}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`text-sm ${partner?.status === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {partner?.status || 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Available Balance</span>
                <span className="text-sm text-white">${partner?.available_balance?.toLocaleString() || 0}</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Panel title="Profile Information">
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {formData.avatar_url ? (
                      <div className="relative w-20 h-20 rounded-sm overflow-hidden">
                        <img 
                          src={formData.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeAvatar}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-sm transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-500 text-2xl font-medium">
                          {formData.full_name?.[0]?.toUpperCase() || 'P'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{formData.full_name || 'Partner'}</p>
                    <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-[#0E1116] border border-white/[0.08] rounded-sm text-gray-300 hover:text-white hover:border-emerald-500/50 transition-colors">
                        <Upload className="w-3 h-3" />
                        {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/[0.08]">
                  <InputField
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    icon={User}
                  />
                  <InputField
                    label="Company Name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    icon={Building2}
                  />
                </div>

                <div className="flex justify-end pt-6 border-t border-white/[0.08]">
                  <PrimaryButton
                    onClick={() => updateProfileMutation.mutate()}
                    loading={updateProfileMutation.isPending}
                    icon={Save}
                  >
                    Save Changes
                  </PrimaryButton>
                </div>
              </div>
            </Panel>
          )}

          {activeTab === 'payment' && (
            <Panel title="Payment Settings">
              <div className="space-y-6">
                <SelectField
                  label="Payment Method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  options={paymentMethods}
                />

                <InputField
                  label={formData.payment_method === 'PayPal' ? 'PayPal Email' : 
                         formData.payment_method === 'Bank Transfer' ? 'Bank Details' : 'Mailing Address'}
                  value={formData.payment_details}
                  onChange={(e) => setFormData({ ...formData, payment_details: e.target.value })}
                  placeholder={getPaymentPlaceholder()}
                />

                {formData.payment_method === 'Bank Transfer' && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                    <p className="text-xs text-amber-400">
                      Please include: Bank name, Routing number, Account number, and Account holder name
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-white/[0.08]">
                  <PrimaryButton
                    onClick={() => updatePaymentMutation.mutate()}
                    loading={updatePaymentMutation.isPending}
                    icon={Save}
                  >
                    Save Payment Settings
                  </PrimaryButton>
                </div>
              </div>
            </Panel>
          )}

          {activeTab === 'tax' && (
            <Panel title="Tax Information">
              <div className="space-y-6">
                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <h3 className="text-white font-medium mb-2">W-9 Form</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    US-based partners must provide a completed W-9 form for tax reporting purposes.
                  </p>
                  {partner?.w9_url ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-emerald-400 text-sm">W-9 on file</span>
                      <a 
                        href={partner.w9_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-500 text-sm hover:underline ml-auto"
                      >
                        View
                      </a>
                    </div>
                  ) : (
                    <PrimaryButton variant="secondary" size="small" icon={Upload}>
                      Upload W-9
                    </PrimaryButton>
                  )}
                </div>

                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <h3 className="text-white font-medium mb-2">Tax ID / EIN</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Your Employer Identification Number (EIN) or Social Security Number (SSN) for tax purposes.
                  </p>
                  <InputField
                    placeholder="XX-XXXXXXX"
                    value=""
                    onChange={() => {}}
                  />
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                  <p className="text-xs text-amber-400">
                    Tax documents are securely stored and only used for IRS reporting requirements. 
                    Partners earning over $600 annually will receive a 1099-NEC form.
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}