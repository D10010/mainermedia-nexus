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
    const bottomMargin = 30; // Space for footer
    let y = 20;
    
    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace) => {
      if (y + requiredSpace > pageHeight - bottomMargin) {
        doc.addPage();
        // Add dark background to new page
        doc.setFillColor(10, 12, 16);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        y = 20;
        return true;
      }
      return false;
    };

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
    checkPageBreak(40);
    doc.setFillColor(18, 22, 29);
    doc.setDrawColor(255, 255, 255, 0.08 * 255);
    doc.rect(margin, y, pageWidth - margin * 2, 32, 'FD');
    
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont(undefined, 'normal');
    doc.text('COMPANY', margin + 5, y);
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(pkg.company_name, margin + 5, y + 7);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(`Contact: ${pkg.contact_email}`, margin + 5, y + 14);
    
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin + 5, y + 20);

    y += 30;

    // Engagement Details Section
    y += 8;
    checkPageBreak(70);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont(undefined, 'normal');
    doc.text('ENGAGEMENT DETAILS', margin, y);
    
    y += 6;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 20, y);
    
    y += 4;
    const detailsHeight = pkg.calculated_retainer > 0 ? (pkg.decision_deadline ? 48 : 40) : 25;
    doc.setFillColor(18, 22, 29);
    doc.setDrawColor(255, 255, 255, 0.08 * 255);
    doc.rect(margin, y, pageWidth - margin * 2, detailsHeight, 'FD');

    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont(undefined, 'normal');
    doc.text('Selected Option:', margin + 5, y);
    doc.setTextColor(255, 255, 255);
    doc.text(pkg.selected_option, margin + 45, y);

    y += 6;
    doc.setTextColor(156, 163, 175);
    doc.text('Audit Fee:', margin + 5, y);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text('$5,000', margin + 45, y);

    if (pkg.calculated_retainer > 0) {
      y += 6;
      doc.setTextColor(156, 163, 175);
      doc.setFont(undefined, 'normal');
      doc.text('Monthly Retainer:', margin + 5, y);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text(`$${pkg.calculated_retainer.toLocaleString()}/month`, margin + 45, y);

      y += 6;
      doc.setTextColor(156, 163, 175);
      doc.setFont(undefined, 'normal');
      doc.text('Probation Period:', margin + 5, y);
      doc.setTextColor(255, 255, 255);
      doc.text(`${pkg.probation_months} months minimum`, margin + 45, y);
    }

    if (pkg.decision_deadline) {
      y += 6;
      doc.setTextColor(156, 163, 175);
      doc.text('Decision Deadline:', margin + 5, y);
      doc.setTextColor(255, 255, 255);
      doc.text(new Date(pkg.decision_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), margin + 45, y);
    }

    y += detailsHeight - (pkg.calculated_retainer > 0 ? (pkg.decision_deadline ? 24 : 18) : 12) + 8;

    // Company Profile Section
    if (pkg.company_scale || pkg.annual_revenue || pkg.gross_profit_margin || pkg.growth_target) {
      checkPageBreak(50);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      doc.text('COMPANY PROFILE', margin, y);
      
      y += 6;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1.5);
      doc.line(margin, y, margin + 20, y);
      
      y += 4;
      const profileItems = [pkg.company_scale, pkg.annual_revenue, pkg.gross_profit_margin, pkg.growth_target].filter(Boolean).length;
      const profileHeight = 6 + (profileItems * 6);
      
      doc.setFillColor(18, 22, 29);
      doc.setDrawColor(255, 255, 255, 0.08 * 255);
      doc.rect(margin, y, pageWidth - margin * 2, profileHeight, 'FD');

      y += 6;
      doc.setFontSize(8);

      if (pkg.company_scale) {
        doc.setTextColor(156, 163, 175);
        doc.text('Company Scale:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.company_scale, margin + 40, y);
        y += 5;
      }

      if (pkg.annual_revenue) {
        doc.setTextColor(156, 163, 175);
        doc.text('Annual Revenue:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(`$${pkg.annual_revenue.toLocaleString()}`, margin + 40, y);
        y += 5;
      }

      if (pkg.gross_profit_margin) {
        doc.setTextColor(156, 163, 175);
        doc.text('Profit Margin:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(`${pkg.gross_profit_margin}%`, margin + 40, y);
        y += 5;
      }

      if (pkg.growth_target) {
        doc.setTextColor(156, 163, 175);
        doc.text('Growth Target:', margin + 5, y);
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.growth_target, margin + 40, y);
        y += 5;
      }

      y += 8;
    }

    // Key Terms Section
    if (pkg.selected_option !== 'Option 1 - Independent') {
      checkPageBreak(60);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      doc.text('ENGAGEMENT TERMS', margin, y);
      
      y += 6;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1.5);
      doc.line(margin, y, margin + 20, y);
      
      y += 4;
      const termsBoxHeight = 45;
      doc.setFillColor(18, 22, 29);
      doc.setDrawColor(16, 185, 129, 0.5 * 255);
      doc.rect(margin, y, pageWidth - margin * 2, termsBoxHeight, 'FD');
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(margin, y, margin, y + termsBoxHeight);

      y += 8;
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.setFont(undefined, 'normal');
      
      const terms = [
        `Decision Window: 30 days from audit completion`,
        `Probationary: ${pkg.probation_months}-6 months minimum commitment`,
        `Audit Credit: $5,000 credited evenly across term`,
        `Renegotiation: Review metrics after probation period`
      ];
      
      terms.forEach((term) => {
        const lines = doc.splitTextToSize(term, pageWidth - margin * 2 - 12);
        doc.text('>', margin + 5, y);
        doc.text(lines, margin + 10, y);
        y += lines.length * 4.5 + 1;
      });

      y += 10;
    }

    // Notes Section
    if (pkg.notes) {
      const splitNotes = doc.splitTextToSize(pkg.notes, pageWidth - margin * 2 - 10);
      const notesHeight = 10 + (splitNotes.length * 4);
      
      checkPageBreak(notesHeight + 20);
      
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont(undefined, 'normal');
      doc.text('ADDITIONAL NOTES', margin, y);
      
      y += 6;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1.5);
      doc.line(margin, y, margin + 20, y);
      
      y += 4;
      doc.setFillColor(18, 22, 29);
      doc.setDrawColor(255, 255, 255, 0.08 * 255);
      doc.rect(margin, y, pageWidth - margin * 2, notesHeight, 'FD');

      y += 7;
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(splitNotes, margin + 5, y);
    }

    // Add footer to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 20;
      
      doc.setFillColor(14, 17, 22);
      doc.rect(0, footerY, pageWidth, 20, 'F');
      
      doc.setFillColor(16, 185, 129);
      doc.rect(0, footerY, pageWidth, 1.5, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(`© ${new Date().getFullYear()} MainerMedia Nexus. All rights reserved.`, pageWidth / 2, footerY + 12, { align: 'center' });
    }

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