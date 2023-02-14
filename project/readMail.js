const Imap = require('imap');
const account = require('./account.js')




async function openTheInbox(imap, cb) {
    imap.openBox('INBOX', true, cb);
}

async function readNewestEmail(emailClient) { 
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
                    latestMessage.once('end', () => {
                        imap.end()
                    })
                })    
            }) 
            })
    })
}

///Get the original email we are replying to (for follow-ups)
async function readSpecifiedEmail(imap, emailClient, emailId) {
    let body = ''
    let header = ''
    await new Promise(resolve => { 
        imap.on('ready', () => {
            console.log('hi')
        openTheInbox(imap, (err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openInbox function: ', console.log(err))}
            imap.search([['HEADER', 'MESSAGE-ID', emailId]], (err, result) => {
                console.log('result: ', result)
                const latestMessage = imap.fetch(result, 
                { 
                    bodies: 
                    ['HEADER.FIELDS (FROM SUBJECT)', 'TEXT'],  
                })              
            latestMessage.on('message', (msg) => {   
                let count = 0
                
                
                msg.on('body', (stream) => {            
                count++
                stream.on('data', (chunk) => {              
                    if (emailClient == 'gmail') {                  
                        if (count == 1) {                                          
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
                    body = body.toString('utf8')
                    header = header.toString('utf8')
                    resolve(body, header)
                    latestMessage.once('end', () => {
                        imap.end()
                    })
                })    
            }) 
            })
    })})
    })
    return { body, header }
}


function openSentFolder(imap, emailClient, cb) {
    if (emailClient == 'gmail') {
        imap.openBox('[Gmail]/Sent Mail', true, cb);
    }
    else {imap.openBox('SENT', true, cb);}
}


async function readLastSent(imap, emailClient) {  
    let body = ''    
    let header = ''                            
    await new Promise(resolve => {
        imap.on('ready', () => {
        openSentFolder(imap, emailClient, (err, box) => {
            if (err) {throw new Error('Something has gone wrong with the openSentFolder function: ', console.log(err))}
            const latestMessage = imap.seq.fetch(box.messages.total + ':*',
            { 
                bodies: 
                ['HEADER.FIELDS (TO CC SUBJECT MESSAGE-ID IN-REPLY-TO)', 'TEXT']           
            })                                                             
                latestMessage.on('message', (msg) => {
                let count = 0
                    msg.on('body', (stream) => {
                    count++
                    stream.on('data', (chunk) => {          
                        if (emailClient == 'gmail') {                   
                            if (count == 1) {                                           
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
                    resolve(body, header)
                    latestMessage.once('end', () => {
                        imap.end()
                    })                
                })    
            })
        }) 
        })
    })
return {body, header}
}

async function imapSequence() {
    const imap = new Imap({
        user: account.user,
        password: account.pass,
        host: account.host,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('error', (err) => {
        console.log(err);
    });
    
    imap.once('end', () => {
        console.log('Connection ended');
    });
    
    imap.connect();   
    return imap
}

  
module.exports = { readNewestEmail, readLastSent, readSpecifiedEmail, imapSequence }