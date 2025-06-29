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
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
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
EXPERTISE: ${agent.writingStyle}
APPROACH: Provide constructive feedback and analysis rather than rewriting`

  // Add custom instructions if available
  if (agent.customInstructions) {
    systemMessage += `\n\nSPECIAL INSTRUCTIONS: ${agent.customInstructions}`
  }

  // Include training data preferences if available
  if (agent.trainingData?.preferences) {
    const prefs = agent.trainingData.preferences
    systemMessage += `\n\nFEEDBACK FOCUS AREAS:
- Formality level: ${prefs.formality}
- Content length: ${prefs.length}
- Voice preference: ${prefs.voice}`
    
    if (prefs.tone) {
      systemMessage += `\n- Desired tone: ${prefs.tone}`
    }
  }

  // Include training samples if available (up to 2 most recent for context)
  if (agent.trainingData?.samples && agent.trainingData.samples.length > 0) {
    const recentSamples = agent.trainingData.samples
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 2)

    systemMessage += `\n\nWRITING STYLE EXAMPLES TO REFERENCE:`
    recentSamples.forEach((sample, index) => {
      systemMessage += `\n\nExample ${index + 1}${sample.title ? ` (${sample.title})` : ''}:
"${sample.text}"`
      if (sample.notes) {
        systemMessage += `\nStyle Notes: ${sample.notes}`
      }
    })
  }

  // Define feedback structure based on personality
  let feedbackStructure = ''
  
  switch (agent.personality) {
    case 'Professional and polished':
      feedbackStructure = `
Provide feedback in this professional format:
**Professional Analysis:**
- Structure & Clarity assessment
- Tone evaluation  
- Specific recommendations (3-4 bullet points)
- Overall professional assessment`
      break
      
    case 'Casual and approachable':
      feedbackStructure = `
Provide feedback in a friendly, conversational tone:
- Start with a warm greeting
- Comment on readability and tone
- Share what's working well
- Offer helpful suggestions in a supportive way
- End with encouragement`
      break
      
    case 'Casual and concise':
      feedbackStructure = `
Provide brief, direct feedback:
- Keep it short and simple
- Use bullet points
- Focus on the most important issues
- Give clear, actionable advice
- End with a simple bottom-line assessment`
      break
      
    case 'Confident and compelling':
      feedbackStructure = `
Provide powerful, action-oriented feedback:
- Assess impact and persuasion strength
- Identify power elements (or lack thereof)
- Give bold recommendations for improvement
- Focus on call-to-action effectiveness
- End with a compelling verdict`
      break
      
    case 'Scholarly and methodical':
      feedbackStructure = `
Provide academic-style analysis:
- Structural evaluation with metrics
- Evidence and methodology assessment
- Logical flow analysis
- Scholarly recommendations
- Academic conclusion with rating`
      break
      
    case 'Imaginative and expressive':
      feedbackStructure = `
Provide creative, artistic feedback:
- Comment on imagery and emotional resonance
- Assess sensory elements and creativity
- Suggest ways to enhance artistic expression
- Use metaphorical language in your feedback
- End with inspiring encouragement`
      break
      
    case 'Precise and logical':
      feedbackStructure = `
Provide technical, systematic feedback:
- Include metrics and measurements
- Assess logical structure and precision
- Identify errors or ambiguities
- Give optimization recommendations
- Provide system status and next steps`
      break
      
    default:
      feedbackStructure = `
Provide balanced, helpful feedback covering:
- Overall structure and clarity
- Strengths and areas for improvement
- Specific suggestions
- Encouraging conclusion`
  }

  systemMessage += `\n\n${feedbackStructure}

IMPORTANT: 
- Analyze and provide feedback on the text, do NOT rewrite it
- Be constructive and specific in your feedback
- Match your personality and expertise in your response style
- Focus on helping the writer improve their own work
- Keep feedback length appropriate (detailed but not overwhelming)`

  const userMessage = `Please analyze this text and provide feedback:\n\n"${text}"`

  return { systemMessage, userMessage }
}