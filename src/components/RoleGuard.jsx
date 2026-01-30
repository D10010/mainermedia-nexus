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

  React.useEffect(() => {
    if (isLoading || !user) return;

    const userRole = user.user_role;

    // If user doesn't have an allowed role, redirect to their dashboard
    if (userRole && !allowedRoles.includes(userRole)) {
      const redirectMap = {
        owner_admin: 'OwnerDashboard',
        client_manager: 'ManagerDashboard',
        client: 'ClientDashboard',
        sales_agent: 'AgentDashboard'
      };
      navigate(createPageUrl(redirectMap[userRole]));
    }
  }, [user, isLoading, allowedRoles, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0c10]">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}