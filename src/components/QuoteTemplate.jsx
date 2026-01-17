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
      <div 
        className="w-[210mm] h-[297mm] p-8 overflow-hidden print:break-after-page flex flex-col"
        style={{ 
          backgroundColor: '#0a0c10',
          color: '#E5E7EB'
        }}
      >
        {/* Header with Glass Effect */}
        <div 
          className="text-center mb-6 py-6 px-4 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, rgba(14,17,22,0.85) 0%, rgba(10,12,16,0.75) 100%)',
            border: '2px solid rgba(16,185,129,0.3)',
            backdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <h1 className="text-6xl font-bold mb-3 tracking-tight" style={{ color: '#FFFFFF' }}>
            MAINERMEDIA
          </h1>
          <h2 className="text-5xl font-bold mb-4" style={{ color: '#10b981' }}>
            NEXUS
          </h2>
          <h3 className="text-3xl font-medium mb-4" style={{ color: '#E5E7EB' }}>
            Custom Engagement Package
          </h3>
          <div className="w-full h-0.5" style={{ backgroundColor: '#10b981', opacity: 0.6 }}></div>
        </div>

        {/* Intro Text */}
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#E5E7EB' }}>
          A catalyst for accelerated growth. We utilize a data-driven methodology to ensure every marketing dollar contributes to your bottom line, turning insights into revenue and market presence into sustainable competitive advantage.
        </p>

        {/* Company Info with Accent Panel */}
        <div 
          className="rounded-lg p-5 mb-6 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(14,17,22,0.8) 100%)',
            border: '2px solid #10b981'
          }}
        >
          <h4 className="text-xl font-bold mb-3 tracking-wide" style={{ color: '#FFFFFF' }}>
            COMPANY: {packageData.company_name}
          </h4>
          <p className="text-sm mb-2" style={{ color: '#E5E7EB' }}>
            Contact: {packageData.contact_email}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Generated: {genDate}
          </p>
        </div>

        {/* Engagement Details */}
        <div className="mb-6 flex-1">
          <div className="flex items-center mb-3">
            <div className="w-1 h-6 mr-3" style={{ backgroundColor: '#10b981' }}></div>
            <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#34d399' }}>
              Engagement Details
            </h3>
          </div>
          <div className="w-full h-px mb-4" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }}></div>
          
          <div 
            className="rounded-lg p-5 space-y-3 shadow-md"
            style={{
              backgroundColor: '#0E1116',
              border: '2px solid rgba(16,185,129,0.3)'
            }}
          >
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-sm" style={{ color: '#9CA3AF' }}>Selected Option:</span>
              <span className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>{packageData.selected_option}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-sm" style={{ color: '#9CA3AF' }}>Audit Fee:</span>
              <span className="text-lg font-bold" style={{ color: '#34d399' }}>$5,000</span>
            </div>
            {packageData.calculated_retainer > 0 && (
              <>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>Monthly Retainer:</span>
                  <span className="text-lg font-bold" style={{ color: '#34d399' }}>
                    ${packageData.calculated_retainer.toLocaleString()}/month
                  </span>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>Probation Period:</span>
                  <span className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
                    {packageData.probation_months} months minimum
                  </span>
                </div>
              </>
            )}
            {packageData.decision_deadline && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: '#9CA3AF' }}>Decision Deadline:</span>
                <span className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
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
              <div className="w-1 h-6 mr-3" style={{ backgroundColor: '#10b981' }}></div>
              <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#34d399' }}>
                Company Profile
              </h3>
            </div>
            <div className="w-full h-px mb-4" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }}></div>
            
            <div 
              className="rounded-lg p-5 grid grid-cols-2 gap-4 shadow-md"
              style={{
                backgroundColor: '#0E1116',
                border: '2px solid rgba(16,185,129,0.3)'
              }}
            >
              {packageData.company_scale && (
                <div className="py-2">
                  <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    Company Scale
                  </p>
                  <p className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
                    {packageData.company_scale}
                  </p>
                </div>
              )}
              {packageData.annual_revenue && (
                <div className="py-2">
                  <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    Annual Revenue
                  </p>
                  <p className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
                    ${parseFloat(packageData.annual_revenue).toLocaleString()}
                  </p>
                </div>
              )}
              {packageData.gross_profit_margin && (
                <div className="py-2">
                  <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    Profit Margin
                  </p>
                  <p className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
                    {packageData.gross_profit_margin}%
                  </p>
                </div>
              )}
              {packageData.growth_target && (
                <div className="py-2">
                  <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    Growth Target
                  </p>
                  <p className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
                    {packageData.growth_target}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="w-full h-px mb-3" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }}></div>
          <p className="text-xs text-center" style={{ color: '#6B7280' }}>
            &copy; {year} MainerMedia Nexus. All rights reserved.
          </p>
        </div>
      </div>

      {/* Page 2 */}
      <div 
        className="w-[210mm] h-[297mm] p-8 overflow-hidden print:break-after-page flex flex-col"
        style={{ 
          backgroundColor: '#0a0c10',
          color: '#E5E7EB'
        }}
      >
        {/* Engagement Terms */}
        {packageData.selected_option !== 'Option 1 - Independent' && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 mr-3" style={{ backgroundColor: '#10b981' }}></div>
              <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#34d399' }}>
                Engagement Terms
              </h3>
            </div>
            <div className="w-full h-px mb-4" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }}></div>
            
            <div 
              className="rounded-lg p-5 space-y-4 shadow-md"
              style={{
                backgroundColor: '#0E1116',
                border: '2px solid rgba(16,185,129,0.3)'
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl font-bold flex-shrink-0" style={{ color: '#34d399' }}>&gt;</span>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>
                  <span className="font-semibold" style={{ color: '#FFFFFF' }}>Decision Window:</span> 30 days from audit completion to select engagement pathway
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl font-bold flex-shrink-0" style={{ color: '#34d399' }}>&gt;</span>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>
                  <span className="font-semibold" style={{ color: '#FFFFFF' }}>Probationary Period:</span> 3-6 months minimum commitment for proper discovery, system implementation, and data aggregation
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl font-bold flex-shrink-0" style={{ color: '#34d399' }}>&gt;</span>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>
                  <span className="font-semibold" style={{ color: '#FFFFFF' }}>Audit Credit:</span> $5,000 audit fee credited evenly across engagement term
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl font-bold flex-shrink-0" style={{ color: '#34d399' }}>&gt;</span>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>
                  <span className="font-semibold" style={{ color: '#FFFFFF' }}>Renegotiation:</span> After probation, review metrics and optionally renegotiate terms based on established baseline and future goals
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {packageData.notes && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 mr-3" style={{ backgroundColor: '#10b981' }}></div>
              <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#34d399' }}>
                Additional Notes
              </h3>
            </div>
            <div className="w-full h-px mb-4" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }}></div>
            
            <div 
              className="rounded-lg p-5 shadow-md"
              style={{
                backgroundColor: '#0E1116',
                border: '2px solid rgba(16,185,129,0.3)'
              }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#E5E7EB' }}>
                {packageData.notes}
              </p>
            </div>
          </div>
        )}

        {/* Call to Action with CTA Background */}
        <div className="mb-6 flex-1 flex items-center justify-center">
          <div 
            className="rounded-lg p-8 text-center shadow-2xl max-w-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.9) 0%, rgba(5,150,105,0.9) 100%)',
              border: '1px solid #10b981'
            }}
          >
            <p className="text-xl leading-relaxed mb-6 font-medium" style={{ color: '#FFFFFF' }}>
              Ready to begin? Let us schedule your initial discovery call to discuss the Audit process.
            </p>
            
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-3 tracking-tight" style={{ color: '#FFFFFF' }}>
                MAINERMEDIA
              </h2>
              <p className="text-lg mb-2 font-medium" style={{ color: '#34d399' }}>
                Contact us at mainermedia.com
              </p>
              <p className="text-lg font-semibold" style={{ color: '#34d399' }}>
                Book a Call &rarr;
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="w-full h-px mb-3" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }}></div>
          <p className="text-xs text-center" style={{ color: '#6B7280' }}>
            &copy; {year} MainerMedia Nexus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}