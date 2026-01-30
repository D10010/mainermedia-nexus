import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { List, LogOut, TrendingUp } from 'lucide-react';
import { ROLE_LABELS } from '@/components/utils/constants';

export default function Layout({ children }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isSalesAgent = user?.role === 'sales_agent';
  const isAdminOrInternal = user?.role === 'owner_admin' || user?.role === 'internal_user';

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      {/* Header */}
      <header className="bg-[#0E1116] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-light text-white tracking-tight">MAINERMEDIA NEXUS</h1>
            <nav className="flex items-center gap-6">
              {isSalesAgent ? (
                <Link
                  to={createPageUrl('MyReferrals')}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  My Referrals
                </Link>
              ) : isAdminOrInternal ? (
                <Link
                  to={createPageUrl('LeadList')}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <List className="w-4 h-4" />
                  Leads
                </Link>
              ) : null}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-white">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] || user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}