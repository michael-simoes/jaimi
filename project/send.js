const nodemailer = require('nodemailer')

const smtpConfig = {                      
    host: process.env.SMTP_DOMAIN,
    port: 587,
    secureConnection: false,
    tls: {
      ciphers: 'SSLv3'
  },
    auth: {
        user: process.env.JAIMI_USER,
        pass: process.env.JAIMI_PASS
    }
  };
  
  const transporter = nodemailer.createTransport(smtpConfig);
  
async function emailSender(to, cc, subject, text, messageId) {
  // return                              
  transporter.sendMail({                                         
    from: process.env.JAIMI_USER,
    to: to,
    cc: cc,       // support for 1 cc'd person + yourself so you see the emails coming in
    subject: subject,
    text: text,
    inReplyTo: messageId,
  })
  return `\nEmail sent to ${to}.\n`
}

module.exports = { emailSender }