console.log('detect.js has run')

async function getDateTime() {
const businessDay = require('moment-business-days')
const { DateTime } = require('luxon')

let dateTime = DateTime.now().setZone('America/Los_Angeles')
let date = dateTime.c.day + ' ' + dateTime.c.month + ' ' + dateTime.c.year
let time = dateTime.c.hour + ':' + dateTime.c.minute

console.log('date:', date)
console.log('time:', time)
setTimeout(async () => {
    console.log('Result')
}, 10000)
return 

dateTime = dateTime.plus({days: 3})
date = dateTime.c.day + ' ' + dateTime.c.month + ' ' + dateTime.c.year
time = dateTime.c.hour + ':' + dateTime.c.minute
console.log('date:', date)
console.log('time:', time)

}

getDateTime()

module.exports = getDateTime