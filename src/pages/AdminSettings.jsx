import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Settings,
  Users,
  DollarSign,
  Mail,
  Palette,
  Shield,
  Save,
  Plus,
  CheckCircle2,
  Upload,
  X,
  User as UserIcon
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [profileData, setProfileData] = useState({
    full_name: '',
    avatar_url: '',
  });

  React.useEffect(() => {
    if (currentUser) {
      setProfileData({
        full_name: currentUser.full_name || '',
        avatar_url: currentUser.avatar_url || '',
      });
    }
  }, [currentUser]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({ ...profileData, avatar_url: file_url });
      
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
    setProfileData({ ...profileData, avatar_url: '' });
    await base44.auth.updateMe({ avatar_url: '' });
    queryClient.invalidateQueries(['currentUser']);
    setSuccessMessage('Avatar removed');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const [commissionSettings, setCommissionSettings] = useState({
    default_rate: 10,
    min_payout: 100,
    payout_schedule: 'monthly',
  });

  const inviteAdminMutation = useMutation({
    mutationFn: async (email) => {
      await base44.users.inviteUser(email, 'admin');
    },
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail('');
      setSuccessMessage('Admin invited successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const adminUsers = users.filter(u => u.role === 'admin');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your portal settings</p>
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
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profileData.avatar_url ? (
                      <div className="relative w-20 h-20 rounded-sm overflow-hidden">
                        <img 
                          src={profileData.avatar_url} 
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
                          {profileData.full_name?.[0]?.toUpperCase() || 'A'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{profileData.full_name || 'Admin'}</p>
                    <p className="text-gray-500 text-sm mb-3">{currentUser?.email}</p>
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

                <div className="pt-6 border-t border-white/[0.08]">
                  <InputField
                    label="Display Name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    icon={UserIcon}
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

          {activeTab === 'team' && (
            <Panel title="Team Members">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    Manage admin access to the portal
                  </p>
                  <PrimaryButton onClick={() => setShowInviteModal(true)} icon={Plus} size="small">
                    Invite Admin
                  </PrimaryButton>
                </div>

                <div className="space-y-3">
                  {adminUsers.map((admin) => (
                    <div 
                      key={admin.id}
                      className="flex items-center justify-between p-4 bg-[#0E1116] rounded-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-emerald-500 font-medium">
                            {admin.full_name?.[0]?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{admin.full_name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-sm uppercase">
                        Admin
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {activeTab === 'commissions' && (
            <Panel title="Commission Settings">
              <div className="space-y-6">
                <InputField
                  label="Default Commission Rate (%)"
                  type="number"
                  min="1"
                  max="50"
                  value={commissionSettings.default_rate}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, default_rate: parseInt(e.target.value) })}
                  icon={DollarSign}
                />
                
                <InputField
                  label="Minimum Payout Amount ($)"
                  type="number"
                  min="50"
                  value={commissionSettings.min_payout}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, min_payout: parseInt(e.target.value) })}
                  icon={DollarSign}
                />

                <div className="space-y-2">
                  <label className="block text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400">
                    Payout Schedule
                  </label>
                  <div className="flex gap-2">
                    {['weekly', 'biweekly', 'monthly'].map((schedule) => (
                      <button
                        key={schedule}
                        onClick={() => setCommissionSettings({ ...commissionSettings, payout_schedule: schedule })}
                        className={`
                          px-4 py-2 text-sm rounded-sm transition-all capitalize
                          ${commissionSettings.payout_schedule === schedule
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#0E1116] text-gray-400 border border-white/[0.08] hover:text-white'
                          }
                        `}
                      >
                        {schedule}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-white/[0.08]">
                  <PrimaryButton icon={Save}>
                    Save Settings
                  </PrimaryButton>
                </div>
              </div>
            </Panel>
          )}

          {activeTab === 'email' && (
            <Panel title="Email Templates">
              <div className="space-y-4">
                {[
                  { name: 'Welcome Email', desc: 'Sent when a new client or partner joins' },
                  { name: 'Invoice Notification', desc: 'Sent when a new invoice is created' },
                  { name: 'Lead Status Update', desc: 'Sent to partners when lead status changes' },
                  { name: 'Payout Notification', desc: 'Sent when a payout is processed' },
                ].map((template) => (
                  <div 
                    key={template.name}
                    className="flex items-center justify-between p-4 bg-[#0E1116] rounded-sm"
                  >
                    <div>
                      <p className="text-white font-medium">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{template.desc}</p>
                    </div>
                    <PrimaryButton variant="secondary" size="small">
                      Edit
                    </PrimaryButton>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === 'security' && (
            <Panel title="Security Settings">
              <div className="space-y-6">
                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-gray-700 relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-0.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Session Timeout</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Automatically log out inactive users
                      </p>
                    </div>
                    <select className="bg-[#12161D] border border-white/[0.08] rounded-sm px-3 py-2 text-sm text-white">
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="480">8 hours</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-[#0E1116] rounded-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">IP Whitelisting</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Restrict admin access to specific IPs
                      </p>
                    </div>
                    <PrimaryButton variant="secondary" size="small">
                      Configure
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Invite Admin Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Admin"
      >
        <form onSubmit={(e) => { e.preventDefault(); inviteAdminMutation.mutate(inviteEmail); }} className="space-y-6">
          <InputField
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            placeholder="admin@mainermedia.com"
            icon={Mail}
          />
          
          <p className="text-xs text-gray-500">
            The invited user will receive an email with instructions to set up their admin account.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowInviteModal(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={inviteAdminMutation.isPending}
              disabled={!inviteEmail}
            >
              Send Invite
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}