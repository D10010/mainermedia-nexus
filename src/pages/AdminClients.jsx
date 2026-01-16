import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Users,
  Plus,
  Search,
  Mail,
  Building2,
  Globe,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import TextAreaField from '@/components/ui/TextAreaField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminClients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const [newClient, setNewClient] = useState({
    email: '',
    company_name: '',
    website: '',
    industry: '',
    notes: '',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createClientMutation = useMutation({
    mutationFn: async (data) => {
      // First invite the user
      await base44.users.inviteUser(data.email, 'user');
      
      // Then create the client record
      await base44.entities.Client.create({
        user_id: data.email,
        company_name: data.company_name,
        website: data.website,
        industry: data.industry,
        notes: data.notes,
        status: 'Active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allClients']);
      setShowAddClient(false);
      setNewClient({ email: '', company_name: '', website: '', industry: '', notes: '' });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allClients']);
      setShowEditModal(false);
      setSelectedClient(null);
    },
  });

  const statuses = ['all', 'Active', 'Paused', 'Churned'];
  const industries = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Education', label: 'Education' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Other', label: 'Other' },
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientProjects = (clientId) => {
    return projects.filter(p => p.client_id === clientId);
  };

  const columns = [
    {
      key: 'company_name',
      label: 'Client',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500 font-medium">
              {row.company_name?.[0]?.toUpperCase() || 'C'}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{row.company_name}</p>
            <p className="text-xs text-gray-500">{row.user_id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'industry',
      label: 'Industry',
      render: (row) => <span className="text-gray-400">{row.industry || '—'}</span>
    },
    {
      key: 'projects',
      label: 'Projects',
      render: (row) => {
        const clientProjects = getClientProjects(row.id);
        const activeCount = clientProjects.filter(p => p.status === 'In Progress').length;
        return (
          <span className="text-gray-400">
            {clientProjects.length} total, {activeCount} active
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="small" />
    },
    {
      key: 'created_date',
      label: 'Joined',
      render: (row) => (
        <span className="text-xs font-mono text-gray-500">
          {format(new Date(row.created_date), 'MMM d, yyyy')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedClient(row); setShowEditModal(true); }}
            className="p-2 text-gray-500 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your client accounts</p>
        </div>
        <PrimaryButton onClick={() => setShowAddClient(true)} icon={Plus}>
          Add Client
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <InputField
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-3 py-2 text-[10px] font-mono uppercase tracking-wider rounded-sm
                transition-all duration-200
                ${statusFilter === status
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#12161D] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                }
              `}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <Panel noPadding>
        {filteredClients.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredClients}
            onRowClick={(row) => { setSelectedClient(row); setShowEditModal(true); }}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No clients found"
              description={searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filters" 
                : "Add your first client to get started"
              }
              actionLabel="Add Client"
              onAction={() => setShowAddClient(true)}
            />
          </div>
        )}
      </Panel>

      {/* Add Client Modal */}
      <Modal
        isOpen={showAddClient}
        onClose={() => setShowAddClient(false)}
        title="Add New Client"
        size="large"
      >
        <form onSubmit={(e) => { e.preventDefault(); createClientMutation.mutate(newClient); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              required
              placeholder="client@company.com"
              icon={Mail}
            />
            <InputField
              label="Company Name"
              value={newClient.company_name}
              onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
              required
              placeholder="Acme Inc."
              icon={Building2}
            />
            <InputField
              label="Website"
              value={newClient.website}
              onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
              placeholder="https://example.com"
              icon={Globe}
            />
            <SelectField
              label="Industry"
              value={newClient.industry}
              onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
              options={industries}
              placeholder="Select industry"
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="Notes"
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                placeholder="Internal notes about this client..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowAddClient(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createClientMutation.isPending}
              disabled={!newClient.email || !newClient.company_name}
            >
              Send Invite
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedClient(null); }}
        title="Edit Client"
        size="large"
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name"
                value={selectedClient.company_name || ''}
                onChange={(e) => setSelectedClient({ ...selectedClient, company_name: e.target.value })}
                icon={Building2}
              />
              <InputField
                label="Website"
                value={selectedClient.website || ''}
                onChange={(e) => setSelectedClient({ ...selectedClient, website: e.target.value })}
                icon={Globe}
              />
              <SelectField
                label="Industry"
                value={selectedClient.industry || ''}
                onChange={(e) => setSelectedClient({ ...selectedClient, industry: e.target.value })}
                options={industries}
              />
              <SelectField
                label="Status"
                value={selectedClient.status || 'Active'}
                onChange={(e) => setSelectedClient({ ...selectedClient, status: e.target.value })}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Paused', label: 'Paused' },
                  { value: 'Churned', label: 'Churned' },
                ]}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Internal Notes"
                  value={selectedClient.notes || ''}
                  onChange={(e) => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <PrimaryButton variant="secondary" onClick={() => { setShowEditModal(false); setSelectedClient(null); }}>
                Cancel
              </PrimaryButton>
              <PrimaryButton 
                onClick={() => updateClientMutation.mutate({ 
                  id: selectedClient.id, 
                  data: {
                    company_name: selectedClient.company_name,
                    website: selectedClient.website,
                    industry: selectedClient.industry,
                    status: selectedClient.status,
                    notes: selectedClient.notes,
                  }
                })}
                loading={updateClientMutation.isPending}
              >
                Save Changes
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}