import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Upload, X, ArrowRight } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import MainerMediaLogo from '@/components/ui/MainerMediaLogo';

export default function AccountSetup() {
  const queryClient = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    avatar_url: '',
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, avatar_url: file_url });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setFormData({ ...formData, avatar_url: '' });
  };

  const setupMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        display_name: formData.display_name,
        avatar_url: formData.avatar_url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      window.location.reload();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.display_name.trim()) {
      setupMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6">
      {/* Grid pattern background */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <MainerMediaLogo size="large" />
          </div>
          <h1 className="text-3xl font-light text-white mb-2">Welcome!</h1>
          <p className="text-gray-400">Let's set up your account</p>
        </div>

        <Panel>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {formData.avatar_url ? (
                  <div className="relative w-24 h-24 rounded-sm overflow-hidden">
                    <img 
                      src={formData.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-sm transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-500 text-3xl font-medium">
                      {formData.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#0E1116] border border-white/[0.08] rounded-sm text-gray-300 hover:text-white hover:border-emerald-500/50 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingAvatar ? 'Uploading...' : 'Upload Profile Picture'}
                </span>
              </label>
            </div>

            {/* Display Name */}
            <InputField
              label="Display Name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Enter your name"
              required
              icon={User}
            />

            <div className="pt-4">
              <PrimaryButton
                type="submit"
                className="w-full"
                loading={setupMutation.isPending}
                disabled={!formData.display_name.trim()}
                icon={ArrowRight}
              >
                Complete Setup
              </PrimaryButton>
            </div>
          </form>
        </Panel>

        <p className="text-center text-xs text-gray-600 mt-6">
          After setup, you'll need to wait for an admin to assign your role
        </p>
      </div>
    </div>
  );
}