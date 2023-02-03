const Imap = require('imap');
const { convert } = require('html-to-text');
const account = require('./account.js')


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
        const latestMessage = imap.seq.fetch(box.messages.total + ':*', { 
            bodies: 
            ['HEADER.FIELDS (FROM SUBJECT)',
            'TEXT'],  
        }) 
        latestMessage.on('message', (msg) => {   
            let count = 0
            let body = ''
            let header = ''
            msg.on('body', (stream) => {          ///RUNS TWICE (for email header and body)
            count++
            stream.on('data', (chunk) => {           ///RUNS AS MANY TIMES AS IS NECESSARY for each data stream (header and body)       
                if (emailClient == 'gmail') {
                    if (count == 1) { 
                        body += chunk.toString('utf8')                 
                    }
                    else {
                        header += chunk.toString('utf8')                  
                    }               
                }                                                              
                if (emailClient != 'gmail') {
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


function convertHtml(body) {                      //////pretty sure this Promise is not doing anything
    return new Promise((resolve, reject) => {      
        const plainBody = convert(body, {
        wordwrap: null,
        baseElements: { 
            selectors: [ 'body' ],
            selector: 'a', options: { hideLinkHrefIfSameAsText: true } } 
        }) 
        resolve(plainBody)
        reject('Error: converting HTML contents of email to plaintext has failed.')
    }).then((plainBody) => {
        return plainBody 
    })  
}

function cleanString(body) {
    body = body
    .replaceAll(/--000000000000(.*)--/g, ' ')
    .replaceAll('= ', '')
    .replaceAll('</span>', '')
    .replaceAll('=E2=80=99', '\'')
    .replaceAll('=E2=80=9D', '\'')
    .replaceAll('=E2=80=9C', '\'') //
    .replaceAll('=85', '...')
    .replaceAll('=C2=A0', '\'')
    .replaceAll('&nbsp;', '')
    .replaceAll('</o:p>', '')
    // .replaceAll(' Content-Type: text/plain;', '')
    .replaceAll('Content-Type:', '')
    .replaceAll('text/html;', '')
    .replaceAll('"UTF-8"', '')
    .replaceAll('class=3D""', '')
    .replaceAll('<div>', '')
    .replaceAll('</div>', '')
    .replaceAll('=92', '’')
    // .replaceAll('"UTF-8"', '') 
    // .replaceAll('charset=', '')
    // .replaceAll('text/plain;', '')
    return body
}

    //THIS CLEANS UP GMAIL!

async function parseEmail(body, header) {
    plainBody = await convertHtml(body)
    cleanBody = await cleanString(plainBody)

    //Remove the extra data appended to the top of the email (typically following conten-transfer-encoding)
    //There are several cases added to account for when Content-Transfer has additional characters attached
    splitText = cleanBody.split(' ')
    let splitArray = splitText.indexOf('Content-Transfer-Encoding:', 5)
    if (splitArray != -1) {
        cleanBody = splitText.slice(splitArray + 1).join(' ').slice(17)
    }
    else if(splitText.indexOf('Content-Transfer-Encoding: ', 5) != -1) {
        cleanBody = splitText.slice(splitArray + 1).join(' ').slice(17)
    } 
    else if(splitText.indexOf(' Content-Transfer-Encoding:', 5) != -1) {
        cleanBody = splitText.slice(splitArray + 1).join(' ').slice(17)
    }
    else if(splitText.indexOf('\nContent-Transfer-Encoding:', 5) != -1) {
        cleanBody = splitText.slice(splitArray + 1).join(' ').slice(17)
    }
    else if(splitText.indexOf('Content-Transfer-Encoding:\n', 5) != -1) {
        cleanBody = splitText.slice(splitArray + 1).join(' ').slice(17) 
    }
    else {cleanBody = splitText.join(' ')}

    //Remove reply threads that are indented
    splitArray = cleanBody.indexOf('> On ')
    if (splitArray != -1) {
        cleanBody = cleanBody.split('> On ').slice(0, 1).join('')
    }
    //Here we have splitText split based on new line character
    //Remove reply threads that are not indented but have a "from, sent, to, subject" header attached
    splitText = cleanBody.split('\n')
    for (let i = 0; i < splitText.length -4; i++) {
        if (splitText[i].indexOf('From: ') == 0 &&
            splitText[i + 1].indexOf('Sent: ') == 0 &&
            splitText[i + 2].indexOf('To: ') == 0 &&
            splitText[i + 3].indexOf('Subject: ') == 0) {
            splitText = splitText.slice(0, i)
            cleanBody = splitText.join('\n')
            break
        }
    }
    //Remove reply threads characterized by the ">" character on every line, and "<email address> wrote:" on the line before
    for (let i = 0; i < splitText.length -3; i++) {
        if (splitText[i].indexOf('> wrote:') > -1 &&
            splitText[i + 3].indexOf('>') == 0 ||
            splitText[i + 2].indexOf('>') == 0 &&
            splitText[i + 4].indexOf('>') == 0 &&
            splitText[i + 5].indexOf('Subject: ') == 0) {
            splitText = splitText.slice(0, i)
            cleanBody = splitText.join('\n')
            break
        }
    }
    //Remove forwarded section of emails 
    splitArray = splitText.indexOf('---------- Forwarded message ---------')
    if (splitArray != -1) {
        splitText = splitText.slice(0, splitArray)
        cleanBody = splitText.join('\n')
    }
    else { cleanBody = splitText.join('\n') }
    console.log(cleanBody)
    return cleanBody
}
        
imap.once('error', function(err) {
    console.log(err);
});

imap.once('end', function() {
    console.log('Connection ended');
});

imap.connect();
  
module.exports = readNewestEmail