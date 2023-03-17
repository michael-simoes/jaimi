const { Configuration } = require('openai')
const { OpenAIApi } = require('openai');
const prompts = require('./prompts.js')

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

async function completion(prompt) {  
  return 'This is just a test conducted without accessing the API.'
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 1.1,
      max_tokens: 500                                               
    });

    return completion.data.choices[0].text   
  } catch(error) { console.log(error) }
}

async function generatePrompt(firstSent, replyingToBody) {
    if (!replyingToBody) {
      return prompts.whoami + prompts.followUpCommand + firstSent + prompts.followUpExamples     
    }
    return prompts.whoami + prompts.followUpCommand + '\nEmail to respond to:' + replyingToBody + firstSent + prompts.followUpExamples   
  };

module.exports = { generatePrompt, completion }
