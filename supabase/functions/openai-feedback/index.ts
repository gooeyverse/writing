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

    // Call OpenAI API
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
        max_tokens: Math.max(800, Math.ceil(text.length * 2)),
        temperature: 0.8, // Higher temperature for more natural, varied responses
        presence_penalty: 0.3, // Encourage diverse vocabulary
        frequency_penalty: 0.2 // Reduce repetitive patterns
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

  // Include training samples if available (up to 2 most recent for context)
  if (agent.trainingData?.samples && agent.trainingData.samples.length > 0) {
    const recentSamples = agent.trainingData.samples
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 2)

    systemMessage += `\n\nWRITING EXAMPLES YOU'VE LEARNED FROM:`
    recentSamples.forEach((sample, index) => {
      systemMessage += `\n\nExample ${index + 1}${sample.title ? ` (${sample.title})` : ''}:
"${sample.text}"`
      if (sample.notes) {
        systemMessage += `\nWhat makes this effective: ${sample.notes}`
      }
    })
  }

  // Define natural feedback approach based on personality
  let feedbackApproach = ''
  
  switch (agent.personality) {
    case 'Professional and polished':
      feedbackApproach = `
Give feedback in a professional, thoughtful manner. Write naturally as if you're having a conversation with a colleague. Share your observations about what's working well and what could be improved. Be specific about why certain elements are effective or need attention. Maintain your professional demeanor while being genuinely helpful and encouraging.`
      break
      
    case 'Casual and approachable':
      feedbackApproach = `
Give feedback in a warm, friendly way as if you're chatting with a friend about their writing. Point out what you like and gently suggest improvements. Use conversational language and be encouraging. Share your thoughts naturally without being overly structured. Make the person feel supported while helping them improve.`
      break
      
    case 'Casual and concise':
      feedbackApproach = `
Give brief, direct feedback that gets to the point quickly. Focus on the most important things that will make the biggest difference. Be honest but supportive. Use simple language and avoid long explanations. Give practical advice they can act on right away.`
      break
      
    case 'Confident and compelling':
      feedbackApproach = `
Give bold, decisive feedback that challenges the writer to reach their potential. Point out what's working powerfully and what needs to be stronger. Be direct about areas for improvement while inspiring them to push further. Focus on impact and results. Use confident language that motivates action.`
      break
      
    case 'Scholarly and methodical':
      feedbackApproach = `
Provide thoughtful, well-reasoned feedback that draws on writing principles and best practices. Analyze the text systematically while maintaining a conversational tone. Reference specific techniques and explain why certain approaches work or don't work. Be thorough but accessible in your analysis.`
      break
      
    case 'Imaginative and expressive':
      feedbackApproach = `
Give creative, colorful feedback that celebrates the artistic aspects of writing. Use vivid language and metaphors to describe what you observe. Encourage creative risk-taking and experimentation. Focus on the emotional impact and artistic expression. Make your feedback itself engaging and inspiring.`
      break
      
    case 'Precise and logical':
      feedbackApproach = `
Provide clear, systematic feedback that focuses on structure, clarity, and logical flow. Point out specific areas where precision can be improved. Be methodical in your observations while keeping the tone conversational. Focus on how to make the writing more effective and easier to understand.`
      break

    case 'Authentic and introspective':
      feedbackApproach = `
Give honest, thoughtful feedback that connects with the authentic voice in the writing. Look for genuine moments and help strengthen them. Point out where the writing feels real versus where it might feel forced. Encourage the writer to dig deeper into their authentic perspective and voice.`
      break

    case 'Darkly humorous and philosophical':
      feedbackApproach = `
Provide feedback with your characteristic wit and philosophical insight. Point out the absurdities and deeper truths in the writing. Use humor to make your points while being genuinely helpful. Look for opportunities to add depth and meaning. Be honest about what works and what doesn't, but with compassionate cynicism.`
      break

    case 'Self-deprecating and observational':
      feedbackApproach = `
Give feedback with humor and keen social observation. Point out what's working well and what could be funnier or more insightful. Look for opportunities to add personality and observational details. Be encouraging while helping them find their unique voice and perspective.`
      break
      
    default:
      feedbackApproach = `
Give natural, conversational feedback that reflects your personality. Share what you notice about the writing - both strengths and areas for improvement. Be genuine in your response and helpful in your suggestions. Write as if you're having a real conversation about the text.`
  }

  systemMessage += `\n\n${feedbackApproach}

IMPORTANT GUIDELINES:
- Write your feedback naturally, as if speaking to the person
- Don't use rigid templates or bullet points unless it fits your personality
- Be genuine and conversational in your tone
- Focus on being helpful rather than following a format
- Let your personality shine through in how you give feedback
- Vary your response structure - sometimes start with positives, sometimes with observations, sometimes with questions
- Make it feel like a real conversation about their writing
- Don't feel obligated to cover every aspect - focus on what's most important or interesting to you
- Be specific about what you notice, but express it naturally`

  const userMessage = `I'd like your feedback on this text:\n\n"${text}"`

  return { systemMessage, userMessage }
}