import React from 'react';

export default function QuoteTemplate({ packageData }) {
  const genDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const year = new Date().getFullYear();

  return (
    <div className="quote-template-wrapper w-[1190px] bg-black text-white font-sans">
      {/* Page 1 */}
      <div className="w-full h-[1684px] bg-black p-16 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-8xl font-bold text-white mb-4">MAINERMEDIA</h1>
          <h2 className="text-7xl font-bold text-teal-400 mb-6">NEXUS</h2>
          <h3 className="text-4xl text-white mb-8">Custom Engagement Package</h3>
          <div className="w-full h-px bg-teal-400 mb-6"></div>
        </div>

        {/* Intro Text */}
        <p className="text-base text-white mb-8 leading-relaxed">
          A catalyst for accelerated growth. We utilize a data-driven methodology to ensure every marketing dollar contributes to your bottom line, turning insights into revenue and market presence into sustainable competitive advantage.
        </p>

        {/* Company Info */}
        <div className="bg-gray-900 border-2 border-teal-400 rounded-xl p-6 mb-8">
          <h4 className="text-xl font-bold text-white mb-4">COMPANY: {packageData.company_name}</h4>
          <p className="text-base text-white mb-2">Contact: {packageData.contact_email}</p>
          <p className="text-sm text-gray-400">Generated: {genDate}</p>
        </div>

        {/* Engagement Details */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h3 className="text-3xl font-bold text-teal-400">ENGAGEMENT DETAILS</h3>
          </div>
          <div className="w-full h-0.5 bg-teal-400 mb-6"></div>
          
          <div className="bg-gray-900 border-2 border-teal-400 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-300">Selected Option:</span>
              <span className="text-xl font-bold text-white">{packageData.selected_option}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-300">Audit Fee:</span>
              <span className="text-xl font-bold text-teal-400">$5,000</span>
            </div>
            {packageData.calculated_retainer > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-300">Monthly Retainer:</span>
                  <span className="text-xl font-bold text-teal-400">${packageData.calculated_retainer.toLocaleString()}/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-300">Probation Period:</span>
                  <span className="text-xl font-bold text-white">{packageData.probation_months} months minimum</span>
                </div>
              </>
            )}
            {packageData.decision_deadline && (
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-300">Decision Deadline:</span>
                <span className="text-xl font-bold text-white">
                  {new Date(packageData.decision_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Company Profile */}
        {(packageData.company_scale || packageData.annual_revenue || packageData.gross_profit_margin || packageData.growth_target) && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-3xl font-bold text-teal-400">COMPANY PROFILE</h3>
            </div>
            <div className="w-full h-0.5 bg-teal-400 mb-6"></div>
            
            <div className="bg-gray-900 border-2 border-teal-400 rounded-xl p-6 space-y-4">
              {packageData.company_scale && (
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-300">Company Scale:</span>
                  <span className="text-xl font-bold text-white">{packageData.company_scale}</span>
                </div>
              )}
              {packageData.annual_revenue && (
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-300">Annual Revenue:</span>
                  <span className="text-xl font-bold text-white">${parseFloat(packageData.annual_revenue).toLocaleString()}</span>
                </div>
              )}
              {packageData.gross_profit_margin && (
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-300">Profit Margin:</span>
                  <span className="text-xl font-bold text-white">{packageData.gross_profit_margin}%</span>
                </div>
              )}
              {packageData.growth_target && (
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-300">Growth Target:</span>
                  <span className="text-xl font-bold text-white">{packageData.growth_target}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto">
          <div className="w-full h-px bg-teal-400 mb-4"></div>
          <p className="text-xs text-gray-500 text-center">&copy; {year} MainerMedia Nexus. All rights reserved.</p>
        </div>
      </div>

      {/* Page 2 */}
      <div className="w-full h-[1684px] bg-black p-16 flex flex-col">
        {/* Engagement Terms */}
        {packageData.selected_option !== 'Option 1 - Independent' && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-3xl font-bold text-teal-400">ENGAGEMENT TERMS</h3>
            </div>
            <div className="w-full h-0.5 bg-teal-400 mb-6"></div>
            
            <div className="bg-gray-900 border-2 border-teal-400 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-teal-400 text-xl font-bold">&gt;</span>
                <p className="text-base text-white leading-relaxed">
                  Decision Window: 30 days from audit completion to select engagement pathway
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-teal-400 text-xl font-bold">&gt;</span>
                <p className="text-base text-white leading-relaxed">
                  Probationary Period: 3-6 months minimum commitment for proper discovery, system implementation, and data aggregation
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-teal-400 text-xl font-bold">&gt;</span>
                <p className="text-base text-white leading-relaxed">
                  Audit Credit: $5,000 audit fee credited evenly across engagement term
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-teal-400 text-xl font-bold">&gt;</span>
                <p className="text-base text-white leading-relaxed">
                  Renegotiation: After probation, review metrics and optionally renegotiate terms based on established baseline and future goals
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {packageData.notes && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-3xl font-bold text-teal-400">ADDITIONAL NOTES</h3>
            </div>
            <div className="w-full h-0.5 bg-teal-400 mb-6"></div>
            
            <div className="bg-gray-900 border-2 border-teal-400 rounded-xl p-6">
              <p className="text-base text-white leading-relaxed whitespace-pre-wrap">{packageData.notes}</p>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mb-8">
          <p className="text-xl text-white text-center leading-relaxed mb-8">
            Ready to begin? Let us schedule your initial discovery call to discuss the Audit process.
          </p>
          
          <div className="text-center">
            <h2 className="text-5xl font-bold text-white mb-4">MAINERMEDIA</h2>
            <p className="text-xl text-teal-400 mb-2">Contact us at mainermedia.com</p>
            <p className="text-xl text-teal-400">Book a Call &rarr;</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <div className="w-full h-px bg-teal-400 mb-4"></div>
          <p className="text-xs text-gray-500 text-center">&copy; {year} MainerMedia Nexus. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}