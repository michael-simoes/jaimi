console.log('app.js has run');
const whereami = 'app.js'

const { readLastSent, readEmail, imapInit, imapEnd, openFolder, readLastReceived } = require('./readMail.js');
const account = require('./account.js');
const promptComponents = require('./prompts.js');                        ///we shouldn't need this 
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const { emailSender }= require('./send.js')

async function main() {   
    const emailElements = await connection(readLastSent, true)
    promptComponents.firstSent += await parseBody(emailElements.body) 
    const sentEmailHeader = await parseHeader(emailElements.header)
    // console.log(sentEmailHeader)
    
    //If there's no email that we're replying to, initiate the follow-up just using the first email
    if (!sentEmailHeader[4]) {
        console.log('No reply-to address')
        return                          ///Go to generate --> send
    }
    let repliedToElements = await connection(readEmail, false, 'SENT', sentEmailHeader[5])
    if (!repliedToElements) {
        repliedToElements = await connection(readEmail, false, 'INBOX', sentEmailHeader[5])
    }
    promptComponents.respondingTo = await parseBody(repliedToElements.body)
    console.log(repliedToElements.header)
    const repliedtoHeader = await parseHeader(repliedToElements.header)


    for (let i = 0; i < 2; i++) {
        const list = ['a', 'b', 'c']
        let k = list[i]
        promptComponents[k] = 'hello' }
    // TO DO:
    // After sending email, create cancellable timeout event set for like 2 minutes of no reply from that email.
    // Cancel timeout with ID: EMAIL based on if imap.('mail') has detected an email from original replyTo
    let followUps = {}
    let imap = await imapInit()
    followUps[sentEmailHeader[0]] = await countdown(
        sentEmailHeader[0], sentEmailHeader[1], sentEmailHeader[2], sentEmailHeader[4], 
        promptComponents.firstSent, promptComponents.respondingTo);
    monitor(imap, account.mailbox, 'INBOX', followUps, sentEmailHeader[0])

}

async function countdown(to, cc, subject, messageId, firstSent, respondingTo) {
    console.log('countdown called')
    const timeoutId = setTimeout(async () => {
        const prompt = await chase(firstSent, respondingTo)
        const aiFollowUp = await completion(prompt)
        await emailSender(to, cc, subject, aiFollowUp, messageId)
        countdown(to, cc, subject, messageId)                         /// re runs until response
    }, 6000)
    
    // Save timeoutId so this timeout can be cancelled if mail is received for it
    return timeoutId    
}

async function monitor(imap, emailClient, folder, followUps, targetEmail) {          /// this becomes second main function. wrap everything in it 
    imap.on('ready', () => {
    openFolder(folder, imap, emailClient, (error, box) => {
    let result = ''
    let header = ''
        imap.on('mail', async (num) => {
        result = await connection(readLastReceived, true)
        header = await parseHeader(result.header)
        if (header[0] == targetEmail) {
            clearTimeout(followUps[targetEmail])
            console.log('countdown aborted')
        }
        console.log(header[0])
        console.log('MAIL RECEIVED!')
        })
    })
})
}

async function connection(func, latest, folder, messageId) {
    const imap = await imapInit()
    if (latest) {
        const result = await func(imap, account.mailbox)
        await imapEnd(imap)
        return result
    }
    const result = await func(imap, account.mailbox, folder, messageId)
    await imapEnd(imap)
    return result
}

main()