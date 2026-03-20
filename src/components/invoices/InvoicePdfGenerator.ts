import { jsPDF } from 'jspdf';
import { Shipper, Load, Invoice } from '@/types';
import { equipmentTypeLabels } from '@/data/mockData';

interface InvoicePdfData {
  invoice: Invoice;
  shipper: Shipper;
  loads: Load[];
  podImages: string[]; // base64 data URLs
}

export function generateInvoicePdf({ invoice, shipper, loads, podImages }: InvoicePdfData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // --- PAGE 1: INVOICE ---

  // Company header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMAR LOGISTICS', margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Professional Freight Brokerage Services', margin, y);
  y += 12;

  // Invoice title + number
  doc.setTextColor(0);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', margin, y);

  // Invoice details on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const rightCol = pageW - margin;
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, rightCol, y - 14, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, rightCol, y - 7, { align: 'right' });
  doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, rightCol, y, { align: 'right' });
  y += 10;

  // Divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Bill To
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100);
  doc.text('BILL TO:', margin, y);
  y += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(shipper.companyName, margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (shipper.address) {
    doc.text(shipper.address, margin, y);
    y += 5;
  }
  doc.text(`${shipper.city}, ${shipper.state} ${shipper.zip}`, margin, y);
  y += 5;
  if (shipper.phone) {
    doc.text(shipper.phone, margin, y);
    y += 5;
  }
  if (shipper.email) {
    doc.text(shipper.email, margin, y);
    y += 5;
  }
  y += 8;

  // Load details table header
  const colX = {
    load: margin,
    route: margin + 28,
    date: margin + 90,
    equipment: margin + 120,
    rate: pageW - margin,
  };

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 4, contentW, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80);
  doc.text('Load #', colX.load, y);
  doc.text('Route', colX.route, y);
  doc.text('Date', colX.date, y);
  doc.text('Equipment', colX.equipment, y);
  doc.text('Rate', colX.rate, y, { align: 'right' });
  y += 8;

  // Load rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(10);
  for (const load of loads) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    doc.text(load.loadNumber, colX.load, y);
    const route = `${load.origin} → ${load.destination}`;
    doc.text(route.length > 35 ? route.substring(0, 32) + '...' : route, colX.route, y);
    doc.text(new Date(load.pickupDate).toLocaleDateString(), colX.date, y);
    doc.text(equipmentTypeLabels[load.equipmentType] || load.equipmentType, colX.equipment, y);
    doc.text(`$${load.shipperRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, colX.rate, y, { align: 'right' });
    y += 7;
  }

  // Divider above total
  y += 3;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Total
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE:', margin, y);
  doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, colX.rate, y, { align: 'right' });
  y += 12;

  // Payment terms
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  if (shipper.paymentTerms) {
    doc.text(`Payment Terms: ${shipper.paymentTerms}`, margin, y);
    y += 6;
  }
  doc.text('Remit To: DeMar Logistics', margin, y);
  y += 6;

  if (invoice.notes) {
    y += 4;
    doc.setFontSize(9);
    doc.text(`Notes: ${invoice.notes}`, margin, y, { maxWidth: contentW });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Thank you for your business!', pageW / 2, footerY, { align: 'center' });

  // --- PAGE 2+: POD IMAGES ---
  for (const imgData of podImages) {
    doc.addPage();
    const pY = 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Proof of Delivery', margin, pY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Invoice ${invoice.invoiceNumber}`, margin, pY + 6);

    try {
      // Fit image to page with margins
      const imgW = contentW;
      const imgH = doc.internal.pageSize.getHeight() - 50;
      doc.addImage(imgData, 'JPEG', margin, pY + 12, imgW, imgH, undefined, 'FAST');
    } catch {
      doc.setFontSize(10);
      doc.setTextColor(200, 0, 0);
      doc.text('Failed to embed POD image', margin, pY + 20);
    }
  }

  return doc;
}
