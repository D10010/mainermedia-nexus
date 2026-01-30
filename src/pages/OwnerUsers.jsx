import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '../components/RoleGuard';
import Panel from '@/components/ui/Panel';
import DataTable from '@/components/ui/DataTable';
import SelectField from '@/components/ui/SelectField';
import Modal from '@/components/ui/Modal';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Users, Shield, UserCog, Briefcase, Target } from 'lucide-react';

export default function OwnerUsers() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return await base44.entities.User.update(userId, { user_role: role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      setRoleModalOpen(false);
      setSelectedUser(null);
      setNewRole('');
    },
  });

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.user_role || '');
    setRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: newRole
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner_admin': return <Shield className="w-4 h-4 text-purple-600 dark:text-purple-500" />;
      case 'client_manager': return <UserCog className="w-4 h-4 text-blue-600 dark:text-blue-500" />;
      case 'client': return <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />;
      case 'sales_agent': return <Target className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
      default: return <Users className="w-4 h-4 text-gray-600 dark:text-gray-500" />;
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      owner_admin: 'Owner Admin',
      client_manager: 'Client Manager',
      client: 'Client',
      sales_agent: 'Sales Agent'
    };
    return labels[role] || 'Unassigned';
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-sm object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-sm bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                {(user.display_name || user.email)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-900 dark:text-white">{user.display_name || user.full_name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-500">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(user.user_role)}
          <span className="text-sm text-gray-900 dark:text-white">{getRoleLabel(user.user_role)}</span>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Company',
      render: (user) => user.company_name || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span className={`text-xs px-2 py-1 rounded-sm ${
          user.status === 'Active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' :
          user.status === 'Paused' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500' :
          'bg-red-500/20 text-red-600 dark:text-red-500'
        }`}>
          {user.status || 'Active'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <button
          onClick={() => handleAssignRole(user)}
          className="text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          {user.user_role ? 'Change Role' : 'Assign Role'}
        </button>
      )
    }
  ];

  return (
    <RoleGuard allowedRoles={['owner_admin']}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">All Users</h1>
          <p className="text-gray-600 dark:text-gray-500 mt-1">Manage user roles and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-500">{allUsers.length} total users</span>
        </div>
      </div>

      <Panel>
        <DataTable
          columns={columns}
          data={allUsers}
        />
      </Panel>

      {/* Role Assignment Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Assign User Role"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0E1116] rounded-sm">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt="" className="w-12 h-12 rounded-sm object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-500 font-medium">
                    {(selectedUser.display_name || selectedUser.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.display_name || selectedUser.full_name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <SelectField
              label="Select Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { value: '', label: 'Select a role...' },
                { value: 'owner_admin', label: '👑 Owner Admin (Full System Access)' },
                { value: 'client_manager', label: '👨‍💼 Client Manager (Manage Assigned Clients)' },
                { value: 'client', label: '💼 Client (View Own Workspace)' },
                { value: 'sales_agent', label: '🎯 Sales Agent (Manage Own Referrals)' }
              ]}
              required
            />

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/[0.08]">
              <PrimaryButton
                variant="secondary"
                onClick={() => setRoleModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                variant="primary"
                onClick={handleSaveRole}
                loading={updateRoleMutation.isPending}
                disabled={!newRole}
                className="flex-1"
              >
                Assign Role
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </RoleGuard>
  );
}