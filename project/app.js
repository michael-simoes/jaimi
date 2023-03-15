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
const cliProgress = require('cli-progress');
const { firstSent } = require('./prompts.js');

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
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
            console.log('Calling Jaimi...')
            bar1.start(100, 2)
            const { target, preview } = await main()
            if (!target) {
                console.log('An error has occured. Please try again.')
                eventEmitter.emit('input');
                return
            }
            console.log(`\nChasing ${target}. Initial email: "${preview}..."\n`)
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
    bar1.update(28)   
    const emailElements = await connection(readLastSent, true)
    bar1.update(88)      
    if (emailElements.error) {        
        console.log('Please try again.', emailElements.error)                            // Check for FALSE connection each time
        return { target: false, preview: false }
    }
    const firstSent = await parseBody(emailElements.body) 
    promptComponents.firstSent += firstSent
    const sentEmailHeader = await parseHeader(emailElements.header)
    
    // TO DO!
    // If there's no email that we're replying to, initiate the follow-up just using the first email
    if (!sentEmailHeader[4]) {
        // console.log('No reply-to address')
        return                          /// Go to generate --> send
    }

    let repliedToElements = await connection(readEmail, false, 'INBOX', sentEmailHeader[4])
    if (!repliedToElements) {
        repliedToElements = await connection(readEmail, false, 'SENT', sentEmailHeader[4])
        if (repliedToElements.error) {
            console.log('Please try again.', repliedToElements.error)
            return { target: false, preview: false }
        }
    }
    bar1.update(100)   
    promptComponents.respondingTo = await parseBody(repliedToElements.body)
    
    await countdown(sentEmailHeader, promptComponents)
    return { target: sentEmailHeader[0], preview: firstSent }
}

async function countdown(emailHeaders, promptComponents) {
    let { timerLength, sendAt } = await timer()
    let imap = await imapInit()                            
    let to = emailHeaders[0], cc = emailHeaders[1], subject = emailHeaders[2], messageId = emailHeaders[3];
    let firstSent = promptComponents.firstSent, respondingTo = promptComponents.respondingTo;
    const timeoutId = setTimeout(async () => {
        if (timerLength <= 1000) {
            new Error('\nThe email timer length is less than 1 second. Something has gone wrong.\n')
        }
        console.log('\nTIMER IS UP!\n')
        const prompt = await chase(firstSent, respondingTo)
        const aiFollowUp = await completion(prompt)
        const consolePreview = await emailSender(to, cc, subject, aiFollowUp, messageId)
        console.log(consolePreview)
        await imapEnd(imap)      
        countdown(emailHeaders, promptComponents)      /// Runs recursively until response (cancellation)
        eventEmitter.emit('input')
    }, timerLength)
    
    // Save timeoutId so this timeout can be cancelled if mail is received for it
    monitor(imap, mailbox, 'INBOX', to, timeoutId)
    chaseSequences[emailHeaders[0]] = timeoutId
    chaseSequences[emailHeaders[0]].nextEmail = sendAt
}

async function monitor(imap, emailClient, folder, targetEmail, timeoutId) {       
    const error = await new Promise(resolve => { 
        imap.on('error', async (err) => {
            console.log(`\nMonitoring failed for ${targetEmail}. Chase has been terminated.\n${err}\n`)
            clearTimeout(timeoutId)
            delete chaseSequences[targetEmail]
            eventEmitter.emit('input')
            await imapEnd(imap)
            return resolve(true)
        })
    })
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
    if (latest) {
        const result = await func(imap, mailbox)
        await imapEnd(imap)
        return result
    }
    const result = await func(imap, mailbox, folder, messageId)
    await imapEnd(imap)
    return result
}
