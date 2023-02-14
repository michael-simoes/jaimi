console.log('app.js has run');
const whereami = 'app.js'

const { readNewestEmail, readLastSent, readSpecifiedEmail, imapSequence } = require('./readMail.js');
const account = require('./account.js');
const prompts = require('./prompts.js');
const { parseBody, parseHeader } = require('./editEmail.js');



//reaad in the last sent email. 
//Detect if there's a reply-to
async function main() {
    let imap = await imapSequence() ///connection sequence
    const emailElements = await readLastSent(imap, account.mailbox)     ///FORWARDED EMAILS NOT GETTING CLEANED
    const sentEmailBody = await parseBody(emailElements.body)
    const parsedHeader = await parseHeader(emailElements.header)
    console.log(whereami, sentEmailBody)
    // if (parsedHeader[4] != '') {
    //     console.log('null')
    // }
    // console.log(parsedHeader[4])
    // await imapSequence()
    imap = await imapSequence()                                     ///RECONNECT! 
    const repliedToEmail = await readSpecifiedEmail(imap, account.mailbox, '1234')

    console.log(whereami, repliedToEmail.body, repliedToEmail.header)
    console.log(whereami, parsedHeader)
    console.log(whereami, repliedToEmail)
}

main()


// console.log(readLastSent(account.mailbox))

//Load last sent email's info into generate.js
//Read last sent email's header info
//-> Identify in-reply-to (if present)
//-> Load last sent email into generate.js
//-> Load reply-to email into generate.js
//-> Load messageId
//-> .............................Maybe load all this into some object 


////Load it into prompts.js



//Take generated reply from OpenAi
//Send over SMTP