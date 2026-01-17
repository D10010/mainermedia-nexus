import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '../components/RoleGuard';
import { Bell, Check, X, Archive, Trash2, RefreshCw, ExternalLink, UserPlus } from 'lucide-react';
import Panel from '../components/ui/Panel';
import PrimaryButton from '../components/ui/PrimaryButton';
import Modal from '../components/ui/Modal';
import { createPageUrl } from '../utils';
import { Link, useNavigate } from 'react-router-dom';

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, unread, read, archived
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [assignRoleModal, setAssignRoleModal] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ['allNotifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Notification.filter({ user_id: user.email }, '-created_date', 200);
    },
    enabled: !!user?.email,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userEmail, role }) => {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) throw new Error('User not found');
      
      const targetUser = users[0];
      
      if (role === 'client') {
        await base44.entities.Client.create({
          user_id: userEmail,
          company_name: targetUser.display_name || targetUser.full_name || 'New Client',
          status: 'Active'
        });
      } else if (role === 'partner') {
        await base44.entities.Partner.create({
          user_id: userEmail,
          company_name: targetUser.display_name || targetUser.full_name || 'New Partner',
          status: 'Pending'
        });
      }
    },
    onSuccess: (_, variables) => {
      // Mark notification as read and archived
      if (assignRoleModal?.notificationId) {
        updateMutation.mutate({
          id: assignRoleModal.notificationId,
          data: { read: true, archived: true }
        });
      }
      setAssignRoleModal(null);
    },
  });

  const filteredNotifications = allNotifications.filter(n => {
    if (filter === 'unread') return !n.read && !n.archived;
    if (filter === 'read') return n.read && !n.archived;
    if (filter === 'archived') return n.archived;
    return !n.archived; // 'all' shows non-archived
  });

  const toggleRead = (notification) => {
    updateMutation.mutate({
      id: notification.id,
      data: { read: !notification.read }
    });
  };

  const archiveNotification = (notification) => {
    updateMutation.mutate({
      id: notification.id,
      data: { archived: true, read: true }
    });
  };

  const unarchiveNotification = (notification) => {
    updateMutation.mutate({
      id: notification.id,
      data: { archived: false }
    });
  };

  const deleteNotification = (id) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };

  const markAllAsRead = () => {
    filteredNotifications.forEach(n => {
      if (!n.read) {
        updateMutation.mutate({
          id: n.id,
          data: { read: true }
        });
      }
    });
  };

  const handleAssignRole = (notification) => {
    setAssignRoleModal({
      notificationId: notification.id,
      userEmail: notification.metadata?.user_email,
      userName: notification.metadata?.user_name || 'User'
    });
  };

  const stats = {
    total: allNotifications.filter(n => !n.archived).length,
    unread: allNotifications.filter(n => !n.read && !n.archived).length,
    archived: allNotifications.filter(n => n.archived).length,
  };

  return (
    <RoleGuard allowedRoles={['admin', 'client', 'partner']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
          <p className="text-sm text-gray-400">Manage your notifications and alerts</p>
        </div>
        {filteredNotifications.filter(n => !n.read).length > 0 && (
          <PrimaryButton onClick={markAllAsRead} size="small" variant="secondary">
            <Check className="w-4 h-4" />
            Mark All as Read
          </PrimaryButton>
        )}
      </div>

      {/* Stats & Filters */}
      <Panel>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Unread</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.unread}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Archived</p>
              <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {['all', 'unread', 'read', 'archived'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${
                  filter === f
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* Notifications List */}
      <Panel title={`${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`} noPadding>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {filter !== 'all' ? filter : ''} notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 hover:bg-white/[0.02] transition-colors ${
                  !notification.read ? 'bg-emerald-500/[0.02]' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator */}
                  <div className="mt-1">
                    <span className={`w-3 h-3 rounded-full block ${
                      notification.type === 'alert' ? 'bg-red-500' :
                      notification.type === 'warning' ? 'bg-amber-500' :
                      notification.type === 'success' ? 'bg-emerald-500' :
                      'bg-blue-500'
                    } ${!notification.read ? 'animate-pulse' : 'opacity-50'}`} />
                  </div>

                  {/* Content */}
                  <div 
                    className={`flex-1 min-w-0 ${notification.link ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (notification.link) {
                        const url = notification.metadata?.packageId 
                          ? createPageUrl(notification.link) + `?packageId=${notification.metadata.packageId}`
                          : createPageUrl(notification.link);
                        navigate(url);
                        updateMutation.mutate({
                          id: notification.id,
                          data: { read: true }
                        });
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {(() => {
                          const date = new Date(notification.created_date);
                          const estDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
                          return estDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' + estDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                        })()}
                      </span>
                    </div>
                    <p className={`text-sm mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-300'}`}>
                      {notification.message}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {notification.link && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = notification.metadata?.packageId 
                              ? createPageUrl(notification.link) + `?packageId=${notification.metadata.packageId}`
                              : createPageUrl(notification.link);
                            navigate(url);
                            updateMutation.mutate({
                              id: notification.id,
                              data: { read: true }
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {notification.metadata?.packageId ? 'Send Package' : 'View Details'}
                        </button>
                      )}

                      {/* Admin: Assign Role Button */}
                      {user?.role === 'admin' && notification.metadata?.user_email && (
                        <button
                          onClick={() => handleAssignRole(notification)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-sm hover:bg-blue-500/30 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          Assign Role
                        </button>
                      )}

                      <button
                        onClick={() => toggleRead(notification)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white/[0.05] text-gray-400 rounded-sm hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Mark as {notification.read ? 'Unread' : 'Read'}
                      </button>

                      {!notification.archived ? (
                        <button
                          onClick={() => archiveNotification(notification)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white/[0.05] text-gray-400 rounded-sm hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                          <Archive className="w-3 h-3" />
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => unarchiveNotification(notification)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white/[0.05] text-gray-400 rounded-sm hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Unarchive
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-500/10 text-red-400 rounded-sm hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Assign Role Modal */}
      <Modal
        isOpen={!!assignRoleModal}
        onClose={() => setAssignRoleModal(null)}
        title="Assign User Role"
        size="small"
      >
        {assignRoleModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Assign a role to <span className="text-white font-medium">{assignRoleModal.userName}</span> ({assignRoleModal.userEmail})
            </p>
            <div className="grid grid-cols-2 gap-3">
              <PrimaryButton
                onClick={() => {
                  assignRoleMutation.mutate({ userEmail: assignRoleModal.userEmail, role: 'client' });
                }}
                loading={assignRoleMutation.isPending}
                className="w-full"
              >
                Assign as Client
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  assignRoleMutation.mutate({ userEmail: assignRoleModal.userEmail, role: 'partner' });
                }}
                loading={assignRoleMutation.isPending}
                variant="secondary"
                className="w-full"
              >
                Assign as Partner
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </RoleGuard>
  );
}