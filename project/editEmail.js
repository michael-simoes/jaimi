const { convert } = require('html-to-text');


function getSentTime() {
    /// get sent time of email, send additional email after 72 hours if no reply received
    //IF jaimi sends the email, then we don't have to look for it in the inbox. This is much easier.


}

function checkForReply() {
    ///if an email from {SENDER} has not been received after specified {TIME}, initiate follow up sequence
    //read newest email, add to "db"
    ///on 72 hours after email sent, trigger follow-up sequence
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
    // .replace(/^(\n\n)/, '')
    return body
}

//Remove the extra data appended to the top of the email (typically following conten-transfer-encoding)
//There are several cases added to account for when Content-Transfer has additional characters attached
////NOTE: There may be a far better way to do this using indexOf('charset=', 20) and slicing the body string...
////see the third to last line of the function
function removeExtraData(body) {
    // let splitArray = ''
    // splitText = body.split(' ')
    // const contentTransferEncodings = ['Content-Transfer-Encoding:', 'Content-Transfer-Encoding: ', 
    // ' Content-Transfer-Encoding:', '\nContent-Transfer-Encoding:', 'Content-Transfer-Encoding:\n'] 
    
    // for (let i = 0; i < contentTransferEncodings.length; i++) {
    //     if (splitText.indexOf(contentTransferEncodings[i]) != -1) {
    //         splitArray = splitText.indexOf(contentTransferEncodings[i])
    //         body = splitText.slice(splitArray + 1).join(' ').slice(17) 
    //     }
    // }
    if (body.indexOf('charset=') == -1) {
        return body
    }
    body = body.slice(body.indexOf('charset=', 20) + 9)
    return body
}

function removeReplyThread(body) {
    //Remove reply threads that are indented
     let cleanBody = body
     splitArray = cleanBody.indexOf('> On ')
     if (splitArray != -1) {
         cleanBody = cleanBody.split('> On ').slice(0, 1).join('')
     }
     
     //Remove reply threads that are not indented but have a "from, sent, to" header attached 
     let splitText = cleanBody.split('\n')
     for (let i = 0; i < splitText.length -3; i++) {
         if (splitText[i].indexOf('From: ') == 0 &&
         splitText[i + 1].indexOf('Sent: ') == 0 &&
         splitText[i + 2].indexOf('To: ') == 0) {
             splitText = splitText.slice(0, i)
             cleanBody = splitText.join('\n')
             console.log(splitText)
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
        return cleanBody
}

///This doesn't work if the forward message has no content. This also doesn't work for Outlook
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
    //check a parsed email to see if it has a legal disclaimer at the bottom, if so, remove it
    //can check for common language found in those disclaimers and then just remove it 
        //and if it seems sketchy, we can attach a message that says "Legal Disclaimer taken out" 
}

function checkForMarketing(body) {
    //check a parsed email to see if it's probably just a marketing email based on having a bunch of random shit in it
    //can check for a bunch of weird characters
    //doesn't have to be perfect, just get a good "guess" so that OpenAI isn't wasting money
}

//Detec type of header element, then select correct function to parse the content
async function parseHeader(header) {
    let splitHead = header.replaceAll('\t', '')
    splitHead = splitHead.split('\r\n')
    let to = '', cc = '', subject = '', messageId = '', replyToId = ''
    let func = ''
    const headerObject = { 
       charOptions: [ 'T', 'C', 'S', 'M', 'I'],
       headerElements: [to, cc, subject, messageId, replyToId], 
       charCleaners: { 
            'T': (param) => { 
                return param.replaceAll(/(.*)</g, '').replaceAll('>', '') 
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
        } 
    }

    for (let i = 0; i < splitHead.length; i++) {
        //Message-ID and Reply-To-ID get messed up in Outlook. This identifies 
        //the weird formatting and fixes it
        if (splitHead[i] == 'Message-ID:') {
            splitHead[i] = splitHead[i] + splitHead[i + 1]
            splitHead[i + 2] = splitHead[i + 2] + splitHead[i + 3]
            let forDeletion = [splitHead[i + 1], splitHead[i + 3]]
            splitHead = splitHead.filter(item => !forDeletion.includes(item))
        }
        //Detects header element based on first char in array
        //Selects parsing function based on char and assigns parsed text to new array
        for (let char = 0; char < headerObject.charOptions.length; char++) {
            if (splitHead[i][0] == headerObject.charOptions[char]) {
                func = headerObject.charCleaners[ headerObject.charOptions[char] ]    
                headerObject.headerElements[char] = func(splitHead[i])
            }
        }
    }
    return headerObject.headerElements
}

async function parseBody(body, header) {
    cleanBody = await convertHtml(body)
    // If the email has content-disposition attribute or it's super long, throw an error
    // It's likely that the email contains an attachment or image which we cannot process yet
    if (cleanBody.indexOf('Content-Disposition:') != -1 || cleanBody.length > 1500) {
        throw new Error('This email could not be read. It contains an attachment or image. Review parsedBody function.')
    }
    cleanBody = await cleanString(cleanBody)
    cleanBody = await removeExtraData(cleanBody)
    cleanBody = await removeReplyThread(cleanBody)
    cleanBody = await removeForwardThread(cleanBody)    
    return cleanBody
}


module.exports = { parseBody, parseHeader }