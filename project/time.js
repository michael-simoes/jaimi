console.log('detect.js has run')
const moment = require('moment-business-days')


// ADJUST THIS FOR TIMEZONE
// CHANGE IT TO HUMAN READABLE INSTEAD OF ISO!
async function timer() {
    const utcNow = moment().toISOString()
    let sendAt = moment(utcNow, "YYYY-MM-DD'T'HH:mm:ss:sssxxx").businessAdd(3)._d  /// Adds 8 hours for some reason to do with ISO
    sendAt = moment(sendAt).subtract(8, 'hours').toISOString()
    let timerLength = moment(sendAt).diff(utcNow)
    return { timerLength: timerLength, sendAt: sendAt}
}

module.exports = { timer }