// require('dotenv').config({ path: '../.env.gmail' })
require('dotenv').config({ path: '../.env.other' })
const { readLastSent, readEmail, imapInit, imapEnd, openFolder, readLastReceived } = require('./readMail.js');
const promptComponents = require('./prompts.js');                     
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const { emailSender } = require('./send.js')
const { timer } = require('./time.js')
const EventEmitter = require('events');
const { exit } = require('process');
const { firstSent } = require('./prompts.js');

const chaseSequences = {}
const mailbox = process.env.MAILBOX
const eventEmitter = new EventEmitter();
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

const instructions = `\nCommands:
\tchase: start followup sequence for most recently sent email
\tactive: view active sessions and date/time of next email
\t{email@example.com}: cancel followups for that email\n`

console.log(instructions)
eventEmitter.on('input', async () => {
    readline.question('\n>> ', async (input) => {
        if (input == 'chase') {
            console.log('Loading...')
            const content = []                      /// PUT THIS BACK TO { TARGET, PREVIEW }???
            try {
                content = await main()
            } catch(e) {
                eventEmitter.emit('input')
            }        /// GET RID OF THIS STUFF
            console.log(`\nChasing ${content[0]}. Initial email: "${content[1]}..."`)
            eventEmitter.emit('input');
        }
        else if (Object.keys(chaseSequences).includes(input)) {
            clearTimeout(chaseSequences[input])
            delete chaseSequences[input]
            console.log('\nChase sequence terminated.')
            eventEmitter.emit('input')
        }
        else if (input == 'active') {
            /// USE THIS
            console.log('\nActive chases:')
            for (const [key, value] of Object.entries(chaseSequences)) {
                console.log(`${key}: ${value.nextEmail}`);
              }
            eventEmitter.emit('input')
        }
        else if (input == 'help') {
            console.log(instructions)
            eventEmitter.emit('input')
        } else {             
            console.log("\nCommand not recognized. Type 'help' for recognized commands.")
            eventEmitter.emit('input')
          }
    })
})

eventEmitter.emit('input');

async function main() {   
    const emailElements = await connection(readLastSent, true)           // TRY CATCH ANY INSTANCE OF A CONNECTION
    let firstSent = ''
    try {
        firstSent = await parseBody(emailElements.body) 
    } catch (e) {
        console.log('Error, failed to parse email body. ', e)
        return
    }
    promptComponents.firstSent += firstSent
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

    await countdown(sentEmailHeader, promptComponents)
    return { target: sentEmailHeader[0], preview: firstSent }
}

async function countdown(emailHeaders, promptComponents) {
    let { timerLength, sendAt } = await timer()
    let imap = await imapInit()                             /// TRY CATCH THIS! ??
    let to = emailHeaders[0], cc = emailHeaders[1], subject = emailHeaders[2], messageId = emailHeaders[3];
    let firstSent = promptComponents.firstSent, respondingTo = promptComponents.respondingTo;
    const timeoutId = setTimeout(async () => {
        if (timerLength <= 1000) {
            new Error('\nThe email timer length is less than 1 second. Something has gone worng.\n')
        }
        const prompt = await chase(firstSent, respondingTo)
        const aiFollowUp = await completion(prompt)
        const consolePreview = await emailSender(to, cc, subject, aiFollowUp, messageId)
        await imapEnd(imap)                           
        countdown(emailHeaders, promptComponents)      /// Runs recursively until response (cancellation)
        console.log(consolePreview)
        eventEmitter.emit('input')
    }, timerLength)
    
    // Save timeoutId so this timeout can be cancelled if mail is received for it
    await monitor(imap, mailbox, 'INBOX', to, timeoutId)

    chaseSequences[emailHeaders[0]] = timeoutId
    chaseSequences[emailHeaders[0]].nextEmail = sendAt
}

async function monitor(imap, emailClient, folder, targetEmail, timeoutId) {       
    imap.on('ready', () => {
        openFolder(folder, imap, emailClient, (error, box) => {
        let result = ''
        let header = ''
            imap.on('mail', async (num) => {                  
                result = await connection(readLastReceived, true)
                header = await parseHeader(result.header)
                if (header[5] == targetEmail) {
                    clearTimeout(timeoutId)
                    console.log(`\nChase terminated for: ${targetEmail}\n`)
                    delete chaseSequences[targetEmail]
                    await imapEnd(imap)
                    eventEmitter.emit('input')
                }
            })
        })
    })
}


async function connection(func, latest, folder, messageId) {
    const imap = await imapInit()
    if (!imap) {
        console.log('IMAP connection has failed. Please try again.')
        return false
    }
    if (latest) {
        const result = await func(imap, mailbox)
        await imapEnd(imap)
        return result
    }
    const result = await func(imap, mailbox, folder, messageId)
    await imapEnd(imap)
    return result
}
