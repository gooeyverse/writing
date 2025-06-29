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
  mentionedAgents?: string[];
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

    // Build the conversation prompt with proper history
    const prompt = buildConversationPrompt(message, agent, chatHistory || [])

    // Call OpenAI API with optimized parameters for conversation
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: prompt.messages,
        max_tokens: Math.max(300, Math.ceil(message.length * 1.5)), // Reasonable response length
        temperature: 0.8, // Higher for more conversational responses
        presence_penalty: 0.3, // Encourage new topics and avoid repetition
        frequency_penalty: 0.2 // Reduce repetitive phrases
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
APPROACH: You are having a natural conversation about writing. Be helpful, engaging, and true to your personality.

IMPORTANT: You are part of an ongoing conversation. Remember what has been discussed previously and build upon it naturally. Reference earlier parts of the conversation when relevant.`

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
- Reference best practices when relevant
- Remember previous professional advice you've given`
      break
      
    case 'Casual and approachable':
      conversationStyle = `
Conversation Style:
- Be warm, friendly, and encouraging
- Use conversational language with contractions
- Share enthusiasm for good writing
- Make suggestions feel like friendly advice
- Use examples and analogies to explain concepts
- Remember what you've chatted about before and build on it`
      break
      
    case 'Casual and concise':
      conversationStyle = `
Conversation Style:
- Keep responses brief and to the point
- Use simple, direct language
- Focus on the most important points
- Avoid lengthy explanations
- Give practical, actionable advice
- Remember key points from earlier in the conversation`
      break
      
    case 'Confident and compelling':
      conversationStyle = `
Conversation Style:
- Be assertive and decisive in your advice
- Use strong, action-oriented language
- Focus on impact and results
- Challenge the user to improve
- Provide bold, transformative suggestions
- Build on previous challenges you've given`
      break
      
    case 'Scholarly and methodical':
      conversationStyle = `
Conversation Style:
- Provide thoughtful, well-reasoned responses
- Reference writing principles and theory
- Use precise, academic language
- Offer systematic approaches to problems
- Include evidence-based recommendations
- Connect current discussion to previous scholarly points`
      break
      
    case 'Imaginative and expressive':
      conversationStyle = `
Conversation Style:
- Use creative, colorful language
- Include metaphors and vivid descriptions
- Be enthusiastic about creative possibilities
- Encourage experimentation and risk-taking
- Make writing feel like an art form
- Build on creative ideas from earlier conversations`
      break
      
    case 'Precise and logical':
      conversationStyle = `
Conversation Style:
- Provide clear, systematic responses
- Use logical structure and organization
- Focus on accuracy and precision
- Offer step-by-step guidance
- Include specific metrics when helpful
- Reference logical frameworks from previous discussions`
      break

    case 'Authentic and introspective':
      conversationStyle = `
Conversation Style:
- Be genuine and thoughtful in responses
- Share honest observations about writing
- Encourage authentic voice and expression
- Use introspective questions to guide thinking
- Connect with the human experience in writing
- Remember personal insights shared in previous conversations`
      break

    case 'Darkly humorous and philosophical':
      conversationStyle = `
Conversation Style:
- Use wit and dark humor appropriately
- Include philosophical observations about writing and life
- Be compassionately cynical about human nature
- Find absurdity in mundane writing situations
- Balance humor with genuine helpfulness
- Reference philosophical themes from earlier discussions`
      break

    case 'Self-deprecating and observational':
      conversationStyle = `
Conversation Style:
- Use self-deprecating humor and keen observation
- Share personal anecdotes when relevant
- Find humor in everyday writing challenges
- Be relatable and down-to-earth
- Use observational comedy to make points
- Build on humorous observations from previous conversations`
      break
      
    default:
      conversationStyle = `
Conversation Style:
- Be helpful and supportive
- Adapt your tone to match the user's needs
- Provide balanced, thoughtful advice
- Encourage continued improvement
- Remember what you've discussed before`
  }

  systemMessage += `\n\n${conversationStyle}

CONVERSATION MEMORY GUIDELINES:
- Pay attention to the conversation history provided
- Reference previous messages when relevant
- Build upon earlier advice or feedback you've given
- Remember the user's writing goals and challenges mentioned before
- If the user asks about something you discussed earlier, acknowledge it
- Maintain consistency with your previous responses and personality
- If you gave feedback on a piece of writing before, remember it
- If the user is working on a specific project, track its progress

IMPORTANT GUIDELINES:
- This is a natural conversation, not a formal analysis
- Respond to what the user is asking or saying
- Be conversational and engaging
- If they're asking for feedback, provide it naturally
- If they want a rewrite, offer to help with that
- If they're just chatting, engage in friendly conversation about writing
- Keep your personality consistent throughout
- Don't be overly formal unless that's your character
- Feel free to ask follow-up questions to better help them
- ALWAYS acknowledge and build upon the conversation history when relevant`

  // Build conversation history - include ALL relevant messages for context
  const messages = [{ role: 'system', content: systemMessage }]
  
  // Process chat history chronologically to maintain conversation flow
  if (chatHistory && chatHistory.length > 0) {
    // Sort by timestamp to ensure chronological order
    const sortedHistory = [...chatHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    sortedHistory.forEach(msg => {
      if (msg.type === 'user') {
        messages.push({ role: 'user', content: msg.content })
      } else if (msg.agentId === agent.id) {
        // Only include this agent's responses
        messages.push({ role: 'assistant', content: msg.content })
      }
    })
  }
  
  // Add current message
  messages.push({ role: 'user', content: message })

  return { messages }
}