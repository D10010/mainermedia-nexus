import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import EmptyState from '@/components/ui/EmptyState';
import DataTable from '@/components/ui/DataTable';

export default function ClientBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

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

  const { data: invoices = [] } = useQuery({
    queryKey: ['clientInvoices', client?.id],
    queryFn: () => base44.entities.Invoice.filter({ client_id: client.id }, '-created_date'),
    enabled: !!client?.id,
  });

  // Calculate totals
  const totalPaid = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalPending = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Draft')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalOverdue = invoices
    .filter(i => i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return CheckCircle2;
      case 'Overdue': return AlertCircle;
      default: return Clock;
    }
  };

  const columns = [
    {
      key: 'invoice_number',
      label: 'Invoice',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-gray-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-white font-medium">
              {row.invoice_number || `INV-${row.id?.slice(-6).toUpperCase()}`}
            </p>
            <p className="text-[10px] text-gray-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="font-mono text-white">{formatCurrency(row.amount)}</span>
      )
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (row) => (
        <span className="text-gray-400">
          {row.due_date ? format(new Date(row.due_date), 'MMM d, yyyy') : '—'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="small" />
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.pdf_url && (
            <a
              href={row.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-500 hover:text-emerald-400 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Billing</h1>
        <p className="text-gray-500 mt-1">View your invoices and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle2}
          accent
        />
        <MetricCard
          label="Pending"
          value={formatCurrency(totalPending)}
          icon={Clock}
        />
        <MetricCard
          label="Overdue"
          value={formatCurrency(totalOverdue)}
          icon={AlertCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice List */}
        <div className="lg:col-span-2">
          <Panel title="Invoices" noPadding>
            {invoices.length > 0 ? (
              <DataTable
                columns={columns}
                data={invoices}
                onRowClick={setSelectedInvoice}
              />
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={CreditCard}
                  title="No invoices yet"
                  description="Your invoices will appear here"
                />
              </div>
            )}
          </Panel>
        </div>

        {/* Invoice Detail / Payment Method */}
        <div className="space-y-6">
          {selectedInvoice ? (
            <Panel title="Invoice Details" accent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Invoice Number</span>
                  <span className="text-white font-mono">
                    {selectedInvoice.invoice_number || `INV-${selectedInvoice.id?.slice(-6).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Amount</span>
                  <span className="text-xl font-light text-white">
                    {formatCurrency(selectedInvoice.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Status</span>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Due Date</span>
                  <span className="text-gray-300">
                    {selectedInvoice.due_date 
                      ? format(new Date(selectedInvoice.due_date), 'MMMM d, yyyy')
                      : '—'
                    }
                  </span>
                </div>
                {selectedInvoice.paid_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Paid On</span>
                    <span className="text-emerald-400">
                      {format(new Date(selectedInvoice.paid_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Line Items */}
                {selectedInvoice.line_items?.length > 0 && (
                  <div className="pt-4 border-t border-white/[0.08]">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
                      Line Items
                    </h4>
                    <div className="space-y-2">
                      {selectedInvoice.line_items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{item.description}</span>
                          <span className="text-white font-mono">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInvoice.pdf_url && (
                  <a
                    href={selectedInvoice.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-emerald-500/20 text-emerald-400 py-3 rounded-sm hover:bg-emerald-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="Payment Method">
              <div className="space-y-4">
                <div className="p-4 bg-[#0E1116] rounded-sm border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="text-white text-sm">•••• •••• •••• 4242</p>
                      <p className="text-gray-500 text-xs">Expires 12/25</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  To update your payment method, please contact support.
                </p>
              </div>
            </Panel>
          )}

          {/* Quick Stats */}
          <Panel title="Payment History">
            <div className="space-y-3">
              {invoices.filter(i => i.status === 'Paid').slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-400">
                      {invoice.paid_at && format(new Date(invoice.paid_at), 'MMM d')}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-white">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
              ))}
              {invoices.filter(i => i.status === 'Paid').length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No payment history
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}