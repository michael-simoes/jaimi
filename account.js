//Credentials for SMTP sending and IMAP reading

const outlook = 'outlook'
const outlookUser = 'USERNAME'
const outlookPass = 'PASSWORD'
const outlookHost = 'imap.outlook.com'

const gmail = 'gmail'
const gmailUser = 'USERNAME'
const gmailPass = 'PASSWORD'
const gmailHost = 'imap.gmail.com'

module.exports = {
    mailbox: gmail,
    user: gmailUser,
    pass: gmailPass,
    host: gmailHost,
}

// module.exports = {
//     mailbox: outlook,
//     user: outlookUser,
//     pass: outlookPass,
//     host: outlookHost,
// }
