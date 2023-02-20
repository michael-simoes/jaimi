console.log('app.js has run');
const whereami = 'app.js'

const { readLastSent, readEmail, imapInit, imapEnd} = require('./readMail.js');
const account = require('./account.js');
const prompts = require('./prompts.js');                        ///we shouldn't need this 
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const emailSender = require('./send.js')

async function main() {
    const fakeDb = {}
   
    const emailElements = await connection(readLastSent, true)
    const sentEmailBody = await parseBody(emailElements.body) 
    const parsedHeader = await parseHeader(emailElements.header)
    fakeDb.to = parsedHeader[0]; 
    fakeDb.cc = parsedHeader[1]; 
    fakeDb.subject = parsedHeader[2]; 
    fakeDb.sentBody = sentEmailBody;
    fakeDb.messageId = parsedHeader[3]
    
    //If there's no email that we're replying to, initiate the follow-up just using the first email
    if (!parsedHeader[4]) {
        console.log('No reply-to address')
        return                          ///Go to generate --> send
    }
    let repliedToElements = await connection(readEmail, false, 'SENT', parsedHeader[4])
    if (!repliedToElements) {
        repliedToElements = await connection(readEmail, false, 'INBOX', parsedHeader[4])
    }
    const repliedToBody = await parseBody(repliedToElements.body)
    const repliedtoHeader = await parseHeader(repliedToElements.header)
    console.log(repliedtoHeader, repliedToBody)

    fakeDb.repliedToBody = repliedToBody

    prompts.respondingTo = fakeDb.repliedToBody
    prompts.firstSent += fakeDb.sentBody

return
    const prompt = await chase(prompts.firstSent, prompts.respondingTo)
    const emailResponse = await completion(prompt)

}

main()

async function connection(func, lastSent, folder, messageId) {
    const imap = await imapInit()
    if (lastSent) {
        const result = await func(imap, account.mailbox)
        await imapEnd(imap)
        return result
    }
    const result = await func(imap, account.mailbox, folder, messageId)
    await imapEnd(imap)
    return result
}