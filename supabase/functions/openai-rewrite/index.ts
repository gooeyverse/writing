import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface RewriteRequest {
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
    const { text, agent }: RewriteRequest = await req.json()

    if (!text || !agent) {
      return new Response(
        JSON.stringify({ error: 'Missing text or agent data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the prompt
    const prompt = buildPrompt(text, agent)

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
        max_tokens: Math.max(500, Math.ceil(text.length * 1.5)),
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
    const rewrittenText = openaiData.choices[0]?.message?.content?.trim()

    if (!rewrittenText) {
      throw new Error('No response from OpenAI')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rewrittenText,
        agent: agent.name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in openai-rewrite function:', error)
    
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

function buildPrompt(text: string, agent: Agent): { systemMessage: string; userMessage: string } {
  let systemMessage = `You are ${agent.name}, a writing assistant with the following characteristics:

PERSONALITY: ${agent.personality}
WRITING STYLE: ${agent.writingStyle}`

  // Add custom instructions if available
  if (agent.customInstructions) {
    systemMessage += `\n\nSPECIAL INSTRUCTIONS: ${agent.customInstructions}`
  }

  // Include training data preferences if available
  if (agent.trainingData?.preferences) {
    const prefs = agent.trainingData.preferences
    systemMessage += `\n\nSTYLE PREFERENCES:
- Formality: ${prefs.formality}
- Length: ${prefs.length}
- Voice: ${prefs.voice}`
    
    if (prefs.tone) {
      systemMessage += `\n- Tone: ${prefs.tone}`
    }
  }

  // Include training samples if available (up to 3 most recent)
  if (agent.trainingData?.samples && agent.trainingData.samples.length > 0) {
    const recentSamples = agent.trainingData.samples
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 3)

    systemMessage += `\n\nWRITING EXAMPLES TO LEARN FROM:`
    recentSamples.forEach((sample, index) => {
      systemMessage += `\n\nExample ${index + 1}${sample.title ? ` (${sample.title})` : ''}:
"${sample.text}"`
      if (sample.notes) {
        systemMessage += `\nNotes: ${sample.notes}`
      }
    })
  }

  systemMessage += `\n\nYour task is to rewrite the provided text while maintaining its core meaning but adapting it to match your personality, writing style, and preferences. Do not add explanations or meta-commentary - just provide the rewritten text.`

  const userMessage = `Please rewrite this text:\n\n"${text}"`

  return { systemMessage, userMessage }
}