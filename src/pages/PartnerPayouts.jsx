import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Wallet,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  CreditCard,
  Building2
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import InputField from '@/components/ui/InputField';
import EmptyState from '@/components/ui/EmptyState';

export default function PartnerPayouts() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partner } = useQuery({
    queryKey: ['currentPartner', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const partners = await base44.entities.Partner.filter({ user_id: user.email });
      return partners[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['partnerPayouts', partner?.id],
    queryFn: () => base44.entities.Payout.filter({ partner_id: partner.id }, '-created_date'),
    enabled: !!partner?.id,
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(requestAmount);
      await base44.entities.Payout.create({
        partner_id: partner.id,
        amount,
        status: 'Requested',
        requested_at: new Date().toISOString(),
        payment_method: partner.payment_method,
      });
      
      // Update partner balance
      await base44.entities.Partner.update(partner.id, {
        available_balance: (partner.available_balance || 0) - amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerPayouts']);
      queryClient.invalidateQueries(['currentPartner']);
      setShowRequestModal(false);
      setRequestAmount('');
    },
  });

  const availableBalance = partner?.available_balance || 0;
  const totalPaid = payouts
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayouts = payouts
    .filter(p => ['Requested', 'Approved', 'Processing'].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'PayPal': return Wallet;
      case 'Bank Transfer': return Building2;
      case 'Check': return CreditCard;
      default: return Wallet;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return CheckCircle2;
      case 'Rejected': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Payouts</h1>
          <p className="text-gray-500 mt-1">Request and track your payout history</p>
        </div>
        {availableBalance >= 100 && (
          <PrimaryButton onClick={() => setShowRequestModal(true)} icon={Send}>
            Request Payout
          </PrimaryButton>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Available Balance"
          value={formatCurrency(availableBalance)}
          icon={Wallet}
          accent
        />
        <MetricCard
          label="Pending Payouts"
          value={formatCurrency(pendingPayouts)}
          icon={Clock}
        />
        <MetricCard
          label="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method */}
        <Panel title="Payment Method" accent>
          <div className="space-y-4">
            <div className="p-4 bg-[#0E1116] rounded-sm">
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const Icon = getPaymentMethodIcon(partner?.payment_method);
                  return <Icon className="w-5 h-5 text-emerald-500" />;
                })()}
                <span className="text-white font-medium">{partner?.payment_method || 'Not Set'}</span>
              </div>
              {partner?.payment_details && (
                <p className="text-sm text-gray-400">{partner.payment_details}</p>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Payout Info</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Minimum Payout</span>
                <span className="text-sm text-white">$100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Processing Time</span>
                <span className="text-sm text-white">3-5 business days</span>
              </div>
            </div>

            {availableBalance < 100 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                <p className="text-xs text-amber-400">
                  Minimum balance of $100 required for payout.
                  Current balance: {formatCurrency(availableBalance)}
                </p>
              </div>
            )}
          </div>
        </Panel>

        {/* Payout History */}
        <div className="lg:col-span-2">
          <Panel title="Payout History">
            {payouts.length > 0 ? (
              <div className="space-y-3">
                {payouts.map((payout) => {
                  const StatusIcon = getStatusIcon(payout.status);
                  const PaymentIcon = getPaymentMethodIcon(payout.payment_method);
                  
                  return (
                    <div 
                      key={payout.id}
                      className="flex items-center justify-between p-4 bg-[#0E1116] rounded-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-10 h-10 rounded-sm flex items-center justify-center
                          ${payout.status === 'Paid' ? 'bg-emerald-500/20' : 
                            payout.status === 'Rejected' ? 'bg-red-500/20' : 
                            'bg-amber-500/20'}
                        `}>
                          <StatusIcon className={`w-5 h-5 
                            ${payout.status === 'Paid' ? 'text-emerald-500' : 
                              payout.status === 'Rejected' ? 'text-red-500' : 
                              'text-amber-500'}
                          `} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{formatCurrency(payout.amount)}</p>
                            <StatusBadge status={payout.status} size="small" />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <PaymentIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{payout.payment_method}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-gray-500">
                          Requested {format(new Date(payout.requested_at || payout.created_date), 'MMM d, yyyy')}
                        </p>
                        {payout.paid_at && (
                          <p className="text-[10px] font-mono text-emerald-500">
                            Paid {format(new Date(payout.paid_at), 'MMM d, yyyy')}
                          </p>
                        )}
                        {payout.payment_reference && (
                          <p className="text-[10px] font-mono text-gray-600 mt-1">
                            Ref: {payout.payment_reference}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No payouts yet"
                description="Your payout history will appear here"
              />
            )}
          </Panel>
        </div>
      </div>

      {/* Request Payout Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Payout"
      >
        <div className="space-y-6">
          <div className="p-4 bg-[#0E1116] rounded-sm">
            <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">Available Balance</p>
            <p className="text-2xl font-light text-emerald-400">{formatCurrency(availableBalance)}</p>
          </div>

          <InputField
            label="Payout Amount"
            type="number"
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
            placeholder="Enter amount"
            icon={DollarSign}
          />

          <div className="p-4 bg-[#0E1116] rounded-sm">
            <p className="text-[10px] font-mono text-gray-500 uppercase mb-2">Payment Method</p>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getPaymentMethodIcon(partner?.payment_method);
                return <Icon className="w-5 h-5 text-gray-400" />;
              })()}
              <div>
                <p className="text-white">{partner?.payment_method || 'Not Set'}</p>
                {partner?.payment_details && (
                  <p className="text-xs text-gray-500">{partner.payment_details}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <PrimaryButton variant="secondary" onClick={() => setShowRequestModal(false)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton
              onClick={() => requestPayoutMutation.mutate()}
              loading={requestPayoutMutation.isPending}
              disabled={!requestAmount || parseFloat(requestAmount) < 100 || parseFloat(requestAmount) > availableBalance}
            >
              Request Payout
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}