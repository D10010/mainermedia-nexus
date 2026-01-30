import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  FileText,
  Folder,
  Download,
  Search,
  Filter,
  File,
  Image,
  Video,
  Archive,
  ExternalLink
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import EmptyState from '@/components/ui/EmptyState';

const categoryIcons = {
  Contract: FileText,
  'Brand Asset': Image,
  Deliverable: Folder,
  Report: FileText,
  Resource: File,
  Other: File
};

const fileTypeIcons = {
  Document: FileText,
  Image: Image,
  Video: Video,
  Archive: Archive,
  Other: File
};

export default function ClientDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  const { data: documents = [] } = useQuery({
    queryKey: ['clientDocuments', client?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: client.id }, '-created_date'),
    enabled: !!client?.id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', client?.id],
    queryFn: () => base44.entities.Project.filter({ client_id: client.id }),
    enabled: !!client?.id,
  });

  const categories = ['all', 'Contract', 'Brand Asset', 'Deliverable', 'Report', 'Resource', 'Other'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group documents by project
  const groupedByProject = filteredDocuments.reduce((acc, doc) => {
    const projectId = doc.project_id || 'general';
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(doc);
    return acc;
  }, {});

  const getProjectName = (projectId) => {
    if (projectId === 'general') return 'General Documents';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Documents</h1>
        <p className="text-gray-500 mt-1">Access your contracts, brand assets, and deliverables</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <InputField
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`
                px-3 py-2 text-[10px] font-mono uppercase tracking-wider rounded-sm whitespace-nowrap
                transition-all duration-200
                ${categoryFilter === category
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#12161D] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                }
              `}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Documents by Project */}
      {Object.keys(groupedByProject).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByProject).map(([projectId, docs]) => (
            <Panel key={projectId} title={getProjectName(projectId)} accent={projectId !== 'general'}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => {
                  const CategoryIcon = categoryIcons[doc.category] || File;
                  const FileIcon = fileTypeIcons[doc.file_type] || File;
                  
                  return (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 p-4 bg-[#0E1116] rounded-sm border border-white/[0.05] hover:border-emerald-500/30 transition-all"
                    >
                      <div className="w-12 h-12 rounded-sm bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <FileIcon className="w-6 h-6 text-gray-500 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                            {doc.name}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-gray-500 uppercase px-1.5 py-0.5 bg-gray-800 rounded-sm">
                            {doc.category}
                          </span>
                          {doc.file_size && (
                            <span className="text-[10px] text-gray-600">
                              {formatFileSize(doc.file_size)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-gray-600 mt-2">
                          {doc.created_date && format(new Date(doc.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={searchTerm || categoryFilter !== 'all'
              ? "Try adjusting your search or filters"
              : "Your documents will appear here once they're uploaded"
            }
          />
        </Panel>
      )}
    </div>
  );
}