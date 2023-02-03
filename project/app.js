console.log('app.js has run')

const { type } = require('os');
const { exit } = require('process');
const inspect = require('util').inspect;
const mailParser = require('mailparser').MailParser        
const simpleParser = require('mailparser').simpleParser 
const { callbackPromise } = require('nodemailer/lib/shared/index.js');
const { once } = require('events');
const readNewestEmail = require('./readMail.js')

readNewestEmail('outlook')
