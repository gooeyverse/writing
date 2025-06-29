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

interface FeedbackRequest {
  text: string;
  agent: Agent;
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
    const { text, agent }: FeedbackRequest = await req.json()

    if (!text || !agent) {
      return new Response(
        JSON.stringify({ error: 'Missing text or agent data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the feedback prompt
    const prompt = buildFeedbackPrompt(text, agent)

    // Call OpenAI API with parameters optimized for concise responses
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt.systemMessage
          },
          {
            role: 'user',
            content: prompt.userMessage
          }
        ],
        max_tokens: Math.min(400, Math.max(150, Math.ceil(text.length * 0.8))), // Reduced max tokens for shorter responses
        temperature: 0.7, // Slightly lower for more focused responses
        presence_penalty: 0.2,
        frequency_penalty: 0.3 // Higher to avoid repetition and encourage conciseness
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const openaiData = await openaiResponse.json()
    const feedback = openaiData.choices[0]?.message?.content?.trim()

    if (!feedback) {
      throw new Error('No feedback from OpenAI')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        feedback,
        agent: agent.name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in openai-feedback function:', error)
    
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

function buildFeedbackPrompt(text: string, agent: Agent): { systemMessage: string; userMessage: string } {
  let systemMessage = `You are ${agent.name}, a writing feedback specialist with the following characteristics:

PERSONALITY: ${agent.personality}
EXPERTISE: ${agent.writingStyle}`

  // Add custom instructions if available
  if (agent.customInstructions) {
    systemMessage += `\n\nSPECIAL INSTRUCTIONS: ${agent.customInstructions}`
  }

  // Include training data preferences if available
  if (agent.trainingData?.preferences) {
    const prefs = agent.trainingData.preferences
    systemMessage += `\n\nYOUR WRITING PREFERENCES:
- You prefer ${prefs.formality} writing
- You like content that is ${prefs.length}
- You favor ${prefs.voice} voice`
    
    if (prefs.tone) {
      systemMessage += `\n- You appreciate a ${prefs.tone} tone`
    }
  }

  // Include training samples if available (up to 1 most recent for context to keep prompt shorter)
  if (agent.trainingData?.samples && agent.trainingData.samples.length > 0) {
    const recentSample = agent.trainingData.samples
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())[0]

    systemMessage += `\n\nWRITING EXAMPLE YOU'VE LEARNED FROM:
"${recentSample.text}"`
    if (recentSample.notes) {
      systemMessage += `\nWhat makes this effective: ${recentSample.notes}`
    }
  }

  // Define concise feedback approach based on personality
  let feedbackApproach = ''
  
  switch (agent.personality) {
    case 'Professional and polished':
      feedbackApproach = `Give brief, professional feedback. Focus on 2-3 key observations about clarity, structure, and tone. Be direct and actionable.`
      break
      
    case 'Casual and approachable':
      feedbackApproach = `Give friendly, concise feedback. Point out what works well and 1-2 main areas to improve. Keep it encouraging and conversational.`
      break
      
    case 'Casual and concise':
      feedbackApproach = `Give very brief, direct feedback. Focus on the most important point that will make the biggest difference. Be honest and practical.`
      break
      
    case 'Confident and compelling':
      feedbackApproach = `Give bold, focused feedback. Identify what's powerful and what needs more impact. Be direct about the main improvement needed.`
      break
      
    case 'Scholarly and methodical':
      feedbackApproach = `Give concise, analytical feedback. Focus on the most important structural or logical issue. Be precise but brief.`
      break
      
    case 'Imaginative and expressive':
      feedbackApproach = `Give creative, brief feedback. Focus on emotional impact and one key way to enhance the artistic expression.`
      break
      
    case 'Precise and logical':
      feedbackApproach = `Give clear, systematic feedback in 2-3 sentences. Focus on the main clarity or structure issue.`
      break

    case 'Authentic and introspective':
      feedbackApproach = `Give honest, brief feedback about the authentic voice. Focus on what feels genuine and one way to strengthen it.`
      break

    case 'Darkly humorous and philosophical':
      feedbackApproach = `Give witty, concise feedback with philosophical insight. Make one key observation with your characteristic humor.`
      break

    case 'Self-deprecating and observational':
      feedbackApproach = `Give brief feedback with humor and keen observation. Focus on one main way to add personality or insight.`
      break
      
    default:
      feedbackApproach = `Give natural, brief feedback. Focus on 1-2 key observations that will be most helpful.`
  }

  systemMessage += `\n\n${feedbackApproach}

CRITICAL REQUIREMENTS:
- Keep your response SHORT and CONCISE (2-4 sentences maximum)
- Focus on only the MOST IMPORTANT feedback point
- Be direct and actionable
- Don't use bullet points or long explanations
- Get straight to the point
- Make every word count
- If the text is good, say so briefly and suggest one small improvement
- If it needs work, identify the main issue and how to fix it
- Write naturally but keep it tight and focused`

  const userMessage = `Quick feedback on this text:\n\n"${text}"`

  return { systemMessage, userMessage }
}