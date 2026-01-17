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

    // Build package summary for notification
    const packageSummary = `
Package for: ${pkg.company_name}
Contact: ${pkg.contact_email}
Option: ${pkg.selected_option}
Audit Fee: $5,000
${pkg.calculated_retainer > 0 ? `Monthly Retainer: $${pkg.calculated_retainer.toLocaleString()}/month` : ''}
${pkg.probation_months ? `Probation: ${pkg.probation_months} months` : ''}
${pkg.decision_deadline ? `Decision Deadline: ${new Date(pkg.decision_deadline).toLocaleDateString()}` : ''}
${pkg.notes ? `\nNotes: ${pkg.notes}` : ''}
    `.trim();

    // Send email to client
    const emailBody = `Hello,\n\nWe're excited to present a custom engagement package tailored to ${pkg.company_name}'s needs.\n\nPackage Details:\n${packageSummary}\n\nPlease review the attached quote and let us know if you have any questions.\n\nBest regards,\nMainerMedia Team`;

    await base44.integrations.Core.SendEmail({
      to: pkg.contact_email,
      subject: `Your Custom Engagement Package - ${pkg.company_name}`,
      body: emailBody,
      from_name: 'MainerMedia'
    });

    // Create a notification for the admin who created the package
    await base44.asServiceRole.entities.Notification.create({
      user_id: user.email,
      title: 'Package Sent',
      message: `Package for ${pkg.company_name} has been sent to ${pkg.contact_email}.\n\n${packageSummary}`,
      type: 'success',
      link: 'AdminPackages',
      metadata: { packageId: packageId }
    });

    return Response.json({ 
      success: true,
      message: `Package sent to ${pkg.contact_email} and notification created.`
    });

  } catch (error) {
    console.error('Error sending package quote:', error);
    return Response.json({ 
      error: error.message || 'Failed to send package quote'
    }, { status: 500 });
  }
});