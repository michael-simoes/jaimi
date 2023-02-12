const { convert } = require('html-to-text');
const { inReplyTo } = require('./readMail');



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

//Remove the extra data appended to the top of the email (typically following conten-transfer-encoding)
//There are several cases added to account for when Content-Transfer has additional characters attached
function removeExtraData(body) {
    let splitArray = ''
    splitText = body.split(' ')
    const contentTransferEncodings = ['Content-Transfer-Encoding:', 'Content-Transfer-Encoding: ', 
        ' Content-Transfer-Encoding:', '\nContent-Transfer-Encoding:', 'Content-Transfer-Encoding:\n'] 

    for (let i = 0; i < contentTransferEncodings.length; i++) {
        if (splitText.indexOf(contentTransferEncodings[i]) != -1) {
            splitArray = splitText.indexOf(contentTransferEncodings[i])
            body = splitText.slice(splitArray + 1).join(' ').slice(17) 
        }
    }
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
     splitText = cleanBody.split('\n')
     for (let i = 0; i < splitText.length -3; i++) {
         if (splitText[i].indexOf('From: ') == 0 &&
             splitText[i + 1].indexOf('Sent: ') == 0 &&
             splitText[i + 2].indexOf('To: ') == 0) {
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
    return cleanBody
}

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

//Order of header elements is different for Google and Outlook
//###############This probably gets messed up with CC and BCC#######################
async function getHeaderElements(header) {
    //outlook
    let splitHead = header.replaceAll('\t', '')
    splitHead = splitHead.split('\r\n')
    let to = ''
    let cc = ''
    let subject = ''
    let messageId = ''
    let replyToId = ''
    // let identifyChar = ['T', '']
    const object = { object: 'value', layer: { another: 'layer' }}
    const identifyChar = { 
       charOptions: [ 'T', 'C', 'M', 'I', '\t' ],
       charVariables: [to, cc, subject, messageId, replyToId], 
       charFormula: {
        
       },
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
            '\t': (param) => { 
                return param.replace('\t<', '').replace('>', '') 
            },
            'M': (param) => { 
                return param.replace('\t<', '').replace('>', '') 
            },
            'I': (param) => { 
                return param.replace('\t<', '').replace('>', '') 
            },
        } 
    }

    // function HeaderSection(character, method) {
    //     this.character = character
    //     this.method = method
    // }

    // function cleanTo(param) { 
    //     return param.replaceAll(/(.*)</g, '').replaceAll('>', '') 
    // }

    // const too = new HeaderSection('t', cleanTo('>hihihi'))

    let func = ''
    //RUNS OVER, TOO LONG OR SOMETHING

    //If there are more items in the array than there are characters (aka there's the extra tab)
            ///then run with the char set that includes '<' 
            //otherwise run with the car set that includes 

    for (let i = 0; i < splitHead.length; i++) {
        if (splitHead[i] == 'Message-ID:') {
            splitHead[i] = splitHead[i] + splitHead[i + 1]
            splitHead[i + 2] = splitHead[i + 2] + splitHead[i + 3]
            let forDeletion = [splitHead[i + 1], splitHead[i + 3]]
            arr = splitHead.filter(item => !forDeletion.includes(item))
            console.log(arr)
            // splitHead = splitHead[i, i+1]
            // console.log(splitHead)
        }
        // for (let char = 0; char < identifyChar.charOptions.length; char++) {
        //     if (splitHead[i][0] == identifyChar.charOptions[char]) {
        //         // func = identifyChar.charCleaners[ identifyChar.charOptions[char] ] //splitHead[i].replaceAll(/(.*)</g, '').replaceAll('>', '')    
        //         // console.log(identifyChar.charOptions[char])
        //         // console.log(to('>OK BASED'))
        //         // identifyChar.charVariables[char] = func(splitHead[i])
        //     }
        // }
        
    }
    
    // let to = splitHead[0].replaceAll(/(.*)</g, '').replaceAll('>', '')
    // let subject = splitHead[1].replace('Subject: ', '')
    // let messageId = splitHead[3].replace('\t<', '').replace('>', '')
    // let replyToId = splitHead[5].replace('\t<', '').replace('>', '')
    // console.log('subject:', subject)
    console.log('to:', to)
    console.log('messageId:', messageId)
    console.log('in-reply-to:', replyToId)
    console.log('in-reply-to:', replyToId)

    //google now
    console.log(splitHead)
    process.exit()
    return true
    
}

async function parseEmail(body, header) {
    header = await getHeaderElements(header)
    plainBody = await convertHtml(body)
    cleanBody = await cleanString(plainBody)
    cleanBody = await removeExtraData(cleanBody)
    cleanBody = await removeReplyThread(cleanBody)
    cleanBody = await removeForwardThread(cleanBody)
    if (cleanBody.slice(0, 1000).indexOf('\n') == -1 && cleanBody.length > 300) {
        console.log('This email could not be read. It contains an attachment or image.')
        return
    }
    
    console.log(header, cleanBody)
    return cleanBody
}


module.exports = { parseEmail }