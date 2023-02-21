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
    
    //If there's no email that we're replying to, initiate the follow-up just using the first email
    if (!sentEmailHeader[4]) {
        console.log('No reply-to address')
        return                          ///Go to generate --> send
    }

    let repliedToElements = await connection(readEmail, false, 'INBOX', sentEmailHeader[4])
    if (!repliedToElements) {
        repliedToElements = await connection(readEmail, false, 'SENT', sentEmailHeader[4])
    }
    promptComponents.respondingTo = await parseBody(repliedToElements.body)

    for (let i = 0; i < 2; i++) {
        const list = ['a', 'b', 'c']
        let k = list[i]
        promptComponents[k] = 'hello' }
    // TO DO:
    // After sending email, create cancellable timeout event set for like 2 minutes of no reply from that email.
    // Cancel timeout with ID: EMAIL based on if imap.('mail') has detected an email from original replyTo

    // Need to cancel the latest timer that is still LIVE. I'm cancelling the first one after it expired already
    await countdown(sentEmailHeader, promptComponents);

}

async function countdown(emailHeaders, promptComponents) {
    console.log('countdown init')
    let imap = await imapInit()
    let to = emailHeaders[0], cc = emailHeaders[1], subject = emailHeaders[2], messageId = emailHeaders[3];
    let firstSent = promptComponents.firstSent, respondingTo = promptComponents.respondingTo;
    const timeoutId = setTimeout(async () => {
        const prompt = await chase(firstSent, respondingTo)
        const aiFollowUp = await completion(prompt)
        await emailSender(to, cc, subject, aiFollowUp, messageId)
        await imapEnd(imap)                           /// can't terminate the connection here obviously
        countdown(emailHeaders, promptComponents)                         /// re runs until response
    }, 12000)
    
    // Save timeoutId so this timeout can be cancelled if mail is received for it
    // console.log(timeoutId)
    await monitor(imap, account.mailbox, 'INBOX', to, timeoutId)
}

async function monitor(imap, emailClient, folder, targetEmail, timeoutId) {   
    console.log('monitor init')       /// this becomes second main function. wrap everything in it 
    imap.on('ready', () => {
    openFolder(folder, imap, emailClient, (error, box) => {
    let result = ''
    let header = ''
        imap.on('mail', async (num) => {                            /// Don't want to restart a countdown everytime new mail comes in
        result = await connection(readLastReceived, true)
        header = await parseHeader(result.header)
        console.log(`${targetEmail} =?= ${header[5]}`)
        if (header[5] == targetEmail) {
            console.log(timeoutId)
            clearTimeout(timeoutId)
            console.log('countdown aborted')
            await imapEnd(imap)
        }
        // console.log(header[0])
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