import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import MainerMediaLogo from '@/components/ui/MainerMediaLogo';

export default function AwaitingRole() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await base44.auth.logout();
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
        </div>

        <Panel>
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-sm bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-light text-white mb-2">Almost There!</h2>
              <p className="text-gray-400">
                Your account has been created successfully.
              </p>
            </div>

            {user?.avatar_url && (
              <div className="flex justify-center">
                <img 
                  src={user.avatar_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-sm object-cover"
                />
              </div>
            )}

            <div className="bg-[#0E1116] rounded-sm p-4 text-left space-y-2">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Name:</span> {user?.display_name || user?.full_name}
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Email:</span> {user?.email}
              </p>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-sm">
              <p className="text-sm text-amber-400">
                An administrator will assign you a role shortly. Once assigned, you'll be able to access the portal.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <PrimaryButton
                variant="secondary"
                onClick={handleRefresh}
                icon={RefreshCw}
                className="flex-1"
              >
                Check Again
              </PrimaryButton>
              <PrimaryButton
                variant="ghost"
                onClick={handleLogout}
                icon={LogOut}
                className="flex-1"
              >
                Sign Out
              </PrimaryButton>
            </div>
          </div>
        </Panel>

        <p className="text-center text-xs text-gray-600 mt-6">
          You'll receive an email notification when your account is ready
        </p>
      </div>
    </div>
  );
}