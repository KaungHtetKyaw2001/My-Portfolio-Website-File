import nodemailer from 'nodemailer';

export default async (req, res) => {
  if (req.method === 'POST') {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // Use environment variable for Gmail
        pass: process.env.EMAIL_PASS,  // Use environment variable for App Password
      },
    });

    const mailOptions = {
      from: email,
      to: 'kaunghtetkyaw2001@gmail.com',  // Your email where you want to receive messages
      subject: `Message from ${name}`,
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
      console.error(error);  // Log error details
      res.status(500).json({ message: 'Error sending message.' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
