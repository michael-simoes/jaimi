const { convert } = require('html-to-text');

function convertHtml(body) {                 
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
    .replaceAll(/--000000000000(.{16})--/g, ' ')
    .replaceAll(/--000000000000(.{16})/g, ' ')
    .replaceAll('= ', '')
    .replaceAll('</span>', '')
    .replaceAll('=E2=80=99', '\'')
    .replaceAll('=E2=80=9D', '\'')
    .replaceAll('=E2=80=9C', '\'') //
    .replaceAll('=85', '...')
    .replaceAll('=C2=A0', '\'')
    .replaceAll('&nbsp;', '')
    .replaceAll('</o:p>', '')
    .replaceAll('Content-Type:', '')
    .replaceAll('Content-Transfer-Encoding:', '')
    .replaceAll('quoted-printable', '')  
    .replaceAll('text/html;', '')
    .replaceAll('"UTF-8"', '')
    .replaceAll('class=3D""', '')
    .replaceAll('<div>', '')
    .replaceAll('</div>', '')
    .replaceAll('=92', '’')
    .replace(/^(\n)/, '')
    .replaceAll(/\b=20\b/g, '\n')
    .replaceAll(/\b[?]=20\b/g, '?\n')
    .replaceAll(/\b[.!,]=20\b/g, '.\n')
    // .replace(/^(\n\n)/, '')
    return body
}

// Remove the extra data appended to the top of the email (typically following conten-transfer-encoding)
// There are several cases added to account for when Content-Transfer has additional characters attached
function removeExtraData(body) {
    for (let i = 0; i < 2; i++) {
        if (body.indexOf('charset=') == -1) {
            return body
        }
        body = body.slice(body.indexOf('charset=') + 8)
    }
    return body
}

function removeReplyThread(body) {
    // Remove reply threads that are indented
    let cleanBody = body
    splitArray = cleanBody.indexOf('> On ')
    if (splitArray != -1) {
        cleanBody = cleanBody.split('> On ').slice(0, 1).join('')
    }
     
    // Replace the '<email@email.com>' that precedes reply threads if there is one
    cleanBody = cleanBody.replace(/<(.*)> wrote:/g, '<RMVBEYOND>')    

     // Remove reply threads that are not indented but have a "from, sent, to" header attached 
    let splitText = cleanBody.split('\n')
    for (let i = 0; i < splitText.length -3; i++) {
        if (splitText[i].indexOf('From: ') == 0 &&
        splitText[i + 1].indexOf('Sent: ') == 0 &&
        splitText[i + 2].indexOf('To: ') == 0) {
            splitText = splitText.slice(0, i)
            cleanBody = splitText.join('\n')
            break
        }
        if (splitText[i].indexOf('<RMVBEYOND>') != -1) {
            splitText = splitText.slice(0, i)
            cleanBody = splitText.join('\n')
            break
        }
    }
    return cleanBody
}

/// This doesn't work if the forward message has no content. This also doesn't work for Outlook
function removeForwardThread(body) {
    splitText = body.split('\n')
    splitArray = splitText.indexOf('---------- Forwarded message ---------')
    if (splitArray != -1) {
        splitText = splitText.slice(0, splitArray)
        body = splitText.join('\n')
    }
    return body
}

function removeDisclaimer(body) {
    // check a parsed email to see if it has a legal disclaimer at the bottom, if so, remove it
    // can check for common language found in those disclaimers and then just remove it 
        // and if it seems sketchy, we can attach a message that says "Legal Disclaimer taken out" 
}

function checkForMarketing(body) {
    // check a parsed email to see if it's probably just a marketing email based on having a bunch of random shit in it
    // can check for a bunch of weird characters
    // doesn't have to be perfect, just get a good "guess" so that OpenAI isn't wasting money
}

