import React from 'react';

export default function QuoteTemplate({ packageData }) {
  const genDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const year = new Date().getFullYear();

  return (
    <div className="quote-template-wrapper font-sans">
      {/* Page 1 */}
      <div className="w-[210mm] h-[297mm] bg-surface-dark-primary text-text-on-dark-primary p-8 overflow-hidden print:break-after-page flex flex-col">
        {/* Header with Glass Effect */}
        <div className="glass-header text-center mb-6 py-6 px-4 rounded-lg border border-border-green-accent">
          <h1 className="text-6xl font-bold text-text-on-dark-white mb-3 tracking-tight">MAINERMEDIA</h1>
          <h2 className="text-5xl font-bold text-mainermedia-green-light mb-4">NEXUS</h2>
          <h3 className="text-3xl text-text-on-dark-primary font-medium mb-4">Custom Engagement Package</h3>
          <div className="w-full h-0.5 bg-mainermedia-green-light opacity-60"></div>
        </div>

        {/* Intro Text */}
        <p className="text-sm text-text-on-dark-primary mb-6 leading-relaxed">
          A catalyst for accelerated growth. We utilize a data-driven methodology to ensure every marketing dollar contributes to your bottom line, turning insights into revenue and market presence into sustainable competitive advantage.
        </p>

        {/* Company Info with Accent Panel */}
        <div className="accent-panel border-2 border-mainermedia-green-light rounded-lg p-5 mb-6 shadow-lg">
          <h4 className="text-xl font-bold text-text-on-dark-white mb-3 tracking-wide">COMPANY: {packageData.company_name}</h4>
          <p className="text-sm text-text-on-dark-primary mb-2">Contact: {packageData.contact_email}</p>
          <p className="text-xs text-text-on-dark-secondary">Generated: {genDate}</p>
        </div>

        {/* Engagement Details */}
        <div className="mb-6 flex-1">
          <div className="flex items-center mb-3">
            <div className="w-1 h-6 bg-mainermedia-green-light mr-3"></div>
            <h3 className="text-2xl font-bold text-mainermedia-green-accent uppercase tracking-wide">Engagement Details</h3>
          </div>
          <div className="w-full h-px bg-border-green-accent mb-4"></div>
          
          <div className="bg-surface-dark-secondary border-2 border-border-green-accent rounded-lg p-5 space-y-3 shadow-md">
            <div className="flex justify-between items-center py-2 border-b border-border-dark-subtle">
              <span className="text-sm text-text-on-dark-secondary">Selected Option:</span>
              <span className="text-lg font-semibold text-text-on-dark-white">{packageData.selected_option}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-dark-subtle">
              <span className="text-sm text-text-on-dark-secondary">Audit Fee:</span>
              <span className="text-lg font-bold text-mainermedia-green-accent">$5,000</span>
            </div>
            {packageData.calculated_retainer > 0 && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border-dark-subtle">
                  <span className="text-sm text-text-on-dark-secondary">Monthly Retainer:</span>
                  <span className="text-lg font-bold text-mainermedia-green-accent">${packageData.calculated_retainer.toLocaleString()}/month</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border-dark-subtle">
                  <span className="text-sm text-text-on-dark-secondary">Probation Period:</span>
                  <span className="text-lg font-semibold text-text-on-dark-white">{packageData.probation_months} months minimum</span>
                </div>
              </>
            )}
            {packageData.decision_deadline && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-on-dark-secondary">Decision Deadline:</span>
                <span className="text-lg font-semibold text-text-on-dark-white">
                  {new Date(packageData.decision_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Company Profile */}
        {(packageData.company_scale || packageData.annual_revenue || packageData.gross_profit_margin || packageData.growth_target) && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-mainermedia-green-light mr-3"></div>
              <h3 className="text-2xl font-bold text-mainermedia-green-accent uppercase tracking-wide">Company Profile</h3>
            </div>
            <div className="w-full h-px bg-border-green-accent mb-4"></div>
            
            <div className="bg-surface-dark-secondary border-2 border-border-green-accent rounded-lg p-5 grid grid-cols-2 gap-4 shadow-md">
              {packageData.company_scale && (
                <div className="py-2">
                  <p className="text-xs text-text-on-dark-muted mb-1 uppercase tracking-wider">Company Scale</p>
                  <p className="text-base font-semibold text-text-on-dark-white">{packageData.company_scale}</p>
                </div>
              )}
              {packageData.annual_revenue && (
                <div className="py-2">
                  <p className="text-xs text-text-on-dark-muted mb-1 uppercase tracking-wider">Annual Revenue</p>
                  <p className="text-base font-semibold text-text-on-dark-white">${parseFloat(packageData.annual_revenue).toLocaleString()}</p>
                </div>
              )}
              {packageData.gross_profit_margin && (
                <div className="py-2">
                  <p className="text-xs text-text-on-dark-muted mb-1 uppercase tracking-wider">Profit Margin</p>
                  <p className="text-base font-semibold text-text-on-dark-white">{packageData.gross_profit_margin}%</p>
                </div>
              )}
              {packageData.growth_target && (
                <div className="py-2">
                  <p className="text-xs text-text-on-dark-muted mb-1 uppercase tracking-wider">Growth Target</p>
                  <p className="text-base font-semibold text-text-on-dark-white">{packageData.growth_target}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="w-full h-px bg-border-green-accent mb-3"></div>
          <p className="text-xs text-text-on-dark-muted text-center">&copy; {year} MainerMedia Nexus. All rights reserved.</p>
        </div>
      </div>

      {/* Page 2 */}
      <div className="w-[210mm] h-[297mm] bg-surface-dark-primary text-text-on-dark-primary p-8 overflow-hidden print:break-after-page flex flex-col">
        {/* Engagement Terms */}
        {packageData.selected_option !== 'Option 1 - Independent' && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-mainermedia-green-light mr-3"></div>
              <h3 className="text-2xl font-bold text-mainermedia-green-accent uppercase tracking-wide">Engagement Terms</h3>
            </div>
            <div className="w-full h-px bg-border-green-accent mb-4"></div>
            
            <div className="bg-surface-dark-secondary border-2 border-border-green-accent rounded-lg p-5 space-y-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="text-mainermedia-green-accent text-xl font-bold flex-shrink-0">&gt;</span>
                <p className="text-sm text-text-on-dark-primary leading-relaxed">
                  <span className="font-semibold text-text-on-dark-white">Decision Window:</span> 30 days from audit completion to select engagement pathway
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-mainermedia-green-accent text-xl font-bold flex-shrink-0">&gt;</span>
                <p className="text-sm text-text-on-dark-primary leading-relaxed">
                  <span className="font-semibold text-text-on-dark-white">Probationary Period:</span> 3-6 months minimum commitment for proper discovery, system implementation, and data aggregation
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-mainermedia-green-accent text-xl font-bold flex-shrink-0">&gt;</span>
                <p className="text-sm text-text-on-dark-primary leading-relaxed">
                  <span className="font-semibold text-text-on-dark-white">Audit Credit:</span> $5,000 audit fee credited evenly across engagement term
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-mainermedia-green-accent text-xl font-bold flex-shrink-0">&gt;</span>
                <p className="text-sm text-text-on-dark-primary leading-relaxed">
                  <span className="font-semibold text-text-on-dark-white">Renegotiation:</span> After probation, review metrics and optionally renegotiate terms based on established baseline and future goals
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {packageData.notes && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-mainermedia-green-light mr-3"></div>
              <h3 className="text-2xl font-bold text-mainermedia-green-accent uppercase tracking-wide">Additional Notes</h3>
            </div>
            <div className="w-full h-px bg-border-green-accent mb-4"></div>
            
            <div className="bg-surface-dark-secondary border-2 border-border-green-accent rounded-lg p-5 shadow-md">
              <p className="text-sm text-text-on-dark-primary leading-relaxed whitespace-pre-wrap">{packageData.notes}</p>
            </div>
          </div>
        )}

        {/* Call to Action with CTA Background */}
        <div className="mb-6 flex-1 flex items-center justify-center">
          <div className="cta-bg rounded-lg p-8 text-center shadow-2xl border border-mainermedia-green-light max-w-2xl">
            <p className="text-xl text-text-on-dark-white leading-relaxed mb-6 font-medium">
              Ready to begin? Let us schedule your initial discovery call to discuss the Audit process.
            </p>
            
            <div className="text-center">
              <h2 className="text-4xl font-bold text-text-on-dark-white mb-3 tracking-tight">MAINERMEDIA</h2>
              <p className="text-lg text-mainermedia-green-accent mb-2 font-medium">Contact us at mainermedia.com</p>
              <p className="text-lg text-mainermedia-green-accent font-semibold">Book a Call &rarr;</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="w-full h-px bg-border-green-accent mb-3"></div>
          <p className="text-xs text-text-on-dark-muted text-center">&copy; {year} MainerMedia Nexus. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}