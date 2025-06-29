import { supabase } from '../lib/supabase';
import { Agent, ChatMessage } from '../types';

export class TextRewriter {
  static async provideFeedback(text: string, agent: Agent): Promise<string> {
    try {
      // Call Supabase Edge Function for feedback
      const { data, error } = await supabase.functions.invoke('openai-feedback', {
        body: {
          text,
          agent
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Feedback failed: ${error.message}`);
      }

      if (!data?.success || !data?.feedback) {
        throw new Error('Invalid response from feedback service');
      }

      return data.feedback;
    } catch (error) {
      console.error('Feedback generation failed:', error);
      
      // Fallback to mock feedback on error
      console.warn('Using fallback feedback due to error');
      return this.fallbackFeedback(text, agent);
    }
  }

  static async rewrite(text: string, agent: Agent): Promise<string> {
    try {
      // Call Supabase Edge Function for rewriting
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
      console.error('Rewrite generation failed:', error);
      
      // Fallback to mock rewrite on error
      console.warn('Using fallback rewrite due to error');
      return this.fallbackRewrite(text, agent);
    }
  }

  static async provideConversationalResponse(
    message: string, 
    agent: Agent, 
    chatHistory: ChatMessage[]
  ): Promise<string> {
    try {
      // Call Supabase Edge Function for conversational response
      const { data, error } = await supabase.functions.invoke('openai-conversation', {
        body: {
          message,
          agent,
          chatHistory: chatHistory.slice(-6) // Send last 6 messages for context
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Conversation failed: ${error.message}`);
      }

      if (!data?.success || !data?.response) {
        throw new Error('Invalid response from conversation service');
      }

      return data.response;
    } catch (error) {
      console.error('Conversation generation failed:', error);
      
      // Fallback to mock conversation on error
      console.warn('Using fallback conversation due to error');
      return this.fallbackConversation(message, agent);
    }
  }

  // Fallback feedback method
  private static fallbackFeedback(text: string, agent: Agent): string {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = Math.round(wordCount / sentenceCount);
    
    // Generate feedback based on agent personality
    return this.generatePersonalityBasedFeedback(text, agent, {
      wordCount,
      sentenceCount,
      avgWordsPerSentence
    });
  }

  // Fallback rewrite method
  private static fallbackRewrite(text: string, agent: Agent): string {
    // Simple fallback rewrite based on agent personality
    switch (agent.personality) {
      case 'Professional and polished':
        return this.makeProfessional(text);
      case 'Casual and approachable':
        return this.makeCasual(text);
      case 'Casual and concise':
        return this.makeConcise(text);
      default:
        return `Here's a ${agent.personality.toLowerCase()} version:\n\n${text}`;
    }
  }

  // Fallback conversation method
  private static fallbackConversation(message: string, agent: Agent): string {
    const responses = {
      'Professional and polished': [
        "I understand your request. Let me provide some professional guidance on this matter.",
        "That's an excellent question. From a professional perspective, I'd recommend...",
        "I appreciate you bringing this to my attention. Here's my professional assessment..."
      ],
      'Casual and approachable': [
        "Great question! I'm happy to help you with that.",
        "Oh, I love talking about this stuff! Here's what I think...",
        "That's a really interesting point you've raised. Let me share my thoughts..."
      ],
      'Casual and concise': [
        "Got it. Here's the deal:",
        "Sure thing. Quick answer:",
        "Yep. Here's what I'd do:"
      ]
    };

    const agentResponses = responses[agent.personality as keyof typeof responses] || [
      "That's an interesting point. Let me help you with that.",
      "I see what you're getting at. Here's my take on it:",
      "Thanks for asking! Here's how I'd approach this:"
    ];

    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
    return `${randomResponse}\n\n(I'm currently in fallback mode - please check your connection for full AI responses)`;
  }

  // Helper methods for simple text transformations
  private static makeProfessional(text: string): string {
    return text
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bdon't\b/g, 'do not')
      .replace(/\bisn't\b/g, 'is not')
      .replace(/\bI think\b/g, 'I believe')
      .replace(/\bkinda\b/g, 'somewhat')
      .replace(/\bgonna\b/g, 'going to');
  }

  private static makeCasual(text: string): string {
    return text
      .replace(/\bcannot\b/g, "can't")
      .replace(/\bwill not\b/g, "won't")
      .replace(/\bdo not\b/g, "don't")
      .replace(/\bis not\b/g, "isn't")
      .replace(/\bI believe\b/g, 'I think')
      .replace(/\bsomewhat\b/g, 'kinda')
      .replace(/\bgoing to\b/g, 'gonna');
  }

  private static makeConcise(text: string): string {
    return text
      .replace(/\bin order to\b/g, 'to')
      .replace(/\bdue to the fact that\b/g, 'because')
      .replace(/\bat this point in time\b/g, 'now')
      .replace(/\bfor the purpose of\b/g, 'to')
      .split('. ')
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .slice(0, 3) // Keep only first 3 sentences for conciseness
      .join('. ') + (text.endsWith('.') ? '' : '.');
  }

  private static generatePersonalityBasedFeedback(
    text: string, 
    agent: Agent, 
    stats: { wordCount: number; sentenceCount: number; avgWordsPerSentence: number }
  ): string {
    const { wordCount, sentenceCount, avgWordsPerSentence } = stats;
    
    switch (agent.personality) {
      case 'Professional and polished':
        return `**Professional Analysis by ${agent.name}:**

**Structure & Clarity:** ${sentenceCount > 1 ? 'Good paragraph structure with multiple sentences.' : 'Consider expanding with additional supporting sentences.'} Average sentence length of ${avgWordsPerSentence} words ${avgWordsPerSentence > 20 ? 'may be too complex - consider breaking into shorter sentences' : 'is appropriate for professional communication'}.

**Tone Assessment:** ${this.assessTone(text, 'professional')}

**Recommendations:**
• ${this.hasContractions(text) ? 'Replace contractions with full forms for formal writing' : 'Formal language usage is appropriate'}
• ${this.hasPassiveVoice(text) ? 'Consider using more active voice for stronger impact' : 'Good use of active voice'}
• ${wordCount < 50 ? 'Consider adding more detail to strengthen your argument' : 'Length is appropriate for the message'}

**Overall:** ${this.getOverallAssessment(text, 'professional')}`;

      case 'Casual and approachable':
        return `**Friendly Feedback from ${agent.name}:**

Hey! I read through your text and here's what I think:

**Readability:** ${avgWordsPerSentence < 15 ? 'Great! Your sentences are easy to follow.' : 'Some sentences might be a bit long - try breaking them up for easier reading.'}

**Tone Check:** ${this.assessTone(text, 'casual')}

**What's working:**
• ${wordCount} words feels ${wordCount > 100 ? 'comprehensive' : wordCount > 50 ? 'just right' : 'concise'}
• ${this.hasPersonalPronouns(text) ? 'Nice personal touch with "I" and "you"' : 'Consider adding more personal connection'}

**Suggestions:**
• ${this.isTooFormal(text) ? 'You could make this more conversational - try using contractions like "don\'t" instead of "do not"' : 'The conversational tone works well!'}
• ${this.needsMoreWarmth(text) ? 'Maybe add a friendly greeting or closing?' : 'Good friendly vibe!'}

Hope this helps! 😊`;

      case 'Casual and concise':
        return `**Quick Feedback from ${agent.name}:**

**Length:** ${wordCount} words. ${wordCount > 75 ? 'Could be shorter.' : 'Good length.'}

**Sentences:** ${avgWordsPerSentence} words per sentence. ${avgWordsPerSentence > 15 ? 'Try shorter sentences.' : 'Good sentence length.'}

**What works:**
• ${this.hasSimpleWords(text) ? 'Easy words' : 'Some complex words - try simpler ones'}
• ${sentenceCount > 3 ? 'Good number of sentences' : 'Could use more sentences'}

**Fix:**
• ${this.hasJargon(text) ? 'Remove jargon' : 'Clear language'}
• ${this.isTooWordy(text) ? 'Cut extra words' : 'Good word choice'}
• ${this.needsBetterFlow(text) ? 'Connect ideas better' : 'Good flow'}

**Bottom line:** ${this.getSimpleAssessment(text)}`;

      default:
        return `**Feedback from ${agent.name}:**

I've reviewed your ${wordCount}-word text. Here are my observations:

**Structure:** ${sentenceCount} sentences with an average of ${avgWordsPerSentence} words each.

**Key Points:**
• ${this.getGeneralStrengths(text)}
• ${this.getGeneralWeaknesses(text)}
• ${this.getGeneralSuggestions(text)}

**Overall Assessment:** Your text communicates its message clearly. Consider the suggestions above to enhance its effectiveness.`;
    }
  }

  // Helper methods for feedback analysis (keeping existing methods)
  private static hasContractions(text: string): boolean {
    return /\b(can't|won't|don't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't)\b/i.test(text);
  }

  private static hasPassiveVoice(text: string): boolean {
    return /\b(was|were|is|are|been|being)\s+\w+ed\b/i.test(text);
  }

  private static hasPersonalPronouns(text: string): boolean {
    return /\b(I|you|we|us|our|your|my|me)\b/i.test(text);
  }

  private static isTooFormal(text: string): boolean {
    const formalWords = ['therefore', 'consequently', 'furthermore', 'moreover', 'utilize', 'commence'];
    return formalWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static needsMoreWarmth(text: string): boolean {
    const warmWords = ['thank', 'please', 'appreciate', 'welcome', 'glad', 'happy'];
    return !warmWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static hasSimpleWords(text: string): boolean {
    const complexWords = text.match(/\b\w{8,}\b/g) || [];
    return complexWords.length < text.split(/\s+/).length * 0.2;
  }

  private static hasJargon(text: string): boolean {
    const jargonWords = ['utilize', 'facilitate', 'implement', 'optimize', 'leverage', 'synergy'];
    return jargonWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static isTooWordy(text: string): boolean {
    const wordyPhrases = ['in order to', 'due to the fact that', 'at this point in time', 'for the purpose of'];
    return wordyPhrases.some(phrase => new RegExp(phrase, 'i').test(text));
  }

  private static needsBetterFlow(text: string): boolean {
    const transitions = ['however', 'therefore', 'also', 'furthermore', 'meanwhile', 'consequently'];
    return !transitions.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text)) && text.split('.').length > 2;
  }

  private static assessTone(text: string, targetTone: string): string {
    if (targetTone === 'professional') {
      return this.hasContractions(text) ? 
        'Contains informal contractions - consider formal alternatives' : 
        'Maintains appropriate professional tone';
    } else if (targetTone === 'casual') {
      return this.isTooFormal(text) ? 
        'Feels a bit formal - could be more conversational' : 
        'Nice friendly, approachable tone';
    }
    return 'Tone is appropriate for the context';
  }

  private static getOverallAssessment(text: string, style: string): string {
    const assessments = {
      professional: [
        'Strong professional communication that conveys authority and expertise.',
        'Well-structured content that meets business communication standards.',
        'Clear and professional - ready for executive review.'
      ],
      casual: [
        'Friendly and approachable - people will connect with this!',
        'Great conversational tone that feels natural and engaging.',
        'Perfect balance of casual and clear communication.'
      ]
    };
    
    const options = assessments[style as keyof typeof assessments] || ['Good overall communication.'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private static getSimpleAssessment(text: string): string {
    const assessments = [
      'Clear and direct. Good job.',
      'Easy to read. Works well.',
      'Gets the point across. Nice work.',
      'Simple and effective.'
    ];
    return assessments[Math.floor(Math.random() * assessments.length)];
  }

  private static getGeneralStrengths(text: string): string {
    const strengths = [];
    
    if (this.hasPersonalPronouns(text)) strengths.push('Personal and engaging tone');
    if (!this.hasJargon(text)) strengths.push('Clear and accessible language');
    if (!this.isTooWordy(text)) strengths.push('Concise communication');
    
    return strengths.length > 0 ? strengths[0] : 'Communicates the main message';
  }

  private static getGeneralWeaknesses(text: string): string {
    const weaknesses = [];
    
    if (this.hasJargon(text)) weaknesses.push('Contains technical jargon');
    if (this.isTooWordy(text)) weaknesses.push('Could be more concise');
    if (!this.hasPersonalPronouns(text)) weaknesses.push('Could be more personal');
    
    return weaknesses.length > 0 ? weaknesses[0] : 'Minor areas for improvement';
  }

  private static getGeneralSuggestions(text: string): string {
    const suggestions = [];
    
    if (text.split(/\s+/).length < 30) suggestions.push('Consider expanding with more detail');
    if (text.split(/\s+/).length > 200) suggestions.push('Consider condensing for better impact');
    
    return suggestions.length > 0 ? suggestions[0] : 'Continue refining based on your audience needs';
  }
}