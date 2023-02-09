const Imap = require('imap');
const account = require('./account.js')
const { parseEmail } = require('./editEmail.js')


const imap = new Imap({
    user: account.user,
    password: account.pass,
    host: account.host,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

function openTheInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

function readNewestEmail(emailClient) { 
    imap.on('ready', () => {
        openTheInbox((err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openInbox function: ', err)}
            const latestMessage = imap.seq.fetch(box.messages.total + ':*', 
                { 
                    bodies: 
                    ['HEADER.FIELDS (FROM SUBJECT MESSAGE-ID)', 'TEXT'],  
                }) 
            latestMessage.on('message', (msg) => {   
                let count = 0
                let body = ''
                let header = ''
                msg.on('body', (stream) => {            ///RUNS TWICE (for email header and body)
                count++
                stream.on('data', (chunk) => {           ///RUNS AS MANY TIMES AS IS NECESSARY for each data stream (header and body)       
                    if (emailClient == 'gmail') {                   //this should be refactored because it's not good to encode as utf-8
                        if (count == 1) {                                           ///on each individual chunk. should be done at end
                            body += chunk.toString('utf8')                 
                        }
                        else {
                            header += chunk.toString('utf8')                  
                        }               
                    }                                                              
                    else {
                        if (count == 1) { 
                            header += chunk.toString('utf8')                  
                        }
                        else {
                            body += chunk.toString('utf8')                  
                        }               
                    }    
                }) 
                })
                msg.once('end', () => {
                    parseEmail(body, header)
                    latestMessage.once('end', () => {imap.end()})
                })    
            }) 
            })
    })
}

function inReplyTo(emailClient, replyToId) { 
    imap.on('ready', () => {
        openTheInbox((err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openInbox function: ', err)}
            imap.search([['HEADER', 'SUBJECT', 'Hey'], ['FROM', 'central.michael88@gmail.com']], (err, result) => {
                console.log('result: ', result)
                const latestMessage = imap.fetch(result, 
                { 
                    bodies: 
                    ['HEADER.FIELDS (FROM SUBJECT MESSAGE-ID)', 'TEXT'],  
                })              
            latestMessage.on('message', (msg) => {   
                let count = 0
                let body = ''
                let header = ''
                
                msg.on('body', (stream) => {            ///RUNS TWICE (for email header and body)
                count++
                stream.on('data', (chunk) => {           ///RUNS AS MANY TIMES AS IS NECESSARY for each data stream (header and body)       
                    if (emailClient == 'gmail') {                   //this should be refactored because it's not good to encode as utf-8
                        if (count == 1) {                                           ///on each individual chunk. should be done at end
                            body += chunk.toString('utf8')                 
                        }
                        else {
                            header += chunk.toString('utf8')                  
                        }               
                    }                                                              
                    else {
                        if (count == 1) { 
                            header += chunk.toString('utf8')                  
                        }
                        else {
                            body += chunk.toString('utf8')                  
                        }               
                    }    
                }) 
                })
                msg.once('end', () => {
                    // parseEmail(body, header)
                    latestMessage.once('end', () => {imap.end()})
                })    
            }) 
            })
    })})
}

function openSentFolder(cb) {
    imap.openBox('SENT', true, cb);
}


function readLastSent() {                           
    imap.on('ready', () => {
        openSentFolder((err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openSentFolder function: ', err)}
            const latestMessage = imap.seq.fetch(box.messages.total + ':*', 
                { 
                    bodies: 
                    ['HEADER.FIELDS (TO SUBJECT MESSAGE-ID IN-REPLY-TO)'],             //PH7PR06MB8995050BF19FD36F01ECB6C6EAD89@PH7PR06MB8995.namprd06.prod.outlook.com
                })                                                                      //PH7PR06MB89950005A9D6466E056EDC34EAD99@PH7PR06MB8995.namprd06.prod.outlook.com
            latestMessage.on('message', (msg) => {   
                let headers = ''
                msg.on('body', (stream) => {
                    stream.on('data', (chunk) => {          
                            headers += chunk
                    }) 
                })
                msg.once('end', () => {
                    headers = headers.toString('utf8')
                    latestMessage.once('end', () => {
                        imap.end()

                        // console.log(messageId, subject)
                        parseEmail('', headers)
                        
                    })
                })    
            }) 
            })
    })
}


        
imap.once('error', function(err) {
    console.log(err);
});

imap.once('end', function() {
    console.log('Connection ended');
});

imap.connect();

  
module.exports = { readNewestEmail, readLastSent, inReplyTo }