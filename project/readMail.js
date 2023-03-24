const Imap = require('imap');

async function openFolder(folder, imap, emailClient = null, cb) {
    if (folder != 'SENT') {
        imap.openBox('INBOX', true, cb)
        return
    }
    if (emailClient == 'gmail') {
        imap.openBox('[Gmail]/Sent Mail', true, cb)
        return
    }
    imap.openBox('SENT', true, cb)
    return
}

//Returns email message event based on emailId (or most recent email if no ID is provided)
async function emailFetch(imap, emailId = 0, box) {
    if (emailId != 0) {
        let fetchedMessage = null
        await new Promise(resolve => {
            imap.search([['HEADER', 'MESSAGE-ID', emailId]], (err, result) => {
                if (result == '') {
                return resolve(1)
            }
            fetchedMessage = imap.fetch(result,
            { 
                bodies: 
                ['HEADER.FIELDS (FROM SUBJECT)', 'TEXT'],  
            })
            resolve(fetchedMessage)
        })
    })
    return fetchedMessage
    }
    let fetchedMessage = imap.seq.fetch(box.messages.total + ':*',
        { 
            bodies: 
            ['HEADER.FIELDS (TO CC SUBJECT MESSAGE-ID IN-REPLY-TO FROM)', 'TEXT']           
        })
    return fetchedMessage   
}

//Calls readEmail function with paramters to search most recently sent email
async function readLastSent(imap, emailClient) {
    let result = await readEmail(imap, emailClient, 'SENT')
    return result
}

async function readLastReceived(imap, emailClient) {
    let result = await readEmail(imap, emailClient, 'INBOX')
    return result
}

//Based on parameters, will search for an email
//If emailId is blank, will search for most recently sent or received email
async function readEmail(imap, emailClient, folder, emailId) {
    let body = ''
    let header = ''
    let error = ''
    await new Promise(resolve => { 
        imap.on('error', (err) => {
            return resolve(error = err)
        })
        imap.on('ready', () => {
            openFolder(folder, imap, emailClient, async (err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openInbox function: ', console.log(err))}
            let fetchedMessage = ''
            if (emailId) {
                fetchedMessage = await emailFetch(imap, emailId, box)    
            }
            else { 
                fetchedMessage = await emailFetch(imap, 0, box)
            }
            //If there is no email matching search criteria, readEmail() returns FALSE
            if (fetchedMessage == null) {
                return resolve(error = 'No email found.')
            }         
            fetchedMessage.on('message', (msg) => {   
                let count = 0
                msg.on('body', (stream) => {             
                count++
                    stream.on('data', (chunk) => {            
                        if (emailClient == 'gmail') {                  
                            if (count == 1) { body += chunk }
                            else { header += chunk }               
                        }                                                              
                        else {
                            if (count == 1) { header += chunk }                  
                            else { body += chunk }               
                        }    
                    }) 
                })
                msg.once('end', () => {
                    body = body.toString('utf8')
                    header = header.toString('utf8')                    
                    resolve(body, header)
                })    
            }) 
            
        })})
    })
    return { body, header, error }
}

async function imapInit() {
    let imap = new Imap({
        user: process.env.JAIMI_USER,
        password: process.env.JAIMI_PASS,              
        host: process.env.IMAP_DOMAIN,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    })

    imap.connect()  
    return imap
}

async function imapEnd(imap) {
    imap.end()
}
  
module.exports = { readLastSent, readEmail, imapInit, imapEnd, openFolder, readLastReceived }