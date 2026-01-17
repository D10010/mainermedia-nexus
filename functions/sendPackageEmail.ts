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
    const pkg = await base44.asServiceRole.entities.Package.get(packageId);

    if (!pkg) {
      return Response.json({ error: 'Package not found' }, { status: 404 });
    }

    // Get app settings for custom sender email
    const appSettings = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'This is a helper call to retrieve app metadata.'
    }).catch(() => ({}));
    
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'noreply@base44.com';
    const senderName = Deno.env.get('SENDER_NAME') || 'MainerMedia';

    // Build HTML email body
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .package-detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .package-detail:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #10b981; }
        .detail-value { color: #666; text-align: right; }
        .cta { background: #10b981; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .notes-section { background: #f0f9ff; padding: 15px; border-left: 4px solid #10b981; margin-top: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Custom Engagement Package</h1>
            <p>Proposal for ${pkg.company_name}</p>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We're excited to present a custom engagement package tailored specifically to <strong>${pkg.company_name}'s</strong> needs and growth objectives.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <div style="font-weight: 600; color: #333; margin-bottom: 15px;">Package Details</div>
                <div class="package-detail">
                    <span class="detail-label">Engagement Option:</span>
                    <span class="detail-value">${pkg.selected_option}</span>
                </div>
                <div class="package-detail">
                    <span class="detail-label">Audit Fee:</span>
                    <span class="detail-value">$5,000</span>
                </div>
                ${pkg.calculated_retainer > 0 ? `
                <div class="package-detail">
                    <span class="detail-label">Monthly Retainer:</span>
                    <span class="detail-value">$${pkg.calculated_retainer.toLocaleString()}/month</span>
                </div>` : ''}
                ${pkg.probation_months ? `
                <div class="package-detail">
                    <span class="detail-label">Probation Period:</span>
                    <span class="detail-value">${pkg.probation_months} months</span>
                </div>` : ''}
                ${pkg.decision_deadline ? `
                <div class="package-detail">
                    <span class="detail-label">Decision Deadline:</span>
                    <span class="detail-value">${new Date(pkg.decision_deadline).toLocaleDateString()}</span>
                </div>` : ''}
            </div>
            
            ${pkg.notes ? `
            <div class="notes-section">
                <strong>Additional Notes:</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${pkg.notes}</p>
            </div>` : ''}
            
            <p>Please review this proposal carefully. We're confident this package will help ${pkg.company_name} achieve your growth objectives.</p>
            <p>If you have any questions or would like to discuss this proposal further, please don't hesitate to reach out.</p>
            
            <p style="margin-top: 30px;">
                <strong>Best regards,</strong><br>
                MainerMedia Team
            </p>
            
            <div class="footer">
                <p>This is a custom engagement proposal. If you have any questions, please reply to this email or contact us directly.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: pkg.contact_email,
      subject: `Your Custom Engagement Package - ${pkg.company_name}`,
      body: emailBody,
      from_name: senderName
    });

    // Update package status to Sent
    await base44.asServiceRole.entities.Package.update(packageId, { status: 'Sent' });

    return Response.json({ 
      success: true,
      message: `Package email sent to ${pkg.contact_email}.`
    });

  } catch (error) {
    console.error('Error sending package email:', error);
    return Response.json({ 
      error: error.message || 'Failed to send package email'
    }, { status: 500 });
  }
});