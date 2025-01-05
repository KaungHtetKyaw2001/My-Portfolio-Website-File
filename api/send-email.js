import nodemailer from 'nodemailer';

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { name, email, message } = req.body;

      // Validate input fields
      if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // Trim input values to remove extra spaces
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedMessage = message.trim();

      // Additional validation: Check if name is a default placeholder value
      if (trimmedName.toLowerCase() === 'your name') {
        return res.status(400).json({ message: 'Invalid name provided.' });
      }

      // Nodemailer configuration
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
  from: `"${trimmedName}" <${process.env.EMAIL_USER}>`, // Authenticated Gmail address
  replyTo: trimmedEmail, // User's email for replies
  to: 'kaunghtetkyaw2001@gmail.com',
  subject: `Message from ${trimmedName}`,
  text: trimmedMessage,
};


      // Send the email
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ message: 'Error sending message.', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
};
