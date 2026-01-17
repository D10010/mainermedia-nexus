import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

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

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header with brand color
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('MAINERMEDIA', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Custom Engagement Package', pageWidth / 2, 38, { align: 'center' });

    y = 65;
    doc.setTextColor(0, 0, 0);

    // Company Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('COMPANY', margin, y);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(pkg.company_name, margin, y + 8);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Contact: ${pkg.contact_email}`, margin, y + 16);
    
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, y + 23);

    y += 40;

    // Engagement Details Section
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(3);
    doc.line(margin, y, margin, y + 80);
    
    doc.setFillColor(249, 250, 251);
    doc.rect(margin + 5, y, pageWidth - margin * 2 - 5, 80, 'F');

    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text('ENGAGEMENT DETAILS', margin + 10, y);

    y += 12;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Selected Option:', margin + 10, y);
    doc.setFont(undefined, 'normal');
    doc.text(pkg.selected_option, margin + 55, y);

    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Audit Fee:', margin + 10, y);
    doc.setTextColor(16, 185, 129);
    doc.text('$5,000', margin + 55, y);

    if (pkg.calculated_retainer > 0) {
      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.text('Monthly Retainer:', margin + 10, y);
      doc.setTextColor(16, 185, 129);
      doc.text(`$${pkg.calculated_retainer.toLocaleString()}/month`, margin + 55, y);

      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.text('Probation Period:', margin + 10, y);
      doc.setTextColor(0, 0, 0);
      doc.text(`${pkg.probation_months} months minimum`, margin + 55, y);
    }

    if (pkg.decision_deadline) {
      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.text('Decision Deadline:', margin + 10, y);
      doc.text(new Date(pkg.decision_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), margin + 55, y);
    }

    y += 25;

    // Company Profile Section
    if (pkg.company_scale || pkg.annual_revenue || pkg.gross_profit_margin || pkg.growth_target) {
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('COMPANY PROFILE', margin, y);

      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      if (pkg.company_scale) {
        doc.setFont(undefined, 'bold');
        doc.text('Company Scale:', margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(pkg.company_scale, margin + 40, y);
        y += 7;
      }

      if (pkg.annual_revenue) {
        doc.setFont(undefined, 'bold');
        doc.text('Annual Revenue:', margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(`$${pkg.annual_revenue.toLocaleString()}`, margin + 40, y);
        y += 7;
      }

      if (pkg.gross_profit_margin) {
        doc.setFont(undefined, 'bold');
        doc.text('Profit Margin:', margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(`${pkg.gross_profit_margin}%`, margin + 40, y);
        y += 7;
      }

      if (pkg.growth_target) {
        doc.setFont(undefined, 'bold');
        doc.text('Growth Target:', margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(pkg.growth_target, margin + 40, y);
        y += 7;
      }

      y += 8;
    }

    // Key Terms Section
    if (pkg.selected_option !== 'Option 1 - Independent') {
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, y, pageWidth - margin * 2, 50, 'F');
      
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(2);
      doc.line(margin, y, margin, y + 50);

      y += 10;
      doc.setFontSize(12);
      doc.setTextColor(146, 64, 14);
      doc.setFont(undefined, 'bold');
      doc.text('KEY TERMS', margin + 5, y);

      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(120, 53, 15);
      doc.setFont(undefined, 'normal');
      doc.text('• Decision Window: 30 days from audit completion', margin + 5, y);
      y += 6;
      doc.text(`• Probationary Period: ${pkg.probation_months}-6 months minimum commitment`, margin + 5, y);
      y += 6;
      doc.text('• Audit Credit: $5,000 audit fee credited evenly across engagement term', margin + 5, y);
      y += 6;
      doc.text('• Renegotiation: After probation, review metrics and optionally renegotiate terms', margin + 5, y);

      y += 15;
    }

    // Notes Section
    if (pkg.notes) {
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('ADDITIONAL NOTES', margin, y);

      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(pkg.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, y);
      y += splitNotes.length * 5 + 10;
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFillColor(31, 41, 55);
    doc.rect(0, footerY, pageWidth, 20, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`© ${new Date().getFullYear()} MainerMedia. All rights reserved.`, pageWidth / 2, footerY + 12, { align: 'center' });

    // Generate PDF buffer
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Package-${pkg.company_name.replace(/\s+/g, '-')}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating package PDF:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate PDF'
    }, { status: 500 });
  }
});