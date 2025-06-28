import { supabase } from '../lib/supabase';
import { Agent } from '../types';

export class TextRewriter {
  static async rewrite(text: string, agent: Agent): Promise<string> {
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('openai-rewrite', {
        body: {
          text,
          agent
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Rewrite failed: ${error.message}`);
      }

      if (!data?.success || !data?.rewrittenText) {
        throw new Error('Invalid response from rewrite service');
      }

      return data.rewrittenText;
    } catch (error) {
      console.error('Rewriting failed:', error);
      
      // Fallback to mock rewriting on error
      console.warn('Using fallback rewriting due to error');
      return this.fallbackRewrite(text, agent);
    }
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