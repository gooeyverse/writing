import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Agent {
  id: string;
  name: string;
  personality: string;
  writingStyle: string;
  customInstructions?: string;
  trainingData?: {
    samples: Array<{
      id: string;
      text: string;
      title?: string;
      notes?: string;
      addedAt: string;
    }>;
    preferences: {
      tone: string;
      formality: 'formal' | 'casual' | 'mixed';
      length: 'concise' | 'detailed' | 'balanced';
      voice: 'active' | 'passive' | 'mixed';
    };
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: string;
  agentId?: string;
  responseType?: string;
}

interface ConversationRequest {
  message: string;
  agent: Agent;
  chatHistory: ChatMessage[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Parse request body
    const { message, agent, chatHistory }: ConversationRequest = await req.json()

    if (!message || !agent) {
      return new Response(
        JSON.stringify({ error: 'Missing message or agent data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the conversation prompt
    const prompt = buildConversationPrompt(message, agent, chatHistory || [])

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: prompt.messages,
        max_tokens: Math.max(600, Math.ceil(message.length * 2)),
        temperature: 0.8,
        presence_penalty: 0.2,
        frequency_penalty: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const openaiData = await openaiResponse.json()
    const response = openaiData.choices[0]?.message?.content?.trim()

    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        response,
        agent: agent.name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in openai-conversation function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function buildConversationPrompt(message: string, agent: Agent, chatHistory: ChatMessage[]): { messages: any[] } {
  let systemMessage = `You are ${agent.name}, a writing assistant with the following characteristics:

PERSONALITY: ${agent.personality}
EXPERTISE: ${agent.writingStyle}
APPROACH: You are having a natural conversation about writing. Be helpful, engaging, and true to your personality.`

  // Add custom instructions if available
  if (agent.customInstructions) {
    systemMessage += `\n\nSPECIAL INSTRUCTIONS: ${agent.customInstructions}`
  }

  // Include training data preferences if available
  if (agent.trainingData?.preferences) {
    const prefs = agent.trainingData.preferences
    systemMessage += `\n\nYOUR WRITING PREFERENCES:
- Formality level: ${prefs.formality}
- Content length: ${prefs.length}
- Voice preference: ${prefs.voice}`
    
    if (prefs.tone) {
      systemMessage += `\n- Preferred tone: ${prefs.tone}`
    }
  }

  // Include training samples if available (up to 2 most recent for context)
  if (agent.trainingData?.samples && agent.trainingData.samples.length > 0) {
    const recentSamples = agent.trainingData.samples
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 2)

    systemMessage += `\n\nWRITING STYLE EXAMPLES YOU'VE LEARNED FROM:`
    recentSamples.forEach((sample, index) => {
      systemMessage += `\n\nExample ${index + 1}${sample.title ? ` (${sample.title})` : ''}:
"${sample.text}"`
      if (sample.notes) {
        systemMessage += `\nStyle Notes: ${sample.notes}`
      }
    })
  }

  // Define conversation style based on personality
  let conversationStyle = ''
  
  switch (agent.personality) {
    case 'Professional and polished':
      conversationStyle = `
Conversation Style:
- Maintain professional demeanor while being helpful
- Provide structured, well-organized responses
- Use formal language but remain approachable
- Offer specific, actionable advice
- Reference best practices when relevant`
      break
      
    case 'Casual and approachable':
      conversationStyle = `
Conversation Style:
- Be warm, friendly, and encouraging
- Use conversational language with contractions
- Share enthusiasm for good writing
- Make suggestions feel like friendly advice
- Use examples and analogies to explain concepts`
      break
      
    case 'Casual and concise':
      conversationStyle = `
Conversation Style:
- Keep responses brief and to the point
- Use simple, direct language
- Focus on the most important points
- Avoid lengthy explanations
- Give practical, actionable advice`
      break
      
    case 'Confident and compelling':
      conversationStyle = `
Conversation Style:
- Be assertive and decisive in your advice
- Use strong, action-oriented language
- Focus on impact and results
- Challenge the user to improve
- Provide bold, transformative suggestions`
      break
      
    case 'Scholarly and methodical':
      conversationStyle = `
Conversation Style:
- Provide thoughtful, well-reasoned responses
- Reference writing principles and theory
- Use precise, academic language
- Offer systematic approaches to problems
- Include evidence-based recommendations`
      break
      
    case 'Imaginative and expressive':
      conversationStyle = `
Conversation Style:
- Use creative, colorful language
- Include metaphors and vivid descriptions
- Be enthusiastic about creative possibilities
- Encourage experimentation and risk-taking
- Make writing feel like an art form`
      break
      
    case 'Precise and logical':
      conversationStyle = `
Conversation Style:
- Provide clear, systematic responses
- Use logical structure and organization
- Focus on accuracy and precision
- Offer step-by-step guidance
- Include specific metrics when helpful`
      break
      
    default:
      conversationStyle = `
Conversation Style:
- Be helpful and supportive
- Adapt your tone to match the user's needs
- Provide balanced, thoughtful advice
- Encourage continued improvement`
  }

  systemMessage += `\n\n${conversationStyle}

IMPORTANT GUIDELINES:
- This is a natural conversation, not a formal analysis
- Respond to what the user is asking or saying
- Be conversational and engaging
- If they're asking for feedback, provide it naturally
- If they want a rewrite, offer to help with that
- If they're just chatting, engage in friendly conversation about writing
- Keep your personality consistent throughout
- Don't be overly formal unless that's your character
- Feel free to ask follow-up questions to better help them`

  // Build conversation history
  const messages = [{ role: 'system', content: systemMessage }]
  
  // Add recent chat history for context (last 6 messages)
  const recentHistory = chatHistory.slice(-6)
  recentHistory.forEach(msg => {
    if (msg.type === 'user') {
      messages.push({ role: 'user', content: msg.content })
    } else if (msg.agentId === agent.id) {
      messages.push({ role: 'assistant', content: msg.content })
    }
  })
  
  // Add current message
  messages.push({ role: 'user', content: message })

  return { messages }
}