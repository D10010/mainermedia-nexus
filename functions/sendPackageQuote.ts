import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { packageId } = await req.json();

    if (!packageId) {
      return Response.json({ error: 'Package ID is required' }, { status: 400 });
    }

    // Fetch the package details
    const packages = await base44.asServiceRole.entities.Package.filter({ id: packageId });
    const pkg = packages[0];

    if (!pkg) {
      return Response.json({ error: 'Package not found' }, { status: 404 });
    }

    // Build email content
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Custom Engagement Package</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">From MainerMedia</p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p>Dear ${pkg.company_name} Team,</p>
            <p>Thank you for your interest in MainerMedia's services. We've prepared a custom engagement package tailored to your needs:</p>
            
            <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <h2 style="color: #10b981; margin-top: 0;">Package Summary</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Company:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${pkg.company_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Selected Option:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${pkg.selected_option}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Audit Fee:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981;">$5,000</td>
                </tr>
                ${pkg.calculated_retainer > 0 ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Monthly Retainer:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981;">$${pkg.calculated_retainer.toLocaleString()}/month</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Probation Period:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${pkg.probation_months} months minimum</td>
                </tr>
                ` : ''}
                ${pkg.decision_deadline ? `
                <tr>
                  <td style="padding: 10px 0;"><strong>Decision Deadline:</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${new Date(pkg.decision_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${pkg.selected_option !== 'Option 1 - Independent' ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Key Terms:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
                <li><strong>Decision Window:</strong> 30 days from audit completion</li>
                <li><strong>Probationary Period:</strong> ${pkg.probation_months}-6 months minimum commitment</li>
                <li><strong>Audit Credit:</strong> $5,000 audit fee credited evenly across engagement term</li>
                <li><strong>Renegotiation:</strong> After probation, review metrics and optionally renegotiate terms</li>
              </ul>
            </div>
            ` : ''}
            
            ${pkg.notes ? `
            <div style="background: white; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #374151; margin-top: 0;">Additional Notes:</h3>
              <p style="color: #6b7280; white-space: pre-wrap;">${pkg.notes}</p>
            </div>
            ` : ''}
            
            <p style="margin-top: 30px;">We're excited about the opportunity to work with ${pkg.company_name}. If you have any questions or would like to discuss this package further, please don't hesitate to reach out.</p>
            
            <p style="margin-top: 20px;">Best regards,<br><strong>The MainerMedia Team</strong></p>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} MainerMedia. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send the email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'MainerMedia',
      to: pkg.contact_email,
      subject: `Custom Engagement Package - ${pkg.company_name}`,
      body: emailBody
    });

    return Response.json({ 
      success: true,
      message: 'Package quote sent successfully'
    });

  } catch (error) {
    console.error('Error sending package quote:', error);
    return Response.json({ 
      error: error.message || 'Failed to send package quote'
    }, { status: 500 });
  }
});