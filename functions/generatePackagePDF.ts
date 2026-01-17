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

    // Create PDF (A4 size)
    const doc = new jsPDF({ format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25; // ~1 inch margins
    let y = 0;
    
    // Colors
    const black = '#000000';
    const white = '#FFFFFF';
    const teal = '#00FFAA';
    const darkGray = '#1A1A1A';
    const lightGray = '#AAAAAA';
    
    // Helper to convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    // Helper to set color
    const setColor = (hex) => {
      const rgb = hexToRgb(hex);
      return [rgb.r, rgb.g, rgb.b];
    };
    
    // Helper for page break
    const checkPageBreak = (requiredSpace) => {
      if (y + requiredSpace > pageHeight - margin - 20) {
        doc.addPage();
        // Black background
        doc.setFillColor(...setColor(black));
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        y = margin;
        return true;
      }
      return false;
    };
    
    // Helper to draw rounded rect (jsPDF built-in)
    const drawBox = (x, y, w, h) => {
      doc.setFillColor(...setColor(darkGray));
      doc.setDrawColor(...setColor(teal));
      doc.setLineWidth(1);
      doc.rect(x, y, w, h, 'FD'); // Fill and Draw
    };
    
    // ===== PAGE 1 =====
    
    // Black background
    doc.setFillColor(...setColor(black));
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    y = margin + 15;
    
    // Header: MAINERMEDIA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(...setColor(white));
    doc.text('MAINERMEDIA', pageWidth / 2, y, { align: 'center' });
    
    y += 18;
    
    // NEXUS in teal
    doc.setFontSize(36);
    doc.setTextColor(...setColor(teal));
    doc.text('NEXUS', pageWidth / 2, y, { align: 'center' });
    
    y += 16;
    
    // Subheader
    doc.setFontSize(24);
    doc.setTextColor(...setColor(white));
    doc.setFont('helvetica', 'normal');
    doc.text('Custom Engagement Package', pageWidth / 2, y, { align: 'center' });
    
    y += 20;
    
    // Teal line separator
    doc.setDrawColor(...setColor(teal));
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 15;
    
    // Company Info Box
    const boxHeight = 28;
    drawBox(margin, y, pageWidth - margin * 2, boxHeight);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...setColor(white));
    doc.text(`COMPANY: ${pkg.company_name}`, margin + 5, y);
    
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Contact: ${pkg.contact_email}`, margin + 5, y);
    
    y += 7;
    doc.setTextColor(...setColor(lightGray));
    doc.setFontSize(9);
    const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.text(`Generated: ${genDate}`, margin + 5, y);
    
    y += 18;
    
    // Engagement Details Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...setColor(teal));
    doc.text('ENGAGEMENT DETAILS', margin, y);
    
    y += 3;
    doc.setDrawColor(...setColor(teal));
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 80, y);
    
    y += 12;
    
    // Details box
    const detailsHeight = pkg.calculated_retainer > 0 ? (pkg.decision_deadline ? 48 : 40) : 30;
    drawBox(margin, y, pageWidth - margin * 2, detailsHeight);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...setColor(white));
    doc.text('Selected Option:', margin + 5, y);
    doc.setFont('helvetica', 'bold');
    doc.text(pkg.selected_option, margin + 50, y);
    
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Audit Fee:', margin + 5, y);
    doc.setTextColor(...setColor(teal));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('$5,000', margin + 50, y);
    
    if (pkg.calculated_retainer > 0) {
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...setColor(white));
      doc.text('Monthly Retainer:', margin + 5, y);
      doc.setTextColor(...setColor(teal));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`$${pkg.calculated_retainer.toLocaleString()}/month`, margin + 50, y);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...setColor(white));
      doc.text('Probation Period:', margin + 5, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${pkg.probation_months} months minimum`, margin + 50, y);
    }
    
    if (pkg.decision_deadline) {
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...setColor(white));
      doc.text('Decision Deadline:', margin + 5, y);
      doc.setFont('helvetica', 'bold');
      const deadline = new Date(pkg.decision_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      doc.text(deadline, margin + 50, y);
    }
    
    y += detailsHeight - (pkg.calculated_retainer > 0 ? (pkg.decision_deadline ? 32 : 24) : 20) + 15;
    
    // Company Profile Section
    if (pkg.company_scale || pkg.annual_revenue || pkg.gross_profit_margin || pkg.growth_target) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...setColor(teal));
      doc.text('COMPANY PROFILE', margin, y);
      
      y += 3;
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 70, y);
      
      y += 12;
      
      const profileItems = [pkg.company_scale, pkg.annual_revenue, pkg.gross_profit_margin, pkg.growth_target].filter(Boolean).length;
      const profileHeight = 8 + (profileItems * 8);
      
      drawBox(margin, y, pageWidth - margin * 2, profileHeight);
      
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...setColor(white));
      
      if (pkg.company_scale) {
        doc.text('Company Scale:', margin + 5, y);
        doc.setFont('helvetica', 'bold');
        doc.text(pkg.company_scale, margin + 50, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
      }
      
      if (pkg.annual_revenue) {
        doc.text('Annual Revenue:', margin + 5, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${parseFloat(pkg.annual_revenue).toLocaleString()}`, margin + 50, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
      }
      
      if (pkg.gross_profit_margin) {
        doc.text('Profit Margin:', margin + 5, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`${pkg.gross_profit_margin}%`, margin + 50, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
      }
      
      if (pkg.growth_target) {
        doc.text('Growth Target:', margin + 5, y);
        doc.setFont('helvetica', 'bold');
        doc.text(pkg.growth_target, margin + 50, y);
        y += 7;
      }
    }
    
    // ===== PAGE 2 =====
    doc.addPage();
    doc.setFillColor(...setColor(black));
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    y = margin + 15;
    
    // Engagement Terms Section
    if (pkg.selected_option !== 'Option 1 - Independent') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...setColor(teal));
      doc.text('ENGAGEMENT TERMS', margin, y);
      
      y += 3;
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 75, y);
      
      y += 12;
      
      const termsHeight = 55;
      drawBox(margin, y, pageWidth - margin * 2, termsHeight);
      
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...setColor(white));
      
      const terms = [
        'Decision Window: 30 days from audit completion',
        `Probationary Period: ${pkg.probation_months}-6 months minimum commitment`,
        'Audit Credit: $5,000 audit fee credited evenly across engagement term',
        'Renegotiation: After probation, review metrics and optionally renegotiate terms'
      ];
      
      terms.forEach((term) => {
        doc.setTextColor(...setColor(teal));
        doc.setFont('helvetica', 'bold');
        doc.text('>', margin + 5, y);
        doc.setTextColor(...setColor(white));
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(term, pageWidth - margin * 2 - 15);
        doc.text(lines, margin + 10, y);
        y += lines.length * 5 + 3;
      });
      
      y += 8;
    }
    
    // Additional Notes Section
    if (pkg.notes) {
      checkPageBreak(40);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...setColor(teal));
      doc.text('ADDITIONAL NOTES', margin, y);
      
      y += 3;
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 75, y);
      
      y += 12;
      
      const splitNotes = doc.splitTextToSize(pkg.notes, pageWidth - margin * 2 - 10);
      const notesHeight = 10 + (splitNotes.length * 5);
      
      drawBox(margin, y, pageWidth - margin * 2, notesHeight);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...setColor(white));
      doc.text(splitNotes, margin + 5, y);
      
      y += notesHeight + 5;
    }
    
    // Call to Action Section
    checkPageBreak(50);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...setColor(white));
    const ctaText = 'Ready to begin? Let us schedule your initial discovery call to discuss the Audit process.';
    const ctaLines = doc.splitTextToSize(ctaText, pageWidth - margin * 2);
    doc.text(ctaLines, pageWidth / 2, y, { align: 'center' });
    
    y += ctaLines.length * 6 + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MAINERMEDIA', pageWidth / 2, y, { align: 'center' });
    
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...setColor(teal));
    doc.text('Contact us at mainermedia.com', pageWidth / 2, y, { align: 'center' });
    
    y += 7;
    doc.text('Book a Call →', pageWidth / 2, y, { align: 'center' });
    
    // Add footer to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;
      
      // Teal line
      doc.setDrawColor(...setColor(teal));
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      // Copyright
      doc.setFontSize(8);
      doc.setTextColor(...setColor(lightGray));
      doc.setFont('helvetica', 'normal');
      doc.text(`© ${new Date().getFullYear()} MainerMedia Nexus. All rights reserved.`, pageWidth / 2, footerY + 7, { align: 'center' });
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