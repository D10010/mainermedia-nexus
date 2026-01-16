import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import MainerMediaLogo from '@/components/ui/MainerMediaLogo';

export default function Home() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['currentClient', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const clients = await base44.entities.Client.filter({ user_id: user.email });
      return clients[0] || null;
    },
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['currentPartner', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const partners = await base44.entities.Partner.filter({ user_id: user.email });
      return partners[0] || null;
    },
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const isLoading = userLoading || (user?.role !== 'admin' && (clientLoading || partnerLoading));

  useEffect(() => {
    if (isLoading || !user) return;

    // Redirect based on user type
    if (user.role === 'admin') {
      window.location.href = createPageUrl('AdminDashboard');
    } else if (partner?.status === 'Approved') {
      window.location.href = createPageUrl('PartnerDashboard');
    } else if (client) {
      window.location.href = createPageUrl('ClientDashboard');
    } else {
      // Default to client dashboard for new users
      window.location.href = createPageUrl('ClientDashboard');
    }
  }, [user, client, partner, isLoading]);

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      {/* Grid pattern background */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="text-center relative z-10">
        <MainerMediaLogo size="large" className="justify-center mb-8" />
        
        <div className="flex items-center justify-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-gray-400 text-sm font-mono">Loading your dashboard...</span>
        </div>

        {/* Loading spinner */}
        <div className="mt-8">
          <svg className="animate-spin h-8 w-8 mx-auto text-emerald-500" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
}