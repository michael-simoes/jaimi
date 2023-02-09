let variable = 'I am emailing you about your car"s extended warranty. could you please review the documents and let me know if you"re ready for new car insurance?'

const prompts = {
    whoami: 
        'You are Michael. ',
    followUpCommand: 
        `Write a follow up note.\nEmail to respond to: `,
    respondingTo: 
        '',
    firstSent: 
        '\nMichael: ',
    followUpExamples:
        '\nMichael: Hi there, Just wanted to follow-up on this. Best, Michael\nMichael: Hello, I wanted to send a quick reminder since I know you\'re busy. Please let me know if there\'s anything I can do to help. Thanks, Michael\nMichael: ',
    respondDetailsLater: 
        'Respond to this message by saying that I\'ll get back soon with the details they need: '}

module.exports = prompts