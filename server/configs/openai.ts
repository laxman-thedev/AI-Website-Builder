// Creates an OpenAI client for prompt and code generation.
// Module: external integrations.
import OpenAI from 'openai';

// Connect to OpenRouter/OpenAI using the API key.
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.AI_API_KEY,
});

export default openai
