import nodemailer from 'nodemailer';
import axios from 'axios'; // Make sure axios is imported here

const validateEmailWithAPI = async (email) => {
  const apiKey = process.env.ZEROBOUNCE_API_KEY;
  if (!apiKey) {
    throw new Error('ZeroBounce API key is missing!');
  }

  try {
    const response = await axios.get(`https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${email}`);
    
    // Log the full response for debugging purposes
    console.log('ZeroBounce API Response:', response.data);

    if (response.data && response.data.status) {
      const { status, sub_status } = response.data;
      if (status === 'invalid') {
        if (sub_status === 'mailbox_not_found') {
          return { isValid: false, message: 'The email address does not exist.' };
        }
        return { isValid: false, message: 'Invalid email address.' };
      }
      return { isValid: status === 'valid', message: 'Valid email address.' };
    } else {
      throw new Error('Invalid response from ZeroBounce API');
    }
  } catch (error) {
    console.error('Error while validating email with ZeroBounce API:', error);
    throw new Error('Failed to validate email address with ZeroBounce');
  }
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
      const { isValid, message: apiMessage } = await validateEmailWithAPI(email);
      if (!isValid) {
        return res.status(400).json({ message: apiMessage });
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
        from: `"${name}" <${process.env.EMAIL_USER}>`,
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