// Detect type of header element, then select correct function to parse the content
async function parseHeader(header) {
    let splitHead = header.replaceAll('\t', '')
    splitHead = splitHead.split('\r\n')
    let to = '', cc = '', subject = '', messageId = '', replyToId = '', from = '';
    let func = ''
    const headerObject = { 
       charOptions: [ 'T', 'C', 'S', 'M', 'I', 'F'],
       headerElements: [to, cc, subject, messageId, replyToId, from], 
       charCleaners: { 
            'T': (param) => { 
                return param.replaceAll(/(.*)</g, '').replaceAll('>', '').replaceAll('To:', '').replaceAll(' ', '').replaceAll(';', '')
            },
            'C': (param) => { 
                return param.replaceAll(/(.*)</g, '').replaceAll('>', '') 
            }, 
            'S': (param) => { 
                return param.replace('Subject: ', '') 
            },
    
            'M': (param) => { 
                return param.replace(/(.*)</g, '').replace('>', '') 
            },
            'I': (param) => { 
                return param.replace(/(.*)</g, '').replace('>', '') 
            },
            'F': (param) => { 
                return param.replaceAll(/(.*)</g, '').replaceAll('>', '').replaceAll(' ', '').replaceAll('From:', '')
            },
        } 
    }
    // Message-ID and Reply-To-ID get messed up in Outlook. This identifies 
    // the weird formatting and fixes it
    for (let i = 0; i < splitHead.length; i++) {
        let ids = ['Message-ID:', 'In-Reply-To:']
        for (let j = 0; j < 2; j++) {
            if (splitHead[i] == ids[j]) {
                splitHead[i] = splitHead[i] + splitHead[i + 1]
                let forDeletion = splitHead[i + 1]
                splitHead = splitHead.filter(item => !forDeletion.includes(item))
            }
        }
        // Detects header element based on first char in array
        // Selects parsing function based on char and assigns parsed text to new array
        for (let char = 0; char < headerObject.charOptions.length; char++) {
            if (splitHead[i][0] == headerObject.charOptions[char]) {
                func = headerObject.charCleaners[ headerObject.charOptions[char] ]    
                headerObject.headerElements[char] = func(splitHead[i])
            }
        }
    }
    return headerObject.headerElements
}

async function decode64(body) {
    let base64 = body.slice(0, 100).indexOf(' ')         // this is pretty much useless? emails start with some content-types
    if (base64 == -1) {
        let buffer = Buffer.from(body, 'base64')
        return buffer.toString('utf8')
    }
    return body
}

async function removeAttachments(body) {
    // cut everything after content-type because it will just be encoded attachments
    const contentDisposition = ['Content-Type: image', 'Content-Type: application']
    for (let i = 0; i < 2; i++) {
        let attachmentIndex = body.indexOf(contentDisposition[i])
        if (attachmentIndex != -1) {
            body = body.slice(0, attachmentIndex)
        }
    }
    return body
}

async function removeSpaces(body) {
    String.prototype.lastChar = function() {
        return this.charAt(this.length - 1);
    }
    while (body[0] == ' ' || body[0] == '\n') {
        console.log('active')
        body = body.substring(1)
    }
    const validLastChars =  /[A-Za-z0-9_.,?\!"'/$]/ 
    while (!validLastChars.test(body.lastChar())) {
        body = body.slice(0, -1)
    }
    return body
}

async function parseBody(body) {
    body = await removeAttachments(body)
    cleanBody = await decode64(body)
    // If the email has content-disposition attribute or it's super long, throw an error
    // It's likely that the email contains an attachment or image which we cannot process yet
    cleanBody = await convertHtml(cleanBody) // This has to run before if statement or too many false positives
    if (cleanBody.length > 2500) {           // Fail-safe. If we missed an attachment this should catch the base64
        return false
    }
    cleanBody = await cleanString(cleanBody)
    cleanBody = await removeExtraData(cleanBody)
    cleanBody = await removeReplyThread(cleanBody)
    cleanBody = await removeForwardThread(cleanBody)
    cleanBody = await removeSpaces(cleanBody)    
    console.log('EMAIL BODY:', cleanBody)
    return cleanBody
}

module.exports = { parseBody, parseHeader }