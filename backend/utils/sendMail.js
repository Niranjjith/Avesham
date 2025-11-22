import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendTicketMail = async (email, fullName, serialNumber, ticketType, quantity, paymentId, downloadUrl) => {
  const htmlContent = `
    <h2>🎟 Avesham Season 2 Booking Confirmed</h2>
    <p>Hi <strong>${fullName}</strong>,</p>
    <p>Thank you for booking your tickets for <strong>Avesham Season - 2</strong>. 
    We are thrilled to welcome you to an electrifying football event!</p>

    <h3>Your Ticket Details</h3>
    <ul>
      <li><strong>Ticket Serial:</strong> ${serialNumber}</li>
      <li><strong>Ticket Type:</strong> ${ticketType}</li>
      <li><strong>Quantity:</strong> ${quantity}</li>
      <li><strong>Payment ID:</strong> ${paymentId}</li>
    </ul>

    <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-radius: 8px; border: 2px solid #2563eb;">
      <h3 style="margin-top: 0;">📥 Download Your Ticket</h3>
      <p>Click the link below to download your ticket PDF:</p>
      <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Download Ticket PDF</a>
    </div>

    <p>Please show this ticket (PDF or serial number) along with valid ID proof at the entry gate.</p>

    <h3>See You at Avesham Season 2!</h3>
    <p>Regards,<br><strong>Team Avesham</strong></p>
  `;

  await transporter.sendMail({
    from: `"Avesham Season 2" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Ticket Confirmation - Avesham Season 2 🎉",
    html: htmlContent
  });
};

export default sendTicketMail;
