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
  
  transporter.sendMail({                           ///THIS NEEDS 'REPLY-TO'! 
    from: account.user,
    to: 'central.michael88@gmail.com',
    subject: 'RE: Hey',
    text: 'jaimi\'s ancestor NAD ITS GETTING LONGER.',
    inReplyTo: 'PH7PR06MB8995EB00C23761A716742C01EAD89@PH7PR06MB8995.namprd06.prod.outlook.com',
  })