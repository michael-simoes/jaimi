console.log('send.js has run')

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
  console.log(to, subject, text)
  // return
                                 
  transporter.sendMail({ 
    from: process.env.USER,
    to: to,
    cc: cc,
    subject: subject,
    text: text,
    inReplyTo: messageId,
  })
}

module.exports = { emailSender }