import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainerMediaLogo from './components/ui/MainerMediaLogo';
import {
  LayoutDashboard,
  Folder,
  BarChart3,
  MessageSquare,
  FileText,
  CreditCard,
  Settings,
  Users,
  Target,
  DollarSign,
  Wallet,
  BookOpen,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Check,
  ExternalLink
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Redirect logic for onboarding
  React.useEffect(() => {
    if (!user) return;

    // Skip redirects for special pages
    if (currentPageName === 'AccountSetup' || currentPageName === 'AwaitingRole') return;

    // Check if user has completed account setup
    if (!user.display_name && !user.full_name) {
      navigate(createPageUrl('AccountSetup'));
      return;
    }

    // For non-admin users, check if they have a role assigned
    if (user.role !== 'admin') {
      // Wait for client/partner queries to complete
      if (client === undefined || partner === undefined) return;
      
      if (!client && !partner) {
        navigate(createPageUrl('AwaitingRole'));
        return;
      }
    }
  }, [user, client, partner, currentPageName, navigate]);

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const conversations = await base44.entities.Conversation.filter({});
      return conversations.filter(c => c.participant_ids?.includes(user.email) && c.unread_count > 0);
    },
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Notification.filter({ user_id: user.email, read: false }, '-created_date', 50);
    },
    enabled: !!user?.email,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadMessages.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const unreadNotificationsCount = notifications.length;

  // Determine user type based on role and entity data
  const getUserType = () => {
    if (user?.role === 'admin') return 'admin';
    if (partner?.status === 'Approved') return 'partner';
    if (client) return 'client';
    return 'client'; // Default
  };

  const userType = getUserType();

  const clientNav = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'ClientDashboard' },
    { name: 'Projects', icon: Folder, page: 'ClientProjects' },
    { name: 'Analytics', icon: BarChart3, page: 'ClientAnalytics' },
    { name: 'Messages', icon: MessageSquare, page: 'Messages', badge: unreadCount },
    { name: 'Documents', icon: FileText, page: 'ClientDocuments' },
    { name: 'Billing', icon: CreditCard, page: 'ClientBilling' },
    { name: 'Settings', icon: Settings, page: 'ClientSettings' },
  ];

  const partnerNav = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'PartnerDashboard' },
    { name: 'Leads', icon: Target, page: 'PartnerLeads' },
    { name: 'Commissions', icon: DollarSign, page: 'PartnerCommissions' },
    { name: 'Payouts', icon: Wallet, page: 'PartnerPayouts' },
    { name: 'Resources', icon: BookOpen, page: 'PartnerResources' },
    { name: 'Messages', icon: MessageSquare, page: 'Messages', badge: unreadCount },
    { name: 'Settings', icon: Settings, page: 'PartnerSettings' },
  ];

  const adminNav = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
    { name: 'Clients', icon: Users, page: 'AdminClients' },
    { name: 'Projects', icon: Folder, page: 'AdminProjects' },
    { name: 'Partners', icon: Users, page: 'AdminPartners' },
    { name: 'Leads', icon: Target, page: 'AdminLeads' },
    { name: 'Commissions', icon: DollarSign, page: 'AdminCommissions' },
    { name: 'Payouts', icon: Wallet, page: 'AdminPayouts' },
    { name: 'Content', icon: FileText, page: 'AdminContent' },
    { name: 'Analytics', icon: BarChart3, page: 'AdminAnalytics' },
    { name: 'Settings', icon: Settings, page: 'AdminSettings' },
  ];

  const navItems = userType === 'admin' ? adminNav : userType === 'partner' ? partnerNav : clientNav;

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const markNotificationAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { read: true });
    queryClient.invalidateQueries(['notifications']);
  };

  const markAllAsRead = async () => {
    for (const notification of notifications) {
      await base44.entities.Notification.update(notification.id, { read: true });
    }
    queryClient.invalidateQueries(['notifications']);
    setNotificationsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      {/* Grid pattern background */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0E1116]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to={createPageUrl(navItems[0]?.page)}>
              <MainerMediaLogo />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center bg-[#12161D] border border-white/[0.08] rounded-sm px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder:text-gray-600 ml-2 w-48"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[10px] font-mono text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#12161D] border border-white/[0.08] rounded-sm shadow-xl max-h-[500px] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
                    <h3 className="text-sm font-medium text-white">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${
                                  notification.type === 'alert' ? 'bg-red-500' :
                                  notification.type === 'warning' ? 'bg-amber-500' :
                                  notification.type === 'success' ? 'bg-emerald-500' :
                                  'bg-blue-500'
                                }`} />
                                <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{notification.message}</p>
                              <p className="text-[10px] text-gray-600">
                                {new Date(notification.created_date).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {notification.link && (
                                <Link
                                  to={createPageUrl(notification.link)}
                                  onClick={() => {
                                    markNotificationAsRead(notification.id);
                                    setNotificationsOpen(false);
                                  }}
                                  className="p-1 text-emerald-400 hover:text-emerald-300"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="p-1 text-gray-500 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-sm hover:bg-white/[0.05] transition-colors"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-sm object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-500 text-sm font-medium">
                      {(user?.display_name || user?.full_name)?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm text-white">{user?.display_name || user?.full_name || 'User'}</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase">
                    {userType}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#12161D] border border-white/[0.08] rounded-sm shadow-xl py-1">
                  <Link
                    to={createPageUrl(userType === 'admin' ? 'AdminSettings' : userType === 'partner' ? 'PartnerSettings' : 'ClientSettings')}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05]"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/[0.05]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 bottom-0 w-64 bg-[#0E1116]/80 backdrop-blur-xl border-r border-white/[0.08]
        transform transition-transform duration-300 ease-in-out z-30
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-emerald-500 text-white text-[10px] font-mono px-2 py-0.5 rounded-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}