import nodemailer from 'nodemailer';
import axios from 'axios';

// --- NEW REOON VALIDATION FUNCTION ---
const validateEmailWithReoon = async (email) => {
  // This pulls the key you just saved in your .env file
  const apiKey = process.env.REOON_API_KEY;
  
  console.log(`Validating email with Reoon API: ${email}`);
  
  try {
    // Construct the Reoon URL with 'mode=quick' for fast portfolio responses
    const url = `https://emailverifier.reoon.com/api/v1/verify?key=${apiKey}&email=${email}&mode=quick`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log('Reoon API Response:', data);

    // 1. Check Trusted Domains (Optimistic check)
    // If it's a government or university email, we often trust it immediately.
    const trustedDomains = ['edu', 'org', 'gov', 'ac', 'int', 'mil']; 
    const emailDomain = email.split('@')[1];
    const domainExtension = emailDomain.split('.').pop(); 

    if (trustedDomains.includes(domainExtension)) {
      return true;
    }

    // 2. Check Reoon Status
    const status = data.status;

    // 'valid' means the email definitely exists.
    // 'safe' is sometimes used by Reoon for catch-all domains that look safe.
    if (status === 'valid' || status === 'safe') {
      return true; 
    }

    // 3. Block Bad Statuses
    if (status === 'invalid' || status === 'disposable' || status === 'spamtrap') {
      return false; 
    }

    // 4. Default Allow
    // If status is 'unknown' or 'catch_all', we allow it so we don't block real users.
    return true; 

  } catch (error) {
    console.error('Error while validating email with Reoon API:', error);
    // FAIL OPEN: If the API fails or you run out of credits, allow the email.
    return true; 
  }
};


// --- CUSTOM REGEX VALIDATION (Kept exactly as you had it) ---
const validateEmail = (email) => {
  console.log(`Validating email with custom rules: ${email}`);
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

// --- MAIN HANDLER ---
export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { name, email, message } = req.body;

      console.log(`Received form data: name=${name}, email=${email}, message=${message}`);

      // Check if all fields are provided
      if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // 1. Run Reoon Validation
      const isValidEmail = await validateEmailWithReoon(email);
      if (!isValidEmail) {
        return res.status(400).json({ message: 'Invalid or disposable email address detected.' });
      }

      // 2. Run Custom Regex Validation
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
        replyTo: email,
        subject: `Message from ${name}`,
        text: `You have received a message from ${name} (${email}):\n\n${message}`,
      };

      console.log('Sending email with options:', mailOptions);

      // Send the email
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
      return res.status(200).json({ message: 'Message sent successfully!' });

    } catch (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ message: 'Error sending message.', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
};



// Old Zero Bounce API

// import nodemailer from 'nodemailer';
// import axios from 'axios';

// // Email validation function using ZeroBounce API
// const validateEmailWithAPI = async (email) => {
//   const apiKey = process.env.ZEROBOUNCE_API_KEY;
//   console.log(`Validating email with ZeroBounce API: ${email}`);
  
//   try {
//     const response = await axios.get(`https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${email}`);
//     console.log('ZeroBounce API Response:', response.data);

//     // Allow emails from trusted domains like .edu, .org, etc.
//     const trustedDomains = ['edu', 'org', 'gov', 'ac', 'int', 'mil']; // Add more trusted domains here

//     const emailDomain = email.split('@')[1];
//     const domainExtension = emailDomain.split('.').pop();  // Get the domain extension like .edu, .org, etc.
    
//     // If the domain is trusted, consider the email valid even if mailbox is not found
//     if (trustedDomains.includes(domainExtension) || response.data.status === 'valid') {
//       return true; // Mark as valid
//     }

//     // Mark as invalid if not valid and not a trusted domain
//     if (response.data.status === 'invalid') {
//       return false; // Invalid email
//     }

//     return true; // Valid email in all other cases
//   } catch (error) {
//     console.error('Error while validating email with ZeroBounce API:', error);
//     return false; // Default to invalid on error
//   }
// };


// // Custom email validation function
// const validateEmail = (email) => {
//   console.log(`Validating email with custom rules: ${email}`);
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) return 'Invalid email format.';

//   const blockedDomains = ['example.com', 'test.com', 'placeholder.com'];
//   const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com'];
//   const invalidPatterns = [
//     /^([a-z])\1+@/,             // Repeated characters
//     /test/i,                    // Contains "test"
//     /example/i,                 // Contains "example"
//     /abc/i,                     // Contains "abc"
//     /^[0-9]+@[a-z]+\.[a-z]+$/,  // All numeric local part
//   ];

//   const domain = email.split('@')[1];
//   if (blockedDomains.includes(domain.toLowerCase())) return 'Invalid domain.';
//   if (disposableDomains.includes(domain.toLowerCase())) return 'Disposable email addresses are not allowed.';
//   if (invalidPatterns.some((pattern) => pattern.test(email))) return 'Email address appears fake.';

//   return null; // Valid email
// };

// export default async (req, res) => {
//   if (req.method === 'POST') {
//     try {
//       const { name, email, message } = req.body;

//       console.log(`Received form data: name=${name}, email=${email}, message=${message}`);

//       // Check if all fields are provided
//       if (!name || !email || !message) {
//         return res.status(400).json({ message: 'All fields are required.' });
//       }

//       // Validate email using the ZeroBounce API
//       const isValidEmail = await validateEmailWithAPI(email);
//       if (!isValidEmail) {
//         return res.status(400).json({ message: 'Invalid or disposable email address detected.' });
//       }

//       // Validate email using custom rules
//       const emailError = validateEmail(email);
//       if (emailError) {
//         return res.status(400).json({ message: emailError });
//       }

//       // Set up nodemailer transport
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       // Email options
//       const mailOptions = {
//         from: `"${name}" <kaunghtetkyaw2001@gmail.com>`,
//         to: 'kaunghtetkyaw2001@gmail.com',
//         replyTo: email, // Sender's email
//         subject: `Message from ${name}`,
//         text: `You have received a message from ${name} (${email}):\n\n${message}`,
//       };

//       console.log('Sending email with options:', mailOptions);

//       // Send the email
//       await transporter.sendMail(mailOptions);
//       console.log('Email sent successfully!');
//       return res.status(200).json({ message: 'Message sent successfully!' });
//     } catch (error) {
//       console.error('Email sending failed:', error);
//       return res.status(500).json({ message: 'Error sending message.', error: error.message });
//     }
//   } else {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }
// };

