const { Configuration } = require('openai')
const { OpenAIApi } = require('openai');
const prompts = require('./prompts.js')

const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

const fakeEmail = 'Hi Tomiwa, I’ve reviewed the Neo employment folder and am ready to move forward in the hiring process. Everything seems good to me. What are the next steps?'

async function completion(prompt) {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 500                                               
    });
    console.log(completion.data.choices[0].text);   
  } catch(error) { console.log(error) }
}


function chase(email) {
    let prompt = '' 
    prompt = prompts.whoami + prompts.followUpCommand + prompts.respondingTo + prompts.firstSent + email + prompts.followUpExamples
    console.log(prompt)
    // completion(prompt)
    
  };


chase(fakeEmail)
