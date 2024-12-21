// api/send-email.js
import nodemailer from 'nodemailer';

export default async (req, res) => {
  if (req.method === 'POST') {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can use any email service here
      auth: {
        user: 'kaunghtetkyaw2001@gmail.com',
        pass: 'Sumokhk#2001',
      },
    });

    const mailOptions = {
      from: email,
      to: 'kaunghtetkyaw2001@gmail.com', // Your email where you want to receive the messages
      subject: `Message from ${name}`,
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Error sending message.' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

