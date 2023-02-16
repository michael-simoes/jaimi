console.log('app.js has run');
const whereami = 'app.js'

const { readNewestEmail, readLastSent, readInboxEmail, imapInit, readSentEmail, imapEnd } = require('./readMail.js');
const account = require('./account.js');
const prompts = require('./prompts.js');                        ///we shouldn't need this 
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const emailSender = require('./send.js')


//WE CAN KEEP A CONNECTION OPEN WITHOUT CALLING 'END' to detect when new mail arrives
//Not sure how efficient it is but it would work!

async function main() {
    const fakeDb = {}
    let imap = await imapInit() 
    const emailElements = await readLastSent(imap, account.mailbox)  
    await imapEnd(imap)
    const sentEmailBody = await parseBody(emailElements.body) 
    const parsedHeader = await parseHeader(emailElements.header)
    fakeDb.to = parsedHeader[0]; 
    fakeDb.cc = parsedHeader[1]; 
    fakeDb.subject = parsedHeader[2]; 
    fakeDb.sentBody = sentEmailBody;
    fakeDb.messageId = parsedHeader[3]

    imap = await imapInit()    
    let repliedToElements = await readInboxEmail(imap, account.mailbox, parsedHeader[4])
    await imapEnd(imap)

    const repliedToBody = await parseBody(repliedToElements.body)

    fakeDb.repliedToBody = repliedToBody;

    prompts.respondingTo = fakeDb.repliedToBody
    prompts.firstSent += fakeDb.sentBody

    const prompt = await chase(prompts.firstSent, prompts.respondingTo)
    const emailResponse = await completion(prompt)

    emailSender('central.michael88@gmail.com', fakeDb.cc, fakeDb.subject, emailResponse, fakeDb.messageId)


    // if (!repliedToElements) {
    //     imap = await imapInit()                                     
    //     repliedToEmail = await readSentEmail(imap, account.mailbox, parsedHeader[4])
    //     await imapEnd(imap)
    //     console.log(repliedToEmail)
    // }

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