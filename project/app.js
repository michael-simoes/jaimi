console.log('app.js has run');
const whereami = 'app.js'

const { readNewestEmail, readLastSent, readInboxEmail, imapInit, readSentEmail, imapEnd } = require('./readMail.js');
const account = require('./account.js');
const prompts = require('./prompts.js');
const { parseBody, parseHeader } = require('./editEmail.js');




//WE CAN KEEP A CONNECTION OPEN WITHOUT CALLING 'END' to detect when new mail arrives
//Not sure how efficient it is but it would work!


async function main() {
    let imap = await imapInit() ///connection sequence
    const emailElements = await readLastSent(imap, account.mailbox)     ///FORWARDED EMAILS w/out content NOT GETTING CLEANED
    const sentEmailBody = await parseBody(emailElements.body)
    const parsedHeader = await parseHeader(emailElements.header)
    await imapEnd(imap)
    
    console.log(parsedHeader[4])
    imap = await imapInit()    ///SOMETHING ABOUT CREATING A NEW IMAPSEQUENCE MEANS THE PROGRAM WILL NOT END...
    let repliedToEmail = await readInboxEmail(imap, account.mailbox)
    await imapEnd(imap)
    console.log(repliedToEmail)
    if (!repliedToEmail) {
        console.log('retry')
        imap = await imapInit()                                     ///RECONNECT! 
        repliedToEmail = await readSentEmail(imap, account.mailbox, parsedHeader[4])
        await imapEnd(imap)
        console.log(repliedToEmail)
    }

    console.log(whereami, repliedToEmail)
    // console.log(whereami, repliedToEmail.body, repliedToEmail.header)
    // console.log(whereami, parsedHeader)
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