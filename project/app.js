console.log('app.js has run');
// require('dotenv').config({ path: '../.env.gmail' })
require('dotenv').config({ path: '../.env.other' })
const { readLastSent, readEmail, imapInit, imapEnd, openFolder, readLastReceived } = require('./readMail.js');
const promptComponents = require('./prompts.js');                     
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const { emailSender } = require('./send.js')
const instruction = require('prompt-sync')({sigint: true});
const EventEmitter = require('events');


const mailbox = process.env.MAILBOX


const eventEmitter = new EventEmitter();

// try with native readline
// make the console request for input from user a promise?
// eventEmitter.on('chase', async () => {
//     console.log('chase sequence started');
//     await main()
//     let selection = instruction('>> ');
//         selection = selection.toLowerCase()
//         if (selection == 'chase') {
//             console.log('Chase sequence initiated.');
//             eventEmitter.emit('chase');            
//         } 
// });

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  eventEmitter.on('chase', async () => {  
    console.log('chase sequence started');
    main()
    readline.question('Who are you?', (input) => {
        if (input == 'hello') {
        console.log(`Hey there ${input}!`);
        eventEmitter.emit('chase');
    }
  })
})


eventEmitter.emit('chase');



// const express = require('express')
// const app = express()

// // respond with "hello world" when a GET request is made to the homepage
// app.get('/asdf', (req, res) => {
//   res.send('hello world')
//   console.log('REQUEST LOGGED')
//   main()
// })

// app.listen(3000)


async function test() {
    let exit = false;
    while (!exit) {
        console.log(
            `Enter a command:
            'chase' = initiate follow-up sequence on most recently sent email
            'exit' = exit the application and all active follow-up sequences`
            )
        let selection = instruction('>> ');
        selection = selection.toLowerCase()
        if (selection == 'chase') {
            console.log('Chase sequence initiated.');
            main()
        } 
        else if (selection == 'exit') {
            console.log('Exiting application.')
            exit = true
        }
        else {
            console.log('Invalid selection.');
        }
    }
}

// const numberToGuess = Math.floor(Math.random() * 10) + 1;
// let foundCorrectNumber = false;

// while (!foundCorrectNumber) {
//   let guess = prompt('Guess a number from 1 to 10: ');

//   if (guess == numberToGuess) {
//     console.log('Congrats, you got it!');
//     foundCorrectNumber = true;
//   } 
//   else {
//     console.log('Sorry, guess again!');
//   }
// }

async function main() {   
    const emailElements = await connection(readLastSent, true)
    try {
        promptComponents.firstSent += await parseBody(emailElements.body) 
    } catch (e) {
        console.log('Error, body of email could not be parsed', e)
        return
    }
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
    }, 30000)
    
    // Save timeoutId so this timeout can be cancelled if mail is received for it
    // console.log(timeoutId)
    await monitor(imap, mailbox, 'INBOX', to, timeoutId)
}

/// NOT CANCELLING YAHOO EMAILS PROPERLY. DETECTING THEM, BUT NOT CANCELLING TIMEOUT!
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
        const result = await func(imap, mailbox)
        await imapEnd(imap)
        return result
    }
    const result = await func(imap, mailbox, folder, messageId)
    await imapEnd(imap)
    return result
}
