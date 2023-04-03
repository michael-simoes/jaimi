// Select a .env file based on your chosen email and credentials
// require('dotenv').config({ path: '../.env.gmail' })
require('dotenv').config({ path: '../.env.other' })
const { readLastSent, readEmail, imapInit, imapEnd, openFolder, readLastReceived } = require('./readMail.js');
const promptComponents = require('./prompts.js');                     
const { parseBody, parseHeader } = require('./editEmail.js');
const { generatePrompt, completion } = require('./generate.js')
const { emailSender } = require('./send.js')
const { timer } = require('./time.js')
const EventEmitter = require('events');
const { exit } = require('process');
const cliProgress = require('cli-progress');
const { firstSent } = require('./prompts.js');

const bar1 = new cliProgress.SingleBar({clearOnComplete: true}, cliProgress.Presets.shades_classic);
const chaseSequences = {}
const mailbox = process.env.MAILBOX
const eventEmitter = new EventEmitter();
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

const instructions = `\nCommands:
\tchase: start follow up sequence for most recently sent email
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
            console.log(`\nInitial email: "${preview.slice(0, 20)}..."\n`)
            eventEmitter.emit('input');
        }
        else if (Object.keys(chaseSequences).includes(input)) {
            clearTimeout(chaseSequences[input])
            delete chaseSequences[input]
            console.log('\nChase sequence terminated.')
            eventEmitter.emit('input')
        }
        else if (input == 'active') {
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
        console.log('\n', emailElements.error)    
        return { target: false, preview: false }
    }
    const firstSent = await parseBody(emailElements.body)
    if (!firstSent) {
        console.log('\nEmail could not be read, it contains an attachment, image or is super duper long. Review parsedBody function.\n')
        return { target: false, preview: false }
    }
    promptComponents.firstSent += firstSent
    const sentEmailHeader = await parseHeader(emailElements.header)
    
    // Check if there is a valid In-Reply-To message ID
    if (!sentEmailHeader[4]) {
        bar1.update(99)
        bar1.stop()
        await countdown(sentEmailHeader, promptComponents)
        return { target: sentEmailHeader[0], preview: firstSent }
    }
    let repliedToElements = await connection(readEmail, false, 'INBOX', sentEmailHeader[4])
    if (repliedToElements.error) {
        repliedToElements = await connection(readEmail, false, 'SENT', sentEmailHeader[4])
        if (repliedToElements.error) {
            console.log(`\n${repliedToElements.error}`)
            return { target: false, preview: false }
        }
    }
    promptComponents.respondingTo = await parseBody(repliedToElements.body)
    if (!promptComponents.respondingTo) {
        console.log('\nEmail could not be read, it contains an attachment, image or is super duper long. Review parsedBody function.\n')
        return { target: false, preview: false }
    }
    bar1.update(99)
    bar1.stop()
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
        const consolePreview = await emailSender(to, cc, subject, message, messageId)
        console.log(consolePreview)
        await imapEnd(imap)      
        await countdown(emailHeaders, promptComponents)      /// Runs recursively until response (cancellation)
        eventEmitter.emit('input')
    }, timerLength)
    
    await monitor(imap, mailbox, 'INBOX', to, timeoutId)    
    const prompt = await generatePrompt(firstSent, respondingTo)
    const aiFollowUp = await completion(prompt)
    const message = aiFollowUp + promptComponents.signature
   
    chaseSequences[emailHeaders[0]] = timeoutId
    chaseSequences[emailHeaders[0]].nextEmail = sendAt
    console.log(`\n\nMonitoring for ${to}. Preview:\n${message}\n`)
}

async function monitor(imap, emailClient, folder, targetEmail, timeoutId) {       
    new Promise(resolve => { 
        imap.on('error', async (err) => {
            if (err.code == 'ECONNRESET') { 
                return 
            }
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
                const emailFrom = header[5].toLowerCase()                
                targetEmail = targetEmail.toLowerCase()
                console.log(targetEmail, emailFrom)
                if (emailFrom == targetEmail) {
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
