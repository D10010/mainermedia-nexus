import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import RoleGuard from '../components/RoleGuard';
import Panel from '../components/ui/Panel';
import PrimaryButton from '../components/ui/PrimaryButton';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import QuoteTemplate from '../components/QuoteTemplate';
import html2canvas from 'html2canvas';
import { Plus, Package, Eye, Trash2, Mail, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPackages() {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const quoteRef = useRef(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => base44.entities.Package.list('-created_date'),
  });

  const { data: creatorUser } = useQuery({
    queryKey: ['user', selectedPackage?.created_by_admin],
    queryFn: async () => {
      if (!selectedPackage?.created_by_admin) return null;
      const users = await base44.entities.User.filter({ email: selectedPackage.created_by_admin });
      return users[0] || null;
    },
    enabled: !!selectedPackage?.created_by_admin,
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id) => base44.entities.Package.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
      setShowDetailsModal(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Package.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
    },
  });

  const sendPackageMutation = useMutation({
    mutationFn: async (packageId) => {
      const response = await base44.functions.invoke('sendPackageQuote', { packageId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
    },
  });

  const handleDownloadPNG = async (packageData, companyName) => {
    try {
      setIsGenerating(true);
      
      // Wait for next tick to ensure render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!quoteRef.current) {
        throw new Error('Quote template not found');
      }

      // Capture page 1
      const page1Element = quoteRef.current.children[0];
      const canvas1 = await html2canvas(page1Element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
      });
      
      // Capture page 2
      const page2Element = quoteRef.current.children[1];
      const canvas2 = await html2canvas(page2Element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
      });

      // Download page 1
      canvas1.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Package-${companyName.replace(/\s+/g, '-')}-page1.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 'image/png');

      // Download page 2
      setTimeout(() => {
        canvas2.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Package-${companyName.replace(/\s+/g, '-')}-page2.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }, 'image/png');
      }, 500);

      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating PNG:', error);
      setIsGenerating(false);
      alert('Failed to generate quote images. Please try again.');
    }
  };

  const columns = [
    {
      key: 'company_name',
      label: 'Company',
      sortable: true,
    },
    {
      key: 'selected_option',
      label: 'Option',
      render: (pkg) => (
        <span className="text-sm text-gray-400">
          {pkg.selected_option?.replace('Option ', 'Opt. ')}
        </span>
      ),
    },
    {
      key: 'calculated_retainer',
      label: 'Monthly',
      render: (pkg) => (
        <span className="text-emerald-400 font-mono">
          {pkg.calculated_retainer > 0 ? `$${pkg.calculated_retainer.toLocaleString()}/mo` : 'One-time'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (pkg) => <StatusBadge status={pkg.status} />,
    },
    {
      key: 'created_date',
      label: 'Created',
      render: (pkg) => (
        <span className="text-xs text-gray-500">
          {format(new Date(pkg.created_date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (pkg) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedPackage(pkg);
              setShowDetailsModal(true);
            }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Loading packages...</div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Custom Packages</h1>
            <p className="text-gray-400">Manage client engagement packages and quotes</p>
          </div>
          <Link to={createPageUrl('PackageBuilder')}>
            <PrimaryButton icon={Plus}>
              Create Package
            </PrimaryButton>
          </Link>
        </div>

        <Panel>
          {packages.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No packages yet"
              description="Create your first custom package to get started"
              actionLabel="Create Package"
              onAction={() => window.location.href = createPageUrl('PackageBuilder')}
            />
          ) : (
            <DataTable
              data={packages}
              columns={columns}
              onRowClick={(pkg) => {
                setSelectedPackage(pkg);
                setShowDetailsModal(true);
              }}
            />
          )}
        </Panel>

        {/* Details Modal */}
        {showDetailsModal && selectedPackage && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title="Package Details"
            size="large"
          >
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#0E1116] border border-white/[0.08] rounded-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-1">Company</p>
                  <p className="text-white font-semibold">{selectedPackage.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-1">Contact</p>
                  <p className="text-white">{selectedPackage.contact_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-1">Status</p>
                  <StatusBadge status={selectedPackage.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider mb-1">Created By</p>
                  <p className="text-white text-sm">
                    {creatorUser?.display_name || creatorUser?.full_name || 'Admin'}
                  </p>
                  <p className="text-gray-500 text-xs">{selectedPackage.created_by_admin}</p>
                </div>
              </div>

              {/* Engagement Details */}
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-3">Engagement Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[#0E1116] rounded-sm">
                    <span className="text-gray-400">Selected Option</span>
                    <span className="text-white font-medium">{selectedPackage.selected_option}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0E1116] rounded-sm">
                    <span className="text-gray-400">Audit Fee</span>
                    <span className="text-emerald-400 font-mono">$5,000</span>
                  </div>
                  {selectedPackage.calculated_retainer > 0 && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-[#0E1116] rounded-sm">
                        <span className="text-gray-400">Monthly Retainer</span>
                        <span className="text-emerald-400 font-mono">${selectedPackage.calculated_retainer.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#0E1116] rounded-sm">
                        <span className="text-gray-400">Probation Period</span>
                        <span className="text-white">{selectedPackage.probation_months} months</span>
                      </div>
                    </>
                  )}
                  {selectedPackage.decision_deadline && (
                    <div className="flex justify-between items-center p-3 bg-[#0E1116] rounded-sm">
                      <span className="text-gray-400">Decision Deadline</span>
                      <span className="text-white">{format(new Date(selectedPackage.decision_deadline), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Inputs */}
              {selectedPackage.company_scale && (
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-3">Company Profile</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0E1116] rounded-sm">
                      <p className="text-xs text-gray-500 mb-1">Company Scale</p>
                      <p className="text-white">{selectedPackage.company_scale}</p>
                    </div>
                    {selectedPackage.annual_revenue && (
                      <div className="p-3 bg-[#0E1116] rounded-sm">
                        <p className="text-xs text-gray-500 mb-1">Annual Revenue</p>
                        <p className="text-white">${parseFloat(selectedPackage.annual_revenue).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedPackage.gross_profit_margin && (
                      <div className="p-3 bg-[#0E1116] rounded-sm">
                        <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
                        <p className="text-white">{selectedPackage.gross_profit_margin}%</p>
                      </div>
                    )}
                    {selectedPackage.growth_target && (
                      <div className="p-3 bg-[#0E1116] rounded-sm">
                        <p className="text-xs text-gray-500 mb-1">Growth Target</p>
                        <p className="text-white">{selectedPackage.growth_target}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPackage.notes && (
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-3">Notes</h3>
                  <div className="p-4 bg-[#0E1116] border border-white/[0.08] rounded-sm">
                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{selectedPackage.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.08]">
                <PrimaryButton
                  variant="primary"
                  size="small"
                  onClick={() => handleDownloadPNG(selectedPackage, selectedPackage.company_name)}
                  icon={Download}
                  loading={isGenerating}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Download Quote'}
                </PrimaryButton>
                <PrimaryButton
                  variant="secondary"
                  size="small"
                  onClick={async () => {
                    if (window.confirm(`Mark this package as ready to send to ${selectedPackage.contact_email}?\n\nYou'll receive a notification with the full package details to send via your email system.`)) {
                      await sendPackageMutation.mutateAsync(selectedPackage.id);
                      updateStatusMutation.mutate({ id: selectedPackage.id, status: 'Sent' });
                      setShowDetailsModal(false);
                    }
                  }}
                  disabled={selectedPackage.status === 'Sent' || sendPackageMutation.isPending || updateStatusMutation.isPending}
                  loading={sendPackageMutation.isPending || updateStatusMutation.isPending}
                  icon={Mail}
                >
                  {selectedPackage.status === 'Sent' ? 'Already Sent' : 'Prepare to Send'}
                </PrimaryButton>
                <PrimaryButton
                  variant="danger"
                  size="small"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this package?')) {
                      deletePackageMutation.mutate(selectedPackage.id);
                    }
                  }}
                  disabled={deletePackageMutation.isPending}
                  loading={deletePackageMutation.isPending}
                  icon={Trash2}
                >
                  Delete
                </PrimaryButton>
              </div>
            </div>
          </Modal>
        )}

        {/* Hidden Quote Template for PNG generation */}
        <div className="fixed -left-[9999px] top-0">
          <div ref={quoteRef}>
            {selectedPackage && <QuoteTemplate packageData={selectedPackage} />}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}