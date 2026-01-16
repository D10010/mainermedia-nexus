import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  BookOpen,
  Upload
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

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target_audience: 'All',
    priority: 'Normal',
    is_published: false,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['allAnnouncements'],
    queryFn: () => base44.entities.Announcement.list('-created_date'),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.filter({ is_public: true }, '-created_date'),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create({
      ...data,
      published_at: data.is_published ? new Date().toISOString() : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allAnnouncements']);
      setShowAddModal(false);
      setNewAnnouncement({ title: '', content: '', target_audience: 'All', priority: 'Normal', is_published: false });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, {
      ...data,
      published_at: data.is_published && !selectedItem?.is_published ? new Date().toISOString() : selectedItem?.published_at,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allAnnouncements']);
      setSelectedItem(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['allAnnouncements']),
  });

  const filteredAnnouncements = announcements.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocuments = documents.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const audienceOptions = [
    { value: 'All', label: 'Everyone' },
    { value: 'Clients', label: 'Clients Only' },
    { value: 'Partners', label: 'Partners Only' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
  ];

  const announcementColumns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div>
          <p className="text-white font-medium">{row.title}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{row.content}</p>
        </div>
      )
    },
    {
      key: 'target_audience',
      label: 'Audience',
      render: (row) => (
        <span className="text-gray-400">{row.target_audience}</span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span className={`text-xs font-mono uppercase ${
          row.priority === 'High' ? 'text-red-400' : 
          row.priority === 'Low' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {row.priority}
        </span>
      )
    },
    {
      key: 'is_published',
      label: 'Status',
      render: (row) => (
        row.is_published ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <Eye className="w-3 h-3" /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <EyeOff className="w-3 h-3" /> Draft
          </span>
        )
      )
    },
    {
      key: 'created_date',
      label: 'Created',
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
            onClick={(e) => { e.stopPropagation(); setSelectedItem(row); }}
            className="p-2 text-gray-500 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteAnnouncementMutation.mutate(row.id); }}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
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
          <h1 className="text-3xl font-light text-white tracking-tight">Content</h1>
          <p className="text-gray-500 mt-1">Manage announcements and resources</p>
        </div>
        <PrimaryButton 
          onClick={() => setShowAddModal(true)} 
          icon={Plus}
        >
          {activeTab === 'announcements' ? 'New Announcement' : 'Upload Resource'}
        </PrimaryButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-4">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-sm transition-all
            ${activeTab === 'announcements'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-400 hover:text-white'
            }
          `}
        >
          <Bell className="w-4 h-4" />
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-sm transition-all
            ${activeTab === 'resources'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-400 hover:text-white'
            }
          `}
        >
          <BookOpen className="w-4 h-4" />
          Partner Resources
        </button>
      </div>

      {/* Search */}
      <InputField
        placeholder={`Search ${activeTab}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
      />

      {/* Content */}
      {activeTab === 'announcements' ? (
        <Panel noPadding>
          {filteredAnnouncements.length > 0 ? (
            <DataTable
              columns={announcementColumns}
              data={filteredAnnouncements}
              onRowClick={(row) => setSelectedItem(row)}
            />
          ) : (
            <div className="p-6">
              <EmptyState
                icon={Bell}
                title="No announcements"
                description="Create your first announcement to communicate with clients and partners"
                actionLabel="New Announcement"
                onAction={() => setShowAddModal(true)}
              />
            </div>
          )}
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-[#12161D] border border-white/[0.08] rounded-sm hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-sm bg-gray-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{doc.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{doc.category}</p>
                </div>
              </div>
            </a>
          ))}
          
          {filteredDocuments.length === 0 && (
            <div className="col-span-full">
              <Panel>
                <EmptyState
                  icon={BookOpen}
                  title="No resources"
                  description="Upload resources for partners to access"
                />
              </Panel>
            </div>
          )}
        </div>
      )}

      {/* Add Announcement Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Announcement"
        size="large"
      >
        <form onSubmit={(e) => { e.preventDefault(); createAnnouncementMutation.mutate(newAnnouncement); }} className="space-y-6">
          <InputField
            label="Title"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            required
            placeholder="Announcement title"
          />
          <TextAreaField
            label="Content"
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
            required
            rows={5}
            placeholder="Write your announcement..."
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Target Audience"
              value={newAnnouncement.target_audience}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_audience: e.target.value })}
              options={audienceOptions}
            />
            <SelectField
              label="Priority"
              value={newAnnouncement.priority}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
              options={priorityOptions}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNewAnnouncement({ ...newAnnouncement, is_published: !newAnnouncement.is_published })}
              className={`
                w-12 h-6 rounded-full transition-colors relative
                ${newAnnouncement.is_published ? 'bg-emerald-500' : 'bg-gray-700'}
              `}
            >
              <div className={`
                w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform
                ${newAnnouncement.is_published ? 'translate-x-6' : 'translate-x-0.5'}
              `} />
            </button>
            <span className="text-sm text-gray-400">Publish immediately</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowAddModal(false)} type="button">
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              loading={createAnnouncementMutation.isPending}
              disabled={!newAnnouncement.title || !newAnnouncement.content}
            >
              {newAnnouncement.is_published ? 'Publish' : 'Save Draft'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Announcement Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Edit Announcement"
        size="large"
      >
        {selectedItem && (
          <form onSubmit={(e) => { e.preventDefault(); updateAnnouncementMutation.mutate({ id: selectedItem.id, data: selectedItem }); }} className="space-y-6">
            <InputField
              label="Title"
              value={selectedItem.title || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value })}
            />
            <TextAreaField
              label="Content"
              value={selectedItem.content || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, content: e.target.value })}
              rows={5}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Target Audience"
                value={selectedItem.target_audience || 'All'}
                onChange={(e) => setSelectedItem({ ...selectedItem, target_audience: e.target.value })}
                options={audienceOptions}
              />
              <SelectField
                label="Priority"
                value={selectedItem.priority || 'Normal'}
                onChange={(e) => setSelectedItem({ ...selectedItem, priority: e.target.value })}
                options={priorityOptions}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedItem({ ...selectedItem, is_published: !selectedItem.is_published })}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${selectedItem.is_published ? 'bg-emerald-500' : 'bg-gray-700'}
                `}
              >
                <div className={`
                  w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform
                  ${selectedItem.is_published ? 'translate-x-6' : 'translate-x-0.5'}
                `} />
              </button>
              <span className="text-sm text-gray-400">Published</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <PrimaryButton variant="secondary" onClick={() => setSelectedItem(null)} type="button">
                Cancel
              </PrimaryButton>
              <PrimaryButton 
                type="submit" 
                loading={updateAnnouncementMutation.isPending}
              >
                Save Changes
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}