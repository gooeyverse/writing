import { openai } from '../lib/openai';
import { Agent } from '../types';

export class TextRewriter {
  static async rewrite(text: string, agent: Agent): Promise<string> {
    // Fallback to mock rewriting if OpenAI is not configured
    if (!openai) {
      console.warn('OpenAI not configured, using fallback rewriting');
      return this.fallbackRewrite(text, agent);
    }

    try {
      const prompt = this.buildPrompt(text, agent);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using the more cost-effective model
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
        max_tokens: Math.max(500, Math.ceil(text.length * 1.5)), // Dynamic token limit
        temperature: 0.7, // Balanced creativity
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const rewrittenText = response.choices[0]?.message?.content?.trim();
      
      if (!rewrittenText) {
        throw new Error('No response from OpenAI');
      }

      return rewrittenText;
    } catch (error) {
      console.error('OpenAI rewriting failed:', error);
      // Fallback to mock rewriting on error
      return this.fallbackRewrite(text, agent);
    }
  }

  private static buildPrompt(text: string, agent: Agent): { systemMessage: string; userMessage: string } {
    let systemMessage = `You are ${agent.name}, a writing assistant with the following characteristics:

PERSONALITY: ${agent.personality}
WRITING STYLE: ${agent.writingStyle}`;

    // Add custom instructions if available
    if (agent.customInstructions) {
      systemMessage += `\n\nSPECIAL INSTRUCTIONS: ${agent.customInstructions}`;
    }

    // Include training data preferences if available
    if (agent.trainingData?.preferences) {
      const prefs = agent.trainingData.preferences;
      systemMessage += `\n\nSTYLE PREFERENCES:
- Formality: ${prefs.formality}
- Length: ${prefs.length}
- Voice: ${prefs.voice}`;
      
      if (prefs.tone) {
        systemMessage += `\n- Tone: ${prefs.tone}`;
      }
    }

    // Include training samples if available (up to 3 most recent)
    if (agent.trainingData?.samples && agent.trainingData.samples.length > 0) {
      const recentSamples = agent.trainingData.samples
        .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
        .slice(0, 3);

      systemMessage += `\n\nWRITING EXAMPLES TO LEARN FROM:`;
      recentSamples.forEach((sample, index) => {
        systemMessage += `\n\nExample ${index + 1}${sample.title ? ` (${sample.title})` : ''}:
"${sample.text}"`;
        if (sample.notes) {
          systemMessage += `\nNotes: ${sample.notes}`;
        }
      });
    }

    systemMessage += `\n\nYour task is to rewrite the provided text while maintaining its core meaning but adapting it to match your personality, writing style, and preferences. Do not add explanations or meta-commentary - just provide the rewritten text.`;

    const userMessage = `Please rewrite this text:\n\n"${text}"`;

    return { systemMessage, userMessage };
  }

  // Fallback rewriting method (original logic)
  private static fallbackRewrite(text: string, agent: Agent): string {
    let result = text;
    
    // Apply personality-based transforms
    const transforms = this.personalityTransforms[agent.personality] || [];
    result = this.applyTransforms(result, transforms);
    
    // Apply style-specific modifications
    result = this.addStyleSpecificPhrases(result, agent);

    return result;
  }

