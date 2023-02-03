const { Configuration } = require('openai')
const { OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

const prompts = ['Respond to the message below: ',
  'Respond to this message by saying thank you and that I\'ll respond shortly with the details they need: ',
  'Respond to this message by saying that I\'ll get back soon with the details they need: ']

const fakeEmail = 'Hi Michael & Carin, I am driving to Calgary next Thursday. Not sure I will be arriving in time -Thanks Wayne'

async function completion(prompt) {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.7,
      stream: true
    });
    // console.log(completion.data.choices[0].text);
    console.log(completion.toString('utf8'));
    console.log('run')
   
  } catch(error) { console.log(error) }
}


function generatePrompt(email) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Select type of prompt...', (choice) => {
    let prompt = ''
    readline.close();
    prompt = prompts[choice] + email
    completion(prompt)
    
  });

}

generatePrompt(fakeEmail)
