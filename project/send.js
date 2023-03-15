const nodemailer = require('nodemailer')

const smtpConfig = {                      
    // sendmail: true,
    host: process.env.SMTP_DOMAIN,
    port: 587,
    // secure: true,
    // tls: 'outlook.com', 
    secureConnection: false,
    tls: {
      ciphers: 'SSLv3'
  },
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
  };
  
  const transporter = nodemailer.createTransport(smtpConfig);
  

async function emailSender(to, cc, subject, text, messageId) {
  // return                              
  transporter.sendMail({                                         
    from: process.env.USER,
    to: to,
    cc: [ process.env.USER, cc ], // support for 1 cc'd person + yourself so you see the emails coming in
    subject: subject,
    text: text,
    inReplyTo: messageId,
  })
  return `\nEmail sent to ${to}. Preview: "${text.slice(0, 30)}..."\n`
}

module.exports = { emailSender }