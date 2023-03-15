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
  transporter.sendMail({                                           //////// this doesn't throw an error, just returns nothing
    from: process.env.USER,
    to: to,
    cc: cc,
    subject: subject,
    text: text,
    inReplyTo: messageId,
  })
  return `\nEmail sent to ${to}. Preview: "${text.slice(0, 30)}..."\n`
}

module.exports = { emailSender }