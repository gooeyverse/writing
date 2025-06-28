import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
}

export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage
}) : null;

// Test connection function
export const testOpenAIConnection = async () => {
  if (!openai) {
    return { 
      success: false, 
      message: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.' 
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 5
    });
    
    return { 
      success: true, 
      message: 'OpenAI connection successful!',
      model: response.model
    };
  } catch (error) {
    return { 
      success: false, 
      message: `OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};