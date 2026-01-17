import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Folder,
  Plus,
  Search,
  Calendar,
  Users,
  Edit2,
  CheckCircle2,
  Circle,
  Trash2,
  Upload,
  FileText
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import TextAreaField from '@/components/ui/TextAreaField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const queryClient = useQueryClient();

  const [newProject, setNewProject] = useState({
    client_id: '',
    name: '',
    description: '',
    status: 'Planning',
    start_date: '',
    end_date: '',
    team_members: '',
    budget: '',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['projectMilestones', selectedProject?.id],
    queryFn: () => base44.entities.Milestone.filter({ project_id: selectedProject.id }, 'order'),
    enabled: !!selectedProject?.id,
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ['projectDeliverables', selectedProject?.id],
    queryFn: () => base44.entities.Deliverable.filter({ project_id: selectedProject.id }),
    enabled: !!selectedProject?.id,
  });

  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'Pending',
  });

  const [newDeliverable, setNewDeliverable] = useState({
    name: '',
    file_url: '',
    file_type: 'Document',
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create({
      ...data,
      team_members: data.team_members ? data.team_members.split(',').map(s => s.trim()) : [],
      budget: data.budget ? parseFloat(data.budget) : null,
      progress: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allProjects']);
      setShowAddProject(false);
      setNewProject({ client_id: '', name: '', description: '', status: 'Planning', start_date: '', end_date: '', team_members: '', budget: '' });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allProjects']);
      setShowEditModal(false);
      setSelectedProject(null);
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data) => base44.entities.Milestone.create({
      ...data,
      project_id: selectedProject.id,
      order: milestones.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectMilestones']);
      setShowMilestoneModal(false);
      setNewMilestone({ title: '', description: '', due_date: '', status: 'Pending' });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Milestone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectMilestones']);
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id) => base44.entities.Milestone.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectMilestones']);
    },
  });

  const createDeliverableMutation = useMutation({
    mutationFn: (data) => base44.entities.Deliverable.create({
      ...data,
      project_id: selectedProject.id,
      uploaded_by: 'Admin',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectDeliverables']);
      setShowDeliverableModal(false);
      setNewDeliverable({ name: '', file_url: '', file_type: 'Document' });
    },
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: (id) => base44.entities.Deliverable.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectDeliverables']);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewDeliverable({
        ...newDeliverable,
        file_url,
        name: newDeliverable.name || file.name,
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const statuses = ['all', 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || 'Unknown Client';
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.company_name }));
  const statusOptions = [
    { value: 'Planning', label: 'Planning' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Projects</h1>
          <p className="text-gray-500 mt-1">Manage all client projects</p>
        </div>
        <PrimaryButton onClick={() => setShowAddProject(true)} icon={Plus}>
          Create Project
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <InputField
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-3 py-2 text-[10px] font-mono uppercase tracking-wider rounded-sm whitespace-nowrap
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

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => { setSelectedProject(project); setShowEditModal(true); }}
            className="p-5 bg-[#12161D] border border-white/[0.08] rounded-sm cursor-pointer hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{project.name}</h3>
                  <p className="text-xs text-gray-500">{getClientName(project.client_id)}</p>
                </div>
              </div>
              <StatusBadge status={project.status} size="small" />
            </div>

            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {project.description || 'No description'}
            </p>

            <ProgressBar value={project.progress || 0} size="small" />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {project.end_date ? format(new Date(project.end_date), 'MMM d') : '—'}
              </div>
              {project.team_members?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  {project.team_members.length}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Panel>
          <EmptyState
            icon={Folder}
            title="No projects found"
            description={searchTerm || statusFilter !== 'all'
              ? "Try adjusting your search or filters"
              : "Create your first project to get started"
            }
            actionLabel="Create Project"
            onAction={() => setShowAddProject(true)}
          />
        </Panel>
      )}

      {/* Add Project Modal */}
      <Modal
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
        title="Create New Project"
        size="large"
      >
        <form onSubmit={(e) => { e.preventDefault(); createProjectMutation.mutate(newProject); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Client"
              value={newProject.client_id}
              onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
              options={clientOptions}
              required
              placeholder="Select client"
            />
            <InputField
              label="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
              placeholder="Website Redesign"
            />
            <InputField
              label="Start Date"
              type="date"
              value={newProject.start_date}
              onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
            />
            <InputField
              label="End Date"
              type="date"
              value={newProject.end_date}
              onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
            />
            <InputField
              label="Budget"
              type="number"
              value={newProject.budget}
              onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              placeholder="10000"
            />
            <InputField
              label="Team Members"
              value={newProject.team_members}
              onChange={(e) => setNewProject({ ...newProject, team_members: e.target.value })}
              placeholder="John, Jane, Mike"
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Project description..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowAddProject(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createProjectMutation.isPending}
              disabled={!newProject.client_id || !newProject.name}
            >
              Create Project
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedProject(null); }}
        title="Edit Project"
        size="large"
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Project Name"
                value={selectedProject.name || ''}
                onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
              />
              <SelectField
                label="Status"
                value={selectedProject.status || 'Planning'}
                onChange={(e) => setSelectedProject({ ...selectedProject, status: e.target.value })}
                options={statusOptions}
              />
              <InputField
                label="Start Date"
                type="date"
                value={selectedProject.start_date || ''}
                onChange={(e) => setSelectedProject({ ...selectedProject, start_date: e.target.value })}
              />
              <InputField
                label="End Date"
                type="date"
                value={selectedProject.end_date || ''}
                onChange={(e) => setSelectedProject({ ...selectedProject, end_date: e.target.value })}
              />
              <InputField
                label="Progress (%)"
                type="number"
                min="0"
                max="100"
                value={selectedProject.progress || 0}
                onChange={(e) => setSelectedProject({ ...selectedProject, progress: parseInt(e.target.value) })}
              />
              <InputField
                label="Budget"
                type="number"
                value={selectedProject.budget || ''}
                onChange={(e) => setSelectedProject({ ...selectedProject, budget: parseFloat(e.target.value) })}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Description"
                  value={selectedProject.description || ''}
                  onChange={(e) => setSelectedProject({ ...selectedProject, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Milestones</h4>
                <PrimaryButton size="small" onClick={() => setShowMilestoneModal(true)}>
                  <Plus className="w-3 h-3" />
                  Add Milestone
                </PrimaryButton>
              </div>
              <div className="space-y-2">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-3 p-3 bg-[#0E1116] rounded-sm group">
                    <button
                      onClick={() => {
                        const newStatus = milestone.status === 'Completed' ? 'Pending' : 'Completed';
                        updateMilestoneMutation.mutate({ id: milestone.id, data: { status: newStatus } });
                      }}
                    >
                      {milestone.status === 'Completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-600 hover:text-emerald-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm text-white">{milestone.title}</p>
                      {milestone.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
                      )}
                    </div>
                    <StatusBadge status={milestone.status} size="small" showDot={false} />
                    <button
                      onClick={() => {
                        if (confirm('Delete this milestone?')) {
                          deleteMilestoneMutation.mutate(milestone.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No milestones yet</p>
                )}
              </div>
            </div>

            {/* Deliverables */}
            <div className="pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Deliverables</h4>
                <PrimaryButton size="small" onClick={() => setShowDeliverableModal(true)}>
                  <Plus className="w-3 h-3" />
                  Add Deliverable
                </PrimaryButton>
              </div>
              <div className="space-y-2">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center gap-3 p-3 bg-[#0E1116] rounded-sm group">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{deliverable.name}</p>
                      <p className="text-xs text-gray-500">{deliverable.file_type}</p>
                    </div>
                    <a
                      href={deliverable.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      View
                    </a>
                    <button
                      onClick={() => {
                        if (confirm('Delete this deliverable?')) {
                          deleteDeliverableMutation.mutate(deliverable.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {deliverables.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No deliverables yet</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <PrimaryButton variant="secondary" onClick={() => { setShowEditModal(false); setSelectedProject(null); }}>
                Cancel
              </PrimaryButton>
              <PrimaryButton 
                onClick={() => updateProjectMutation.mutate({ 
                  id: selectedProject.id, 
                  data: {
                    name: selectedProject.name,
                    description: selectedProject.description,
                    status: selectedProject.status,
                    start_date: selectedProject.start_date,
                    end_date: selectedProject.end_date,
                    progress: selectedProject.progress,
                    budget: selectedProject.budget,
                  }
                })}
                loading={updateProjectMutation.isPending}
              >
                Save Changes
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title="Add Milestone"
        size="default"
      >
        <form onSubmit={(e) => { e.preventDefault(); createMilestoneMutation.mutate(newMilestone); }} className="space-y-4">
          <InputField
            label="Milestone Title"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            required
            placeholder="Phase 1 Complete"
          />
          <TextAreaField
            label="Description"
            value={newMilestone.description}
            onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            placeholder="Describe this milestone..."
            rows={3}
          />
          <InputField
            label="Due Date"
            type="date"
            value={newMilestone.due_date}
            onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
          />
          <SelectField
            label="Status"
            value={newMilestone.status}
            onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })}
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowMilestoneModal(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createMilestoneMutation.isPending}
              disabled={!newMilestone.title}
            >
              Add Milestone
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Add Deliverable Modal */}
      <Modal
        isOpen={showDeliverableModal}
        onClose={() => setShowDeliverableModal(false)}
        title="Add Deliverable"
        size="default"
      >
        <form onSubmit={(e) => { e.preventDefault(); createDeliverableMutation.mutate(newDeliverable); }} className="space-y-4">
          <InputField
            label="Deliverable Name"
            value={newDeliverable.name}
            onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
            required
            placeholder="Final Logo Package"
          />
          
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400">
              Upload File <span className="text-red-400">*</span>
            </label>
            <label className="cursor-pointer block">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFile}
              />
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0E1116] border border-white/[0.08] rounded-sm text-gray-300 hover:border-emerald-500/50 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {uploadingFile ? 'Uploading...' : newDeliverable.file_url ? 'File uploaded' : 'Choose file'}
                </span>
              </div>
            </label>
          </div>

          <SelectField
            label="File Type"
            value={newDeliverable.file_type}
            onChange={(e) => setNewDeliverable({ ...newDeliverable, file_type: e.target.value })}
            options={[
              { value: 'Document', label: 'Document' },
              { value: 'Image', label: 'Image' },
              { value: 'Video', label: 'Video' },
              { value: 'Archive', label: 'Archive' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowDeliverableModal(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createDeliverableMutation.isPending}
              disabled={!newDeliverable.name || !newDeliverable.file_url}
            >
              Add Deliverable
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}