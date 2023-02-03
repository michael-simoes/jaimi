console.log('send.js has run')

const nodemailer = require('nodemailer')
const account = require('./account.js')



const smtpConfig = {
    // sendmail: true,
    host: 'smtp-mail.outlook.com',
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
  
  transporter.sendMail({
    from: 'michael_simoes@outlook.com',
    to: 'central.michael88@gmail.com',
    subject: 'hello',
    text: 'jaimi\'s ancestor wrote this.'
  })