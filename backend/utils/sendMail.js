import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendTicketMail = async (email, fullName, serialNumber, ticketType, quantity, paymentId) => {
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

    <p>Please show this serial number along with valid ID proof at the entry gate.</p>

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
