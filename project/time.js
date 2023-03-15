const moment = require('moment-business-days')

async function timer() {
    const utcNow = moment().toISOString()
    let sendAt = moment(utcNow).add(9, 'seconds')
    // let sendAt = moment(utcNow, "YYYY-MM-DD'T'HH:mm:ss:sssxxx").businessAdd(3)._d  /// Adds 8 hours for some reason to do with ISO
    // sendAt = moment(sendAt).subtract(8, 'hours').toISOString()
    let timerLength = moment(sendAt).diff(utcNow)
    // sendAt = moment(sendAt).format("dddd, MMMM Do YYYY, h:mm:ss a")
    return { timerLength: timerLength, sendAt: sendAt}
}
module.exports = { timer }