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

///Get the original email we are replying to (for follow-ups)
function inReplyTo(emailClient, replyToId) { 
    imap.on('ready', () => {
        openTheInbox((err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openInbox function: ', err)}
            imap.search([['HEADER', 'MESSAGE-ID', 'CAGfLKzRjy5c=Vz+UEP=aO0k=EoS7vod4u3QpsnqHsthVMYS7pw@mail.gmail.com']], (err, result) => {
                console.log('result: ', result)
                const latestMessage = imap.fetch(result, 
                { 
                    bodies: 
                    ['HEADER.FIELDS (FROM SUBJECT)', 'TEXT'],  
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

function openSentFolder(emailClient, cb) {
    if (emailClient == 'gmail') {
        imap.openBox('[Gmail]/Sent Mail', true, cb);
    }
    else {imap.openBox('SENT', true, cb);}
}


function readLastSent(emailClient) {                           
    imap.on('ready', () => {
        openSentFolder(emailClient, (err, box) => {
            // if (err) {throw new Error('Something has gone wrong with the openSentFolder function: ', err)}
            const latestMessage = imap.seq.fetch(box.messages.total + ':*',
                { 
                    bodies: 
                    ['HEADER.FIELDS (TO CC SUBJECT MESSAGE-ID IN-REPLY-TO)', 'TEXT']           
                })                                                             
            latestMessage.on('message', (msg) => {
                let count = 0
                let body = ''
                let header = ''   
                msg.on('body', (stream) => {
                    count++
                    stream.on('data', (chunk) => {          
                        if (emailClient == 'gmail') {                   //this should be refactored because it's not good to encode as utf-8
                            if (count == 1) {                                           ///on each individual chunk. should be done at end
                                body += chunk                 
                            }
                            else {
                                header += chunk                  
                            }               
                        }                                                              
                        else {
                            if (count == 1) { 
                                header += chunk                  
                            }
                            else {
                                body += chunk                  
                            }               
                        }   
                    }) 
                })
                msg.once('end', () => {
                    header = header.toString('utf8')
                    body = body.toString('utf8')
                    latestMessage.once('end', () => {
                        imap.end()
                        parseEmail(body, header)
                        
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