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

    // Create PDF (A4 size - 595pt x 842pt in points)
    const doc = new jsPDF({ 
      unit: 'pt',
      format: 'a4'
    });
    
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 60;
    
    // Colors (RGB)
    const black = [0, 0, 0];
    const white = [255, 255, 255];
    const teal = [0, 255, 170]; // #00FFAA
    const darkGray = [26, 26, 26]; // #1A1A1A
    const lightGray = [170, 170, 170]; // #AAAAAA
    
    // Helper to draw rounded rectangle with border
    const drawRoundedBox = (x, y, w, h, r = 10) => {
      doc.setFillColor(...darkGray);
      doc.setDrawColor(...teal);
      doc.setLineWidth(2);
      doc.roundedRect(x, y, w, h, r, r, 'FD');
    };
    
    // Helper to add footer
    const addFooter = () => {
      doc.setDrawColor(...teal);
      doc.setLineWidth(1);
      doc.line(margin, 800, pageWidth - margin, 800);
      
      doc.setFontSize(8);
      doc.setTextColor(...lightGray);
      doc.setFont('helvetica', 'normal');
      const year = new Date().getFullYear();
      doc.text(`\u00A9 ${year} MainerMedia Nexus. All rights reserved.`, pageWidth / 2, 815, { align: 'center' });
    };
    
    // ===== PAGE 1 =====
    
    // Black background
    doc.setFillColor(...black);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header: MAINERMEDIA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(...white);
    doc.text('MAINERMEDIA', pageWidth / 2, 80, { align: 'center' });
    
    // NEXUS
    doc.setFontSize(36);
    doc.setTextColor(...teal);
    doc.text('NEXUS', pageWidth / 2, 120, { align: 'center' });
    
    // Custom Engagement Package
    doc.setFontSize(24);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.text('Custom Engagement Package', pageWidth / 2, 150, { align: 'center' });
    
    // Horizontal divider
    doc.setDrawColor(...teal);
    doc.setLineWidth(1);
    doc.line(margin, 165, pageWidth - margin, 165);
    
    // Introductory text block
    doc.setFontSize(11);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    const introText = 'A catalyst for accelerated growth. We utilize a data-driven methodology to ensure every marketing dollar contributes to your bottom line, turning insights into revenue and market presence into sustainable competitive advantage.';
    const introLines = doc.splitTextToSize(introText, pageWidth - margin * 2);
    doc.text(introLines, margin, 185);
    
    // Company info box at (60, 210)
    const companyBoxY = 210;
    drawRoundedBox(margin, companyBoxY, pageWidth - margin * 2, 80, 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...white);
    doc.text(`COMPANY: ${pkg.company_name}`, margin + 10, companyBoxY + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Contact: ${pkg.contact_email}`, margin + 10, companyBoxY + 40);
    
    doc.setTextColor(...lightGray);
    doc.setFontSize(10);
    const genDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated: ${genDate}`, margin + 10, companyBoxY + 60);
    
    // ENGAGEMENT DETAILS section
    const engagementY = 315;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...teal);
    doc.text('ENGAGEMENT DETAILS', margin, engagementY);
    
    // Teal underline
    doc.setDrawColor(...teal);
    doc.setLineWidth(2);
    doc.line(margin, engagementY + 5, pageWidth - margin, engagementY + 5);
    
    // Details box
    const detailsBoxY = engagementY + 15;
    const detailsBoxHeight = pkg.calculated_retainer > 0 ? 
      (pkg.decision_deadline ? 130 : 110) : 90;
    drawRoundedBox(margin, detailsBoxY, pageWidth - margin * 2, detailsBoxHeight, 10);
    
    let detailY = detailsBoxY + 25;
    const labelX = margin + 15;
    const valueX = margin + 180;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...white);
    doc.text('Selected Option:', labelX, detailY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(pkg.selected_option, valueX, detailY);
    
    detailY += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Audit Fee:', labelX, detailY);
    doc.setTextColor(...teal);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('$5,000', valueX, detailY);
    
    if (pkg.calculated_retainer > 0) {
      detailY += 22;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      doc.text('Monthly Retainer:', labelX, detailY);
      doc.setTextColor(...teal);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`$${pkg.calculated_retainer.toLocaleString()}/month`, valueX, detailY);
      
      detailY += 22;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      doc.text('Probation Period:', labelX, detailY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${pkg.probation_months} months minimum`, valueX, detailY);
    }
    
    if (pkg.decision_deadline) {
      detailY += 22;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      doc.text('Decision Deadline:', labelX, detailY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const deadline = new Date(pkg.decision_deadline).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(deadline, valueX, detailY);
    }
    
    // COMPANY PROFILE section
    const profileY = detailsBoxY + detailsBoxHeight + 25;
    
    if (pkg.company_scale || pkg.annual_revenue || pkg.gross_profit_margin || pkg.growth_target) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...teal);
      doc.text('COMPANY PROFILE', margin, profileY);
      
      // Teal underline
      doc.setLineWidth(2);
      doc.line(margin, profileY + 5, pageWidth - margin, profileY + 5);
      
      const profileItems = [
        pkg.company_scale, 
        pkg.annual_revenue, 
        pkg.gross_profit_margin, 
        pkg.growth_target
      ].filter(Boolean).length;
      const profileBoxHeight = 30 + (profileItems * 22);
      const profileBoxY = profileY + 15;
      
      drawRoundedBox(margin, profileBoxY, pageWidth - margin * 2, profileBoxHeight, 10);
      
      let profileDetailY = profileBoxY + 25;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...white);
      
      if (pkg.company_scale) {
        doc.text('Company Scale:', labelX, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(pkg.company_scale, valueX, profileDetailY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        profileDetailY += 22;
      }
      
      if (pkg.annual_revenue) {
        doc.text('Annual Revenue:', labelX, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`$${parseFloat(pkg.annual_revenue).toLocaleString()}`, valueX, profileDetailY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        profileDetailY += 22;
      }
      
      if (pkg.gross_profit_margin) {
        doc.text('Profit Margin:', labelX, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${pkg.gross_profit_margin}%`, valueX, profileDetailY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        profileDetailY += 22;
      }
      
      if (pkg.growth_target) {
        doc.text('Growth Target:', labelX, profileDetailY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(pkg.growth_target, valueX, profileDetailY);
      }
    }
    
    // Footer for page 1
    addFooter();
    
    // ===== PAGE 2 =====
    doc.addPage();
    doc.setFillColor(...black);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // ENGAGEMENT TERMS section
    const termsY = 60;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...teal);
    doc.text('ENGAGEMENT TERMS', margin, termsY);
    
    // Teal underline
    doc.setLineWidth(2);
    doc.line(margin, termsY + 5, pageWidth - margin, termsY + 5);
    
    // Terms box
    if (pkg.selected_option !== 'Option 1 - Independent') {
      const termsBoxY = termsY + 15;
      const termsBoxHeight = 140;
      drawRoundedBox(margin, termsBoxY, pageWidth - margin * 2, termsBoxHeight, 10);
      
      let termY = termsBoxY + 20;
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
        doc.text('>', margin + 15, termY);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(term, pageWidth - margin * 2 - 40);
        doc.text(lines, margin + 25, termY);
        termY += (lines.length * 12) + 8;
      });
    }
    
    // ADDITIONAL NOTES section
    const notesY = 230;
    if (pkg.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...teal);
      doc.text('ADDITIONAL NOTES', margin, notesY);
      
      // Teal underline
      doc.setLineWidth(2);
      doc.line(margin, notesY + 5, pageWidth - margin, notesY + 5);
      
      const splitNotes = doc.splitTextToSize(pkg.notes, pageWidth - margin * 2 - 30);
      const notesBoxHeight = Math.max(50, 30 + (splitNotes.length * 12));
      const notesBoxY = notesY + 15;
      
      drawRoundedBox(margin, notesBoxY, pageWidth - margin * 2, notesBoxHeight, 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.text(splitNotes, margin + 15, notesBoxY + 20);
    }
    
    // Call to Action section
    const ctaY = pkg.notes ? 330 : 270;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...white);
    const ctaText = 'Ready to begin? Let us schedule your initial discovery call to discuss the Audit process.';
    const ctaLines = doc.splitTextToSize(ctaText, pageWidth - margin * 2);
    doc.text(ctaLines, pageWidth / 2, ctaY, { align: 'center' });
    
    // MAINERMEDIA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('MAINERMEDIA', pageWidth / 2, ctaY + 50, { align: 'center' });
    
    // Contact info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...teal);
    doc.text('Contact us at mainermedia.com', pageWidth / 2, ctaY + 75, { align: 'center' });
    
    // Book a Call with proper arrow character
    doc.text('Book a Call \u2192', pageWidth / 2, ctaY + 95, { align: 'center' });
    
    // Footer for page 2
    addFooter();

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