import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '../components/RoleGuard';
import Panel from '../components/ui/Panel';
import PrimaryButton from '../components/ui/PrimaryButton';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';
import { CheckCircle, ArrowRight, ArrowLeft, Package, DollarSign, Building2, Target, FileText } from 'lucide-react';

const STEPS = ['Audit & Company Info', 'Engagement Option', 'Pricing Inputs', 'Terms & Summary'];

export default function PackageBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    audit_included: true,
    selected_option: '',
    company_scale: '',
    annual_revenue: '',
    gross_profit_margin: '',
    growth_target: '',
    probation_months: 3,
    terms_accepted: false,
    notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const calculateRetainer = () => {
    if (!formData.selected_option || formData.selected_option === 'Option 1 - Independent') {
      return 0;
    }

    const revenue = parseFloat(formData.annual_revenue) || 0;
    const margin = parseFloat(formData.gross_profit_margin) || 0;

    let baseRetainer = formData.selected_option === 'Option 2 - Strategic Consulting' ? 5000 : 10000;
    
    // Scale factor based on company size
    const scaleFactor = {
      'Small (<$1M)': 1,
      'Medium ($1M-$10M)': 1.5,
      'Large ($10M-$50M)': 2,
      'Enterprise ($50M+)': 2.5
    }[formData.company_scale] || 1;

    // Growth factor
    const growthFactor = {
      'Conservative (10-20%)': 1,
      'Moderate (20-40%)': 1.3,
      'Aggressive (40%+)': 1.6
    }[formData.growth_target] || 1;

    // Revenue-based adjustment (0.1% of revenue, capped)
    const revenueAdjustment = Math.min(revenue * 0.001, 5000);
    
    // Margin adjustment (better margins = willing to invest more)
    const marginAdjustment = (margin / 100) * 1000;

    const calculated = baseRetainer * scaleFactor * growthFactor + revenueAdjustment + marginAdjustment;

    // Apply caps based on option
    if (formData.selected_option === 'Option 2 - Strategic Consulting') {
      return Math.min(Math.max(calculated, 5000), 10000);
    } else {
      return Math.min(Math.max(calculated, 10000), 25000);
    }
  };

  const calculatedRetainer = calculateRetainer();

  const createPackageMutation = useMutation({
    mutationFn: async (data) => {
      const decisionDeadline = new Date();
      decisionDeadline.setDate(decisionDeadline.getDate() + 30);

      return await base44.entities.Package.create({
        ...data,
        calculated_retainer: calculatedRetainer,
        total_audit_cost: 5000,
        decision_deadline: decisionDeadline.toISOString().split('T')[0],
        created_by_admin: user?.email,
        status: 'Draft'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
      navigate('/admin-packages');
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createPackageMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.company_name && formData.contact_email;
      case 1:
        return formData.selected_option;
      case 2:
        if (formData.selected_option === 'Option 1 - Independent') return true;
        return formData.company_scale && formData.annual_revenue && formData.gross_profit_margin && formData.growth_target;
      case 3:
        return formData.terms_accepted;
      default:
        return false;
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Custom Package Builder</h1>
          <p className="text-gray-400">Create tailored engagement packages based on MainerMedia's pricing structure</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-10 h-10 rounded-sm flex items-center justify-center border-2 transition-all
                    ${index <= currentStep 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                      : 'bg-[#12161D] border-white/[0.08] text-gray-600'
                    }
                  `}>
                    {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`
                    text-xs mt-2 font-mono uppercase tracking-wider
                    ${index <= currentStep ? 'text-emerald-400' : 'text-gray-600'}
                  `}>
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    h-0.5 flex-1 mx-2 transition-all
                    ${index < currentStep ? 'bg-emerald-500' : 'bg-white/[0.08]'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Panel>
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">Step 1: Comprehensive Digital Marketing Audit</h2>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-4 mb-6">
                <p className="text-sm text-emerald-400">
                  <span className="font-semibold">Valued at $5,000</span> - Full analysis of digital footprint, competitive landscape, 
                  and internal systems. Delivers a complete roadmap for growth.
                </p>
              </div>
              
              <InputField
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                placeholder="Enter company name"
                required
              />
              
              <InputField
                label="Contact Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                placeholder="contact@company.com"
                required
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">Select Engagement Pathway</h2>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    value: 'Option 1 - Independent',
                    title: 'Option 1: Independent Implementation',
                    price: '$5,000 One-time',
                    description: 'You retain the roadmap. Ideal for companies with robust in-house marketing teams.',
                    features: ['Full digital marketing audit', 'Comprehensive strategy roadmap', 'Prioritized action plan', 'Complete ownership', 'No ongoing commitment']
                  },
                  {
                    value: 'Option 2 - Strategic Consulting',
                    title: 'Option 2: Strategic Consulting',
                    price: '$5k - $10k / month',
                    description: 'We guide, you drive. Partner with your leadership while your team executes.',
                    features: ['$5k Audit credited evenly', 'Weekly check-ins', 'Bi-weekly roundtables', 'Monthly reviews', 'KPI monitoring', 'Vendor management']
                  },
                  {
                    value: 'Option 3 - Full-Service',
                    title: 'Option 3: Full-Service Execution',
                    price: '$10k - $25k / month',
                    description: 'We handle everything. Turnkey solution covering strategy, talent, and execution.',
                    features: ['$5k Audit credited evenly', 'All Option 2 services', 'Dedicated execution team', 'Contractor labor included', 'Full accountability']
                  }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField('selected_option', option.value)}
                    className={`
                      text-left p-6 rounded-sm border-2 transition-all
                      ${formData.selected_option === option.value
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-[#0E1116] border-white/[0.08] hover:border-white/[0.15]'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{option.title}</h3>
                        <p className="text-emerald-400 font-mono text-sm">{option.price}</p>
                      </div>
                      {formData.selected_option === option.value && (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{option.description}</p>
                    <ul className="space-y-1">
                      {option.features.map((feature, i) => (
                        <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">
                  {formData.selected_option === 'Option 1 - Independent' 
                    ? 'One-Time Investment' 
                    : 'Company Details for Fair Market Pricing'}
                </h2>
              </div>

              {formData.selected_option === 'Option 1 - Independent' ? (
                <div className="bg-[#0E1116] border border-white/[0.08] rounded-sm p-6 text-center">
                  <div className="text-4xl font-bold text-emerald-500 mb-2">$5,000</div>
                  <p className="text-gray-400">One-time audit fee - No monthly retainer required</p>
                </div>
              ) : (
                <>
                  <SelectField
                    label="Company Scale"
                    value={formData.company_scale}
                    onChange={(e) => updateField('company_scale', e.target.value)}
                    options={[
                      { value: '', label: 'Select company scale' },
                      { value: 'Small (<$1M)', label: 'Small (<$1M annual revenue)' },
                      { value: 'Medium ($1M-$10M)', label: 'Medium ($1M-$10M)' },
                      { value: 'Large ($10M-$50M)', label: 'Large ($10M-$50M)' },
                      { value: 'Enterprise ($50M+)', label: 'Enterprise ($50M+)' }
                    ]}
                    required
                  />

                  <InputField
                    label="Annual Revenue"
                    type="number"
                    value={formData.annual_revenue}
                    onChange={(e) => updateField('annual_revenue', e.target.value)}
                    placeholder="1000000"
                    required
                  />

                  <InputField
                    label="Gross Profit Margin (%)"
                    type="number"
                    value={formData.gross_profit_margin}
                    onChange={(e) => updateField('gross_profit_margin', e.target.value)}
                    placeholder="25"
                    required
                  />

                  <SelectField
                    label="Growth Target"
                    value={formData.growth_target}
                    onChange={(e) => updateField('growth_target', e.target.value)}
                    options={[
                      { value: '', label: 'Select growth target' },
                      { value: 'Conservative (10-20%)', label: 'Conservative (10-20% growth)' },
                      { value: 'Moderate (20-40%)', label: 'Moderate (20-40% growth)' },
                      { value: 'Aggressive (40%+)', label: 'Aggressive (40%+ growth)' }
                    ]}
                    required
                  />

                  {calculatedRetainer > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-6 mt-6">
                      <p className="text-sm text-gray-400 mb-2">Calculated Monthly Retainer</p>
                      <div className="text-4xl font-bold text-emerald-500">
                        ${calculatedRetainer.toLocaleString()}/mo
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Based on company scale, revenue, margins, and growth targets
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">Terms & Package Summary</h2>
              </div>

              {/* Summary */}
              <div className="bg-[#0E1116] border border-white/[0.08] rounded-sm p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">Company</p>
                    <p className="text-white font-medium">{formData.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">Contact</p>
                    <p className="text-white font-medium">{formData.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">Selected Option</p>
                    <p className="text-white font-medium">{formData.selected_option}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">Audit Fee</p>
                    <p className="text-emerald-400 font-medium">$5,000</p>
                  </div>
                  {formData.selected_option !== 'Option 1 - Independent' && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">Monthly Retainer</p>
                        <p className="text-emerald-400 font-medium">${calculatedRetainer.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">Probation Period</p>
                        <p className="text-white font-medium">{formData.probation_months} months minimum</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.terms_accepted}
                    onChange={(e) => updateField('terms_accepted', e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-400">
                    <span className="text-white font-medium">I acknowledge the following terms:</span>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• <strong>Decision Window:</strong> 30 days from audit completion to select engagement pathway</li>
                      {formData.selected_option !== 'Option 1 - Independent' && (
                        <>
                          <li>• <strong>Probationary Period:</strong> {formData.probation_months}-6 months minimum commitment for proper implementation</li>
                          <li>• <strong>Audit Credit:</strong> $5,000 audit fee credited evenly across engagement term</li>
                          <li>• <strong>Renegotiation:</strong> After probation, review metrics and optionally renegotiate terms</li>
                        </>
                      )}
                      <li>• <strong>Fair Market Pricing:</strong> Final retainer subject to detailed discovery and company specifics</li>
                    </ul>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs text-gray-500 uppercase font-mono tracking-wider mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                  className="w-full bg-[#0E1116] border border-white/[0.08] rounded-sm px-4 py-3 text-sm text-white placeholder:text-gray-600"
                  placeholder="Any additional details or customizations..."
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
            <PrimaryButton
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="ghost"
              icon={ArrowLeft}
            >
              Back
            </PrimaryButton>

            {currentStep === STEPS.length - 1 ? (
              <PrimaryButton
                onClick={handleSubmit}
                disabled={!isStepValid() || createPackageMutation.isPending}
                loading={createPackageMutation.isPending}
                icon={CheckCircle}
              >
                Create Package
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={handleNext}
                disabled={!isStepValid()}
                icon={ArrowRight}
              >
                Next Step
              </PrimaryButton>
            )}
          </div>
        </Panel>
      </div>
    </RoleGuard>
  );
}