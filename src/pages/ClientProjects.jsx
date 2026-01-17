import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '../components/RoleGuard';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Folder,
  Calendar,
  Users,
  CheckCircle2,
  Circle,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import InputField from '@/components/ui/InputField';

export default function ClientProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);

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
    enabled: !!user?.email,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', client?.id],
    queryFn: () => base44.entities.Project.filter({ client_id: client.id }, '-created_date'),
    enabled: !!client?.id,
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

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

  return (
    <RoleGuard allowedRoles={['client']}>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Projects</h1>
        <p className="text-gray-500 mt-1">View and track all your projects with MAINERMEDIA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <InputField
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm whitespace-nowrap
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

          {/* Project Cards */}
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`
                  p-4 bg-[#12161D] border rounded-sm cursor-pointer transition-all duration-200
                  ${selectedProject?.id === project.id 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-emerald-500/20 flex items-center justify-center">
                      <Folder className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{project.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {project.start_date && format(new Date(project.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${selectedProject?.id === project.id ? 'rotate-90' : ''}`} />
                </div>
                
                <StatusBadge status={project.status} size="small" />
                
                <div className="mt-3">
                  <ProgressBar value={project.progress || 0} size="small" showLabel={false} />
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <EmptyState
                icon={Folder}
                title="No projects found"
                description={searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your filters" 
                  : "You don't have any projects yet"
                }
              />
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Header */}
              <Panel>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-light text-white">{selectedProject.name}</h2>
                    <p className="text-gray-500 mt-2">{selectedProject.description}</p>
                  </div>
                  <StatusBadge status={selectedProject.status} pulse={selectedProject.status === 'In Progress'} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Start Date</p>
                    <p className="text-white mt-1">
                      {selectedProject.start_date ? format(new Date(selectedProject.start_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">End Date</p>
                    <p className="text-white mt-1">
                      {selectedProject.end_date ? format(new Date(selectedProject.end_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Progress</p>
                    <p className="text-emerald-400 mt-1">{selectedProject.progress || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Team</p>
                    <p className="text-white mt-1">{selectedProject.team_members?.length || 0} members</p>
                  </div>
                </div>

                <div className="mt-6">
                  <ProgressBar value={selectedProject.progress || 0} />
                </div>
              </Panel>

              {/* Team Members */}
              {selectedProject.team_members?.length > 0 && (
                <Panel title="Team Members" accent>
                  <div className="flex flex-wrap gap-3">
                    {selectedProject.team_members.map((member, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#0E1116] px-3 py-2 rounded-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-emerald-500 text-[10px] font-medium">
                            {member[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-300">{member}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Milestones */}
              <Panel title="Milestones">
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div 
                      key={milestone.id}
                      className="flex items-start gap-4 relative"
                    >
                      {/* Timeline line */}
                      {index < milestones.length - 1 && (
                        <div className="absolute left-3 top-8 w-px h-full bg-white/[0.08]" />
                      )}
                      
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                        ${milestone.status === 'Completed' 
                          ? 'bg-emerald-500/20' 
                          : milestone.status === 'In Progress'
                          ? 'bg-blue-500/20'
                          : 'bg-gray-800'
                        }
                      `}>
                        {milestone.status === 'Completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className={`w-3 h-3 ${milestone.status === 'In Progress' ? 'text-blue-500' : 'text-gray-600'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`text-sm font-medium ${milestone.status === 'Completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                              {milestone.title}
                            </h4>
                            {milestone.description && (
                              <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <StatusBadge status={milestone.status} size="small" showDot={false} />
                            {milestone.due_date && (
                              <p className="text-[10px] font-mono text-gray-600 mt-1">
                                {format(new Date(milestone.due_date), 'MMM d')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {milestones.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No milestones added yet
                    </div>
                  )}
                </div>
              </Panel>

              {/* Deliverables */}
              <Panel title="Deliverables">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deliverables.map((deliverable) => (
                    <a
                      key={deliverable.id}
                      href={deliverable.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[#0E1116] rounded-sm border border-white/[0.05] hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-sm bg-gray-800 flex items-center justify-center">
                        <Folder className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{deliverable.name}</p>
                        <p className="text-[10px] text-gray-500">{deliverable.file_type}</p>
                      </div>
                    </a>
                  ))}
                  
                  {deliverables.length === 0 && (
                    <div className="col-span-2 text-center py-6 text-gray-500">
                      No deliverables available yet
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          ) : (
            <Panel>
              <EmptyState
                icon={Folder}
                title="Select a project"
                description="Choose a project from the list to view its details"
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}