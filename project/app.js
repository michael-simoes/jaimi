console.log('app.js has run');
const whereami = 'app.js'

const { readLastSent, readEmail, imapInit, imapEnd} = require('./readMail.js');
const account = require('./account.js');
const promptComponents = require('./prompts.js');                        ///we shouldn't need this 
const { parseBody, parseHeader } = require('./editEmail.js');
const { chase, completion } = require('./generate.js')
const emailSender = require('./send.js')

async function main() {   
    const emailElements = await connection(readLastSent, true)
    promptComponents.firstSent += await parseBody(emailElements.body) 
    const sentEmailHeader = await parseHeader(emailElements.header)
    
    //If there's no email that we're replying to, initiate the follow-up just using the first email
    if (!sentEmailHeader[4]) {
        console.log('No reply-to address')
        return                          ///Go to generate --> send
    }
    let repliedToElements = await connection(readEmail, false, 'SENT', sentEmailHeader[4])
    if (!repliedToElements) {
        repliedToElements = await connection(readEmail, false, 'INBOX', sentEmailHeader[4])
    }
    promptComponents.respondingTo = await parseBody(repliedToElements.body)
    const repliedtoHeader = await parseHeader(repliedToElements.header)


    // Something like this works to attach email addresses to Timeouts that are running followups
    let followUps = {}
    async function followup(email) {
        
        const timeoutId = setTimeout(() => {
            console.log("Hello World");          /// Send followup email
            followup()                            // restart sequence!
        }, 2000);
        
        followUps[email] = timeoutId
        console.log(followUps)
        
        // clearTimeout(followUps[email]);       // until this gets called
        
        console.log(`Timeout ID ${timeoutId} has been cleared`);
    }
    
    followup('central.michael88@gmail.com')


  

    for (let i = 0; i < 2; i++) {
        console.log('run', i)
        const list = ['a', 'b', 'c']
        let k = list[i]
        promptComponents[k] = 'hello' }
    // console.log(promptComponents)
    return

    // TO DO:
    // Create cancellable timeout event after email is sent that calls func after 72 hours. 
    // Create unique timeout ID based on email that is being chased
    const prompt = await chase(promptComponents.firstSent, promptComponents.respondingTo)
    const emailResponse = await completion(prompt)
}

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

main()