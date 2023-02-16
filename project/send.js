console.log('send.js has run')

const nodemailer = require('nodemailer')
const account = require('./account.js')

const smtpConfig = {                      
    // sendmail: true,
    host: account.smtp,
    port: 587,
    // secure: true,
    // tls: 'outlook.com', 
    secureConnection: false,
    tls: {
      ciphers: 'SSLv3'
  },
    auth: {
        user: account.user,
        pass: account.pass
    }
  };
  
  const transporter = nodemailer.createTransport(smtpConfig);
  

async function emailSender(to, cc, subject, text, messageId) {
  transporter.sendMail({ 
    from: account.user,
    to: to,
    cc: cc,
    subject: 'RE: ' + subject,
    text: text,
    inReplyTo: messageId,
  })
}

module.exports = emailSender