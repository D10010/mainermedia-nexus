import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function RoleGuard({ allowedRoles, children }) {
  const navigate = useNavigate();
  
  const { data: user, isLoading } = useQuery({
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
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const { data: partner } = useQuery({
    queryKey: ['currentPartner', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const partners = await base44.entities.Partner.filter({ user_id: user.email });
      return partners[0] || null;
    },
    enabled: !!user?.email && user?.role !== 'admin',
  });

  React.useEffect(() => {
    if (isLoading || !user) return;

    let userRole = null;
    
    if (user.role === 'admin') {
      userRole = 'admin';
    } else if (partner?.status === 'Approved') {
      userRole = 'partner';
    } else if (client) {
      userRole = 'client';
    }

    // If user doesn't have an allowed role, redirect to their dashboard
    if (userRole && !allowedRoles.includes(userRole)) {
      const redirectMap = {
        admin: 'AdminDashboard',
        client: 'ClientDashboard',
        partner: 'PartnerDashboard'
      };
      navigate(createPageUrl(redirectMap[userRole]));
    }
  }, [user, client, partner, isLoading, allowedRoles, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}