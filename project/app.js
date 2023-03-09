console.log('app.js has run');
// require('dotenv').config({ path: '../.env.gmail' })
require('dotenv').config({ path: '../.env.other' })
const { readLastSent, readEmail, imapInit, imapEnd, openFolder, readLastReceived } = require('./readMail.js');
const promptComponents = require('./prompts.js');                     
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const { emailSender } = require('./send.js')
const EventEmitter = require('events');

const chaseSequences = {}
const mailbox = process.env.MAILBOX
const eventEmitter = new EventEmitter();
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
console.log(`Options:
chase - start followup sequence
email - cancel followups for that email \n`)

eventEmitter.on('input', async () => {
    // console.log('CHASE SEQUENCES', chaseSequences, '\n')  
    readline.question('\n>> ', (input) => {
        if (input == 'chase') {
            main()
            console.log('chase init')
            eventEmitter.emit('input');
        }
        if (Object.keys(chaseSequences).includes(input)) {
            clearTimeout(chaseSequences[input])
            console.log('timer cleared')
            eventEmitter.emit('input')
        }
        if (input == 'emails') {
            console.log(Object.keys(chaseSequences), Object.values(chaseSequences))
            eventEmitter.emit('input')
        }
    })
    
})

eventEmitter.emit('input');

async function main() {   
    const emailElements = await connection(readLastSent, true)
    try {
        promptComponents.firstSent += await parseBody(emailElements.body) 
    } catch (e) {
        console.log('Error, body of email could not be parsed', e)
        return
    }
    const sentEmailHeader = await parseHeader(emailElements.header)
    
    // TO DO!
    // If there's no email that we're replying to, initiate the follow-up just using the first email
    if (!sentEmailHeader[4]) {
        console.log('No reply-to address')
        return                          /// Go to generate --> send
    }

    let repliedToElements = await connection(readEmail, false, 'INBOX', sentEmailHeader[4])
    if (!repliedToElements) {
        repliedToElements = await connection(readEmail, false, 'SENT', sentEmailHeader[4])
    }
    promptComponents.respondingTo = await parseBody(repliedToElements.body)

    await countdown(sentEmailHeader, promptComponents);
}

async function countdown(emailHeaders, promptComponents) {
    let imap = await imapInit()
    let to = emailHeaders[0], cc = emailHeaders[1], subject = emailHeaders[2], messageId = emailHeaders[3];
    let firstSent = promptComponents.firstSent, respondingTo = promptComponents.respondingTo;
    const timeoutId = setTimeout(async () => {
        const prompt = await chase(firstSent, respondingTo)
        const aiFollowUp = await completion(prompt)
        await emailSender(to, cc, subject, aiFollowUp, messageId)
        await imapEnd(imap)                           
        countdown(emailHeaders, promptComponents)      /// Runs recursively until response (cancellation)
    }, 40000)
    
    // Save timeoutId so this timeout can be cancelled if mail is received for it
    await monitor(imap, mailbox, 'INBOX', to, timeoutId)
    chaseSequences[emailHeaders[0]] = timeoutId
    chaseSequences[emailHeaders[0]].alpha = 1
}

async function monitor(imap, emailClient, folder, targetEmail, timeoutId) {   
    console.log('monitor init')    
    imap.on('ready', () => {
        openFolder(folder, imap, emailClient, (error, box) => {
        let result = ''
        let header = ''
            imap.on('mail', async (num) => {                  
                result = await connection(readLastReceived, true)
                header = await parseHeader(result.header)
                console.log(`${targetEmail} =?= ${header[5]}`)
                if (header[5] == targetEmail) {
                    console.log(timeoutId)
                    clearTimeout(timeoutId)
                    console.log('countdown aborted')
                    await imapEnd(imap)
                }
                console.log('MAIL RECEIVED!')
            })
        })
    })
}

async function connection(func, latest, folder, messageId) {
    const imap = await imapInit()
    if (latest) {
        const result = await func(imap, mailbox)
        await imapEnd(imap)
        return result
    }
    const result = await func(imap, mailbox, folder, messageId)
    await imapEnd(imap)
    return result
}
