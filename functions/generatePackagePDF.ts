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

    // Create PDF (A4 size - 210mm x 297mm)
    const doc = new jsPDF({ 
      unit: 'mm',
      format: 'a4'
    });
    
    // Colors
    const black = [0, 0, 0];
    const white = [255, 255, 255];
    const teal = [0, 255, 170]; // #00FFAA
    const darkGray = [26, 26, 26]; // #1A1A1A
    const lightGray = [170, 170, 170]; // #AAAAAA
    
    // Helper to draw rounded rectangle
    const drawRoundedBox = (x, y, w, h, r = 2) => {
      doc.setFillColor(...darkGray);
      doc.setDrawColor(...teal);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, r, r, 'FD');
    };
    
    // ===== PAGE 1 =====
    
    // Black background
    doc.setFillColor(...black);
    doc.rect(0, 0, 210, 297, 'F');
    
    // MAINERMEDIA - centered at (105, 20)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(...white);
    doc.text('MAINERMEDIA', 105, 30, { align: 'center' });
    
    // NEXUS - centered at (105, 50)
    doc.setFontSize(36);
    doc.setTextColor(...teal);
    doc.text('NEXUS', 105, 50, { align: 'center' });
    
    // Custom Engagement Package - centered at (105, 70)
    doc.setFontSize(24);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.text('Custom Engagement Package', 105, 68, { align: 'center' });
    
    // Horizontal divider
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.5);
    doc.line(20, 78, 190, 78);
    
    // Company info box at (20, 90) - 170x40mm
    drawRoundedBox(20, 85, 170, 35, 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...white);
    doc.text(`COMPANY: ${pkg.company_name}`, 25, 95);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Contact: ${pkg.contact_email}`, 25, 105);
    
    doc.setTextColor(...lightGray);
    doc.setFontSize(10);
    const genDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated: ${genDate}`, 25, 113);
    
    // ENGAGEMENT DETAILS header at (20, 140)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...teal);
    doc.text('ENGAGEMENT DETAILS', 20, 135);
    
    // Teal underline
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.6);
    doc.line(20, 137, 100, 137);
    
    // Details box at (20, 140) - 170x80mm
    const detailsBoxHeight = pkg.calculated_retainer > 0 ? 
      (pkg.decision_deadline ? 50 : 42) : 35;
    drawRoundedBox(20, 145, 170, detailsBoxHeight, 2);
    
    let detailY = 153;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...white);
    doc.text('Selected Option:', 25, detailY);
    doc.setFont('helvetica', 'bold');
    doc.text(pkg.selected_option, 80, detailY);
    
    detailY += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Audit Fee:', 25, detailY);
    doc.setTextColor(...teal);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('$5,000', 80, detailY);
    
    if (pkg.calculated_retainer > 0) {
      detailY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      doc.text('Monthly Retainer:', 25, detailY);
      doc.setTextColor(...teal);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`$${pkg.calculated_retainer.toLocaleString()}/month`, 80, detailY);
      
      detailY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      doc.text('Probation Period:', 25, detailY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${pkg.probation_months} months minimum`, 80, detailY);
    }
    
    if (pkg.decision_deadline) {
      detailY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...white);
      doc.text('Decision Deadline:', 25, detailY);
      doc.setFont('helvetica', 'bold');
      const deadline = new Date(pkg.decision_deadline).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(deadline, 80, detailY);
    }
    
    // COMPANY PROFILE section
    const profileY = 145 + detailsBoxHeight + 15;
    
    if (pkg.company_scale || pkg.annual_revenue || pkg.gross_profit_margin || pkg.growth_target) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...teal);
      doc.text('COMPANY PROFILE', 20, profileY);
      
      // Teal underline
      doc.setLineWidth(0.6);
      doc.line(20, profileY + 2, 95, profileY + 2);
      
      const profileItems = [
        pkg.company_scale, 
        pkg.annual_revenue, 
        pkg.gross_profit_margin, 
        pkg.growth_target
      ].filter(Boolean).length;
      const profileBoxHeight = 10 + (profileItems * 8);
      
      drawRoundedBox(20, profileY + 8, 170, profileBoxHeight, 2);
      
      let profileDetailY = profileY + 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      
      if (pkg.company_scale) {
        doc.text('Company Scale:', 25, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.text(pkg.company_scale, 80, profileDetailY);
        doc.setFont('helvetica', 'normal');
        profileDetailY += 8;
      }
      
      if (pkg.annual_revenue) {
        doc.text('Annual Revenue:', 25, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${parseFloat(pkg.annual_revenue).toLocaleString()}`, 80, profileDetailY);
        doc.setFont('helvetica', 'normal');
        profileDetailY += 8;
      }
      
      if (pkg.gross_profit_margin) {
        doc.text('Profit Margin:', 25, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.text(`${pkg.gross_profit_margin}%`, 80, profileDetailY);
        doc.setFont('helvetica', 'normal');
        profileDetailY += 8;
      }
      
      if (pkg.growth_target) {
        doc.text('Growth Target:', 25, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.text(pkg.growth_target, 80, profileDetailY);
      }
    }
    
    // Footer for page 1
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
    
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.setFont('helvetica', 'normal');
    const year = new Date().getFullYear();
    doc.text(`\u00A9 ${year} MainerMedia Nexus. All rights reserved.`, 105, 285, { align: 'center' });
    
    // ===== PAGE 2 =====
    doc.addPage();
    doc.setFillColor(...black);
    doc.rect(0, 0, 210, 297, 'F');
    
    // ENGAGEMENT TERMS header at (20, 20)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...teal);
    doc.text('ENGAGEMENT TERMS', 20, 25);
    
    // Teal underline
    doc.setLineWidth(0.6);
    doc.line(20, 27, 90, 27);
    
    // Terms box
    if (pkg.selected_option !== 'Option 1 - Independent') {
      const termsBoxHeight = 58;
      drawRoundedBox(20, 35, 170, termsBoxHeight, 2);
      
      let termsY = 43;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...white);
      
      const terms = [
        'Decision Window: 30 days from audit completion to select engagement pathway',
        'Probationary Period: 3-6 months minimum commitment for proper discovery, system implementation, and data aggregation',
        'Audit Credit: $5,000 audit fee credited evenly across engagement term',
        'Renegotiation: After probation, review metrics and optionally renegotiate terms based on established baseline and future goals'
      ];
      
      terms.forEach((term) => {
        doc.setTextColor(...teal);
        doc.setFont('helvetica', 'bold');
        doc.text('>', 25, termsY);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(term, 158);
        doc.text(lines, 30, termsY);
        termsY += (lines.length * 4) + 3;
      });
    }
    
    // ADDITIONAL NOTES section
    let notesY = 105;
    if (pkg.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...teal);
      doc.text('ADDITIONAL NOTES', 20, notesY);
      
      // Teal underline
      doc.setLineWidth(0.6);
      doc.line(20, notesY + 2, 90, notesY + 2);
      
      const splitNotes = doc.splitTextToSize(pkg.notes, 160);
      const notesBoxHeight = 10 + (splitNotes.length * 5);
      
      drawRoundedBox(20, notesY + 8, 170, notesBoxHeight, 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.text(splitNotes, 25, notesY + 15);
      
      notesY += notesBoxHeight + 8 + 15;
    }
    
    // Call to Action at (20, 180)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...white);
    const ctaText = 'Ready to begin? Let us schedule your initial discovery call to discuss the Audit process.';
    const ctaLines = doc.splitTextToSize(ctaText, 170);
    doc.text(ctaLines, 105, notesY, { align: 'center' });
    
    notesY += (ctaLines.length * 6) + 10;
    
    // MAINERMEDIA - centered at (105, 200)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('MAINERMEDIA', 105, notesY, { align: 'center' });
    
    notesY += 10;
    
    // Contact info - centered at (105, 215)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...teal);
    doc.text('Contact us at mainermedia.com', 105, notesY, { align: 'center' });
    
    notesY += 8;
    doc.text('Book a Call \u2192', 105, notesY, { align: 'center' });
    
    // Footer for page 2
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
    
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text(`\u00A9 ${year} MainerMedia Nexus. All rights reserved.`, 105, 285, { align: 'center' });

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