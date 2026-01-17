import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  User,
  Bell,
  Lock,
  Mail,
  Phone,
  Building2,
  Globe,
  Save,
  CheckCircle2,
  Upload,
  X
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function ClientSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const queryClient = useQueryClient();

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

  const [formData, setFormData] = useState({
    display_name: '',
    company_name: '',
    website: '',
    industry: '',
    phone: '',
    avatar_url: '',
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [notifications, setNotifications] = useState({
    email_updates: true,
    project_updates: true,
    billing_alerts: true,
    marketing: false,
  });

  // Initialize form data when user/client data loads
  React.useEffect(() => {
    if (user || client) {
      setFormData({
        display_name: user?.display_name || user?.full_name || '',
        company_name: client?.company_name || '',
        website: client?.website || '',
        industry: client?.industry || '',
        phone: user?.phone || '',
        avatar_url: user?.avatar_url || '',
      });
    }
  }, [user, client]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, avatar_url: file_url });
      
      // Update immediately
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
      // Update user profile
      await base44.auth.updateMe({
        display_name: formData.display_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
      });
      
      // Update client record if exists
      if (client?.id) {
        await base44.entities.Client.update(client.id, {
          company_name: formData.company_name,
          website: formData.website,
          industry: formData.industry,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['currentClient']);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Entertainment',
    'Real Estate', 'Education', 'Manufacturing', 'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
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
                          {formData.display_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{formData.display_name || 'Your Name'}</p>
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
                    label="Display Name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    icon={User}
                  />
                  <InputField
                    label="Email"
                    value={user?.email || ''}
                    disabled
                    icon={Mail}
                  />
                  <InputField
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    icon={Phone}
                  />
                  <InputField
                    label="Company Name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    icon={Building2}
                  />
                  <InputField
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    icon={Globe}
                  />
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full bg-[#0E1116] border border-white/[0.08] rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="">Select Industry</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
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

          {activeTab === 'notifications' && (
            <Panel title="Notification Preferences">
              <div className="space-y-4">
                {[
                  { key: 'email_updates', label: 'Email Updates', desc: 'Receive updates about your projects via email' },
                  { key: 'project_updates', label: 'Project Notifications', desc: 'Get notified when there are updates to your projects' },
                  { key: 'billing_alerts', label: 'Billing Alerts', desc: 'Receive alerts about invoices and payments' },
                  { key: 'marketing', label: 'Marketing Communications', desc: 'Receive tips, resources, and promotional content' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0E1116] rounded-sm">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={`
                        w-12 h-6 rounded-full transition-colors relative
                        ${notifications[item.key] ? 'bg-emerald-500' : 'bg-gray-700'}
                      `}
                    >
                      <div className={`
                        w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform
                        ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'}
                      `} />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === 'security' && (
            <Panel title="Security Settings">
              <div className="space-y-6">
                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <h3 className="text-white font-medium mb-2">Password</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Your password was last changed on January 1, 2024
                  </p>
                  <PrimaryButton variant="secondary" size="small">
                    Change Password
                  </PrimaryButton>
                </div>

                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <h3 className="text-white font-medium mb-2">Two-Factor Authentication</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <PrimaryButton variant="secondary" size="small">
                    Enable 2FA
                  </PrimaryButton>
                </div>

                <div className="p-4 bg-[#0E1116] rounded-sm border border-red-500/20">
                  <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <PrimaryButton variant="danger" size="small">
                    Delete Account
                  </PrimaryButton>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}