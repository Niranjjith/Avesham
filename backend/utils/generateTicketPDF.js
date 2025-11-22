import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure tickets directory exists
const ticketsDir = path.join(__dirname, '../tickets');
if (!fs.existsSync(ticketsDir)) {
  fs.mkdirSync(ticketsDir, { recursive: true });
}

/**
 * Generate a PDF ticket with QR code and serial number
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Buffer>} PDF buffer
 */
export default async function generateTicketPDF(bookingData) {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        serialNumber,
        fullName,
        email,
        phone,
        ticketType,
        quantity,
        totalAmount,
        paymentId,
        timestamp
      } = bookingData;

      // Generate QR code data (contains serial number and payment ID for verification)
      const qrData = JSON.stringify({
        serialNumber,
        paymentId,
        ticketType,
        quantity
      });

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 200,
        margin: 1
      });

      // Convert data URL to buffer
      const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'portrait'
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#0e2b64')
        .text('AVESHAM SEASON 2', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('#2d72f0')
        .text('OFFICIAL TICKET', { align: 'center' })
        .moveDown(1);

      // Divider line
      doc
        .strokeColor('#2d72f0')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1);

      // Ticket Information Section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0e2b64')
        .text('TICKET INFORMATION', { align: 'left' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`Serial Number: ${serialNumber}`, { indent: 20 })
        .text(`Ticket Type: ${ticketType}`, { indent: 20 })
        .text(`Quantity: ${quantity}`, { indent: 20 })
        .text(`Total Amount: ₹${totalAmount}`, { indent: 20 })
        .moveDown(1);

      // Customer Information Section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0e2b64')
        .text('CUSTOMER INFORMATION', { align: 'left' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`Name: ${fullName}`, { indent: 20 })
        .text(`Email: ${email}`, { indent: 20 })
        .text(`Phone: ${phone}`, { indent: 20 })
        .moveDown(1);

      // Payment Information
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0e2b64')
        .text('PAYMENT INFORMATION', { align: 'left' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`Payment ID: ${paymentId}`, { indent: 20 })
        .text(`Booking Date: ${new Date(timestamp).toLocaleString('en-IN')}`, { indent: 20 })
        .moveDown(1.5);

      // QR Code Section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0e2b64')
        .text('VERIFICATION QR CODE', { align: 'center' })
        .moveDown(0.5);

      // Add QR code image
      doc.image(qrCodeBuffer, {
        fit: [200, 200],
        align: 'center',
        valign: 'center'
      });

      doc.moveDown(1);

      // Footer
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Please present this ticket at the venue for entry.', { align: 'center' })
        .text('Keep this ticket safe and do not share it with others.', { align: 'center' })
        .moveDown(0.5)
        .text('© 2025 Avesham Season 2. All rights reserved.', { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