  private static personalityTransforms: Record<string, Array<{ pattern: RegExp; replacement: string }>> = {
    'Professional and polished': [
      { pattern: /\bI think\b/gi, replacement: 'I believe' },
      { pattern: /\bI guess\b/gi, replacement: 'I estimate' },
      { pattern: /\bkind of\b/gi, replacement: 'somewhat' },
      { pattern: /\bsort of\b/gi, replacement: 'rather' },
      { pattern: /\bretty\b/gi, replacement: 'quite' },
      { pattern: /\bgonna\b/gi, replacement: 'going to' },
      { pattern: /\bwanna\b/gi, replacement: 'want to' },
      { pattern: /\bcan't\b/gi, replacement: 'cannot' },
      { pattern: /\bwon't\b/gi, replacement: 'will not' },
    ],
    'Casual and approachable': [
      { pattern: /\btherefore\b/gi, replacement: 'so' },
      { pattern: /\bconsequently\b/gi, replacement: 'so' },
      { pattern: /\bfurthermore\b/gi, replacement: 'also' },
      { pattern: /\bmoreover\b/gi, replacement: 'plus' },
      { pattern: /\butilize\b/gi, replacement: 'use' },
      { pattern: /\bassist\b/gi, replacement: 'help' },
      { pattern: /\bcommence\b/gi, replacement: 'start' },
      { pattern: /\bterminate\b/gi, replacement: 'end' },
    ],
    'Confident and compelling': [
      { pattern: /\bI think you should\b/gi, replacement: 'You need to' },
      { pattern: /\bmaybe\b/gi, replacement: 'definitely' },
      { pattern: /\bmight want to\b/gi, replacement: 'should' },
      { pattern: /\bcould help\b/gi, replacement: 'will transform' },
      { pattern: /\bgood\b/gi, replacement: 'excellent' },
      { pattern: /\bnice\b/gi, replacement: 'outstanding' },
      { pattern: /\bokay\b/gi, replacement: 'perfect' },
    ],
    'Scholarly and methodical': [
      { pattern: /\bI think\b/gi, replacement: 'It is postulated that' },
      { pattern: /\bshow\b/gi, replacement: 'demonstrate' },
      { pattern: /\bprove\b/gi, replacement: 'substantiate' },
      { pattern: /\buse\b/gi, replacement: 'utilize' },
      { pattern: /\bhelp\b/gi, replacement: 'facilitate' },
      { pattern: /\bbig\b/gi, replacement: 'significant' },
      { pattern: /\bsmall\b/gi, replacement: 'minimal' },
    ],
    'Imaginative and expressive': [
      { pattern: /\bsaid\b/gi, replacement: 'whispered' },
      { pattern: /\bwalked\b/gi, replacement: 'wandered' },
      { pattern: /\blooked\b/gi, replacement: 'gazed' },
      { pattern: /\bbig\b/gi, replacement: 'enormous' },
      { pattern: /\bsmall\b/gi, replacement: 'tiny' },
      { pattern: /\bgood\b/gi, replacement: 'wonderful' },
      { pattern: /\bbad\b/gi, replacement: 'terrible' },
    ],
    'Precise and logical': [
      { pattern: /\bI think\b/gi, replacement: 'Analysis indicates' },
      { pattern: /\bhelp\b/gi, replacement: 'optimize' },
      { pattern: /\buse\b/gi, replacement: 'implement' },
      { pattern: /\bmake\b/gi, replacement: 'generate' },
      { pattern: /\bcheck\b/gi, replacement: 'validate' },
      { pattern: /\bfix\b/gi, replacement: 'resolve' },
      { pattern: /\bbreak\b/gi, replacement: 'malfunction' },
    ]
  };

  private static applyTransforms(text: string, transforms: Array<{ pattern: RegExp; replacement: string }>): string {
    return transforms.reduce((acc, transform) => {
      return acc.replace(transform.pattern, transform.replacement);
    }, text);
  }

  private static addStyleSpecificPhrases(text: string, agent: Agent): string {
    const sentences = text.split('. ');
    
    // Apply modifications based on personality
    switch (agent.personality) {
      case 'Professional and polished':
        return sentences.map(s => s.trim()).join('. ').replace(/\.$/, '') + '.';
      case 'Casual and approachable':
        return sentences.map(s => s.trim()).join('. ') + ' Hope this helps!';
      case 'Confident and compelling':
        return sentences.map(s => s.trim()).join('. ') + ' Take action today!';
      case 'Scholarly and methodical':
        return 'Based on current research, ' + sentences.map(s => s.trim()).join('. ') + ' Further investigation is warranted.';
      case 'Imaginative and expressive':
        return sentences.map(s => s.trim()).join('. ') + '...';
      case 'Precise and logical':
        return sentences.map(s => s.trim()).join('. ') + ' Implementation details follow standard protocols.';
      default:
        return text;
    }
  }
}