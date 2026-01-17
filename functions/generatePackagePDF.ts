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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    // Dark background
    doc.setFillColor(10, 12, 16); // #0a0c10
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header with emerald accent
    doc.setFillColor(14, 17, 22); // #0E1116
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Emerald line accent
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 58, pageWidth, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('MAINERMEDIA', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text('NEXUS', pageWidth / 2, 37, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text('Custom Engagement Package', pageWidth / 2, 50, { align: 'center' });

    y = 75;
    doc.setTextColor(255, 255, 255);

    // Company Details Card
    doc.setFillColor(18, 22, 29); // #12161D
    doc.setDrawColor(255, 255, 255, 0.08 * 255);
    doc.rect(margin, y, pageWidth - margin * 2, 35, 'FD');
    
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont(undefined, 'normal');
    doc.text('COMPANY', margin + 5, y);
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(pkg.company_name, margin + 5, y + 8);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text(`Contact: ${pkg.contact_email}`, margin + 5, y + 16);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin + 5, y + 23);

    y += 35;

    // Engagement Details Section
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.setFont(undefined, 'normal');
    doc.text('ENGAGEMENT DETAILS', margin, y);
    
    y += 8;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(2);
    doc.line(margin, y, margin + 3, y);
    doc.line(margin + 5, y, margin + 25, y);
    
    y += 5;
    const detailsHeight = pkg.calculated_retainer > 0 ? (pkg.decision_deadline ? 65 : 55) : 35;
    doc.setFillColor(18, 22, 29);
    doc.setDrawColor(255, 255, 255, 0.08 * 255);
    doc.rect(margin, y, pageWidth - margin * 2, detailsHeight, 'FD');

    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.setFont(undefined, 'normal');
    doc.text('Selected Option:', margin + 5, y);
    doc.setTextColor(255, 255, 255);
    doc.text(pkg.selected_option, margin + 50, y);

    y += 8;
    doc.setTextColor(156, 163, 175);
    doc.text('Audit Fee:', margin + 5, y);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text('$5,000', margin + 50, y);

    if (pkg.calculated_retainer > 0) {
      y += 8;
      doc.setTextColor(156, 163, 175);
      doc.setFont(undefined, 'normal');
      doc.text('Monthly Retainer:', margin + 5, y);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text(`$${pkg.calculated_retainer.toLocaleString()}/month`, margin + 50, y);

      y += 8;
      doc.setTextColor(156, 163, 175);
      doc.setFont(undefined, 'normal');
      doc.text('Probation Period:', margin + 5, y);
      doc.setTextColor(255, 255, 255);
      doc.text(`${pkg.probation_months} months minimum`, margin + 50, y);
    }

    if (pkg.decision_deadline) {
      y += 8;
      doc.setTextColor(156, 163, 175);
      doc.text('Decision Deadline:', margin + 5, y);
      doc.setTextColor(255, 255, 255);
      doc.text(new Date(pkg.decision_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), margin + 50, y);
    }

    y += detailsHeight - (pkg.calculated_retainer > 0 ? (pkg.decision_deadline ? 32 : 24) : 16) + 8;

    // Company Profile Section
    if (pkg.company_scale || pkg.annual_revenue || pkg.gross_profit_margin || pkg.growth_target) {
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      doc.text('COMPANY PROFILE', margin, y);
      
      y += 8;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + 3, y);
      doc.line(margin + 5, y, margin + 25, y);
      
      y += 5;
      const profileItems = [pkg.company_scale, pkg.annual_revenue, pkg.gross_profit_margin, pkg.growth_target].filter(Boolean).length;
      const profileHeight = 8 + (profileItems * 7);
      
      doc.setFillColor(18, 22, 29);
      doc.setDrawColor(255, 255, 255, 0.08 * 255);
      doc.rect(margin, y, pageWidth - margin * 2, profileHeight, 'FD');

      y += 8;
      doc.setFontSize(9);

      if (pkg.company_scale) {
        doc.setTextColor(156, 163, 175);
        doc.text('Company Scale:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.company_scale, margin + 45, y);
        y += 7;
      }

      if (pkg.annual_revenue) {
        doc.setTextColor(156, 163, 175);
        doc.text('Annual Revenue:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(`$${pkg.annual_revenue.toLocaleString()}`, margin + 45, y);
        y += 7;
      }

      if (pkg.gross_profit_margin) {
        doc.setTextColor(156, 163, 175);
        doc.text('Profit Margin:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(`${pkg.gross_profit_margin}%`, margin + 45, y);
        y += 7;
      }

      if (pkg.growth_target) {
        doc.setTextColor(156, 163, 175);
        doc.text('Growth Target:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.growth_target, margin + 45, y);
        y += 7;
      }

      y += 5;
    }

    // Key Terms Section
    if (pkg.selected_option !== 'Option 1 - Independent') {
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      doc.text('KEY TERMS', margin, y);
      
      y += 8;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + 3, y);
      doc.line(margin + 5, y, margin + 25, y);
      
      y += 5;
      doc.setFillColor(16, 185, 129, 0.1 * 255);
      doc.setDrawColor(16, 185, 129, 0.3 * 255);
      doc.rect(margin, y, pageWidth - margin * 2, 45, 'FD');
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(margin, y, margin, y + 45);

      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('KEY TERMS', margin + 5, y);

      y += 8;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
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
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      doc.text('ADDITIONAL NOTES', margin, y);
      
      y += 8;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + 3, y);
      doc.line(margin + 5, y, margin + 25, y);
      
      y += 5;
      const splitNotes = doc.splitTextToSize(pkg.notes, pageWidth - margin * 2 - 10);
      const notesHeight = 8 + (splitNotes.length * 5);
      
      doc.setFillColor(18, 22, 29);
      doc.setDrawColor(255, 255, 255, 0.08 * 255);
      doc.rect(margin, y, pageWidth - margin * 2, notesHeight, 'FD');

      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(splitNotes, margin + 5, y);
      y += notesHeight;
    }

    // Footer
    const footerY = pageHeight - 25;
    doc.setFillColor(14, 17, 22);
    doc.rect(0, footerY, pageWidth, 25, 'F');
    
    doc.setFillColor(16, 185, 129);
    doc.rect(0, footerY, pageWidth, 2, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`© ${new Date().getFullYear()} MainerMedia Nexus. All rights reserved.`, pageWidth / 2, footerY + 15, { align: 'center' });

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