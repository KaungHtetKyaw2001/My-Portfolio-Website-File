import nodemailer from 'nodemailer';
import axios from 'axios';

// Email validation function
const validateEmailWithAPI = async (email) => {
  const apiKey = process.env.ZEROBOUNCE_API_KEY;
  const response = await axios.get(`https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${email}`);
  return response.data.status === 'valid';
};

// Custom email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format.';

  const blockedDomains = ['example.com', 'test.com', 'placeholder.com'];
  const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com'];
  const invalidPatterns = [
    /^([a-z])\1+@/,             // Repeated characters
    /test/i,                    // Contains "test"
    /example/i,                 // Contains "example"
    /abc/i,                     // Contains "abc"
    /^[0-9]+@[a-z]+\.[a-z]+$/,  // All numeric local part
  ];

  const domain = email.split('@')[1];
  if (blockedDomains.includes(domain.toLowerCase())) return 'Invalid domain.';
  if (disposableDomains.includes(domain.toLowerCase())) return 'Disposable email addresses are not allowed.';
  if (invalidPatterns.some((pattern) => pattern.test(email))) return 'Email address appears fake.';

  return null; // Valid email
};

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { name, email, message } = req.body;

      // Check if all fields are provided
      if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // Validate email using the ZeroBounce API
      if (!(await validateEmailWithAPI(email))) {
        return res.status(400).json({ message: 'Invalid or disposable email address detected.' });
      }

      // Validate email using custom rules
      const emailError = validateEmail(email);
      if (emailError) {
        return res.status(400).json({ message: emailError });
      }

      // Set up nodemailer transport
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Email options
      const mailOptions = {
        from: `"${name}" <kaunghtetkyaw2001@gmail.com>`,
        to: 'kaunghtetkyaw2001@gmail.com',
        replyTo: email, // Sender's email
        subject: `Message from ${name}`,
        text: `You have received a message from ${name} (${email}):\n\n${message}`,
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
