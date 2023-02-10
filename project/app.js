console.log('app.js has run')

const { readNewestEmail, readLastSent, inReplyTo } = require('./readMail.js')
const account = require('./account.js')
const prompts = require('./prompts.js')



// readNewestEmail(account.mailbox)

//STOP TRYING TO MAKE IT CLEAN. SHIT WON'T WORK. JUST TREAT READNEWESTEMAILs as START POINT FOR ALL OTHER WORK!

// readNewestEmail(account.mailbox)
readLastSent(account.mailbox)
// inReplyTo()
//Fetch email we are replying to based on sender and subject line


    
//Load email into generate.js
////Load it into prompts.js



//Take generated reply from OpenAi
//Send over SMTP