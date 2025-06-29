import { supabase } from '../lib/supabase';
import { Agent } from '../types';

export class TextRewriter {
  static async provideFeedback(text: string, agent: Agent): Promise<string> {
    try {
      // Call Supabase Edge Function for feedback instead of rewriting
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

  // Legacy method name for backward compatibility
  static async rewrite(text: string, agent: Agent): Promise<string> {
    return this.provideFeedback(text, agent);
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

      case 'Confident and compelling':
        return `**Power Analysis by ${agent.name}:**

**Impact Assessment:** ${this.assessImpact(text)}

**Persuasion Elements:**
• **Strength:** ${this.hasStrongVerbs(text) ? 'Good use of action words' : 'Needs stronger, more decisive language'}
• **Urgency:** ${this.hasUrgency(text) ? 'Creates appropriate sense of urgency' : 'Consider adding time-sensitive elements'}
• **Benefits:** ${this.highlightsBenefits(text) ? 'Clearly communicates value' : 'Focus more on what the reader gains'}

**Call to Action:** ${this.hasCallToAction(text) ? 'Strong directive - tells reader exactly what to do' : 'MISSING - Add a clear next step for your reader'}

**Confidence Level:** ${this.assessConfidence(text)}

**Power Moves:**
• Replace weak phrases like "I think" with "I know" or "Research shows"
• ${wordCount < 100 ? 'Add more compelling evidence to support your points' : 'Good depth of content'}
• End with a strong, specific action step

**Verdict:** ${this.getCompellingAssessment(text)} Transform this into a message that demands action!`;

      case 'Scholarly and methodical':
        return `**Academic Analysis by ${agent.name}:**

**Structural Evaluation:**
- **Word Count:** ${wordCount} words (${wordCount < 100 ? 'Consider expanding for thorough analysis' : wordCount > 300 ? 'Appropriate length for detailed examination' : 'Adequate scope'})
- **Sentence Complexity:** Average ${avgWordsPerSentence} words per sentence ${avgWordsPerSentence < 12 ? '(consider more complex constructions)' : '(appropriate complexity)'}

**Analytical Framework:**
${this.assessAcademicRigor(text)}

**Evidence and Support:**
• ${this.hasCitations(text) ? 'Includes supporting references' : 'Lacks scholarly citations - consider adding authoritative sources'}
• ${this.hasObjectiveTone(text) ? 'Maintains appropriate academic objectivity' : 'Contains subjective language - strive for neutral tone'}
• ${this.hasLogicalFlow(text) ? 'Demonstrates clear logical progression' : 'Argument structure requires strengthening'}

**Methodological Considerations:**
${this.assessMethodology(text)}

**Recommendations for Enhancement:**
1. ${this.needsMoreEvidence(text) ? 'Incorporate additional empirical support' : 'Evidence base is adequate'}
2. ${this.needsBetterTransitions(text) ? 'Strengthen transitional phrases between concepts' : 'Logical connections are clear'}
3. Consider implications for future research

**Scholarly Assessment:** ${this.getAcademicAssessment(text)}`;

      case 'Imaginative and expressive':
        return `**Creative Feedback from ${agent.name}:**

*Stepping into your words like entering a new world...*

**Imagery & Atmosphere:** ${this.assessImagery(text)}

**Emotional Resonance:**
Your text ${this.hasEmotionalDepth(text) ? 'pulses with feeling - I can sense the emotion behind each word' : 'feels a bit distant - try adding more heart, more personal connection'}

**Sensory Experience:**
• **Visual:** ${this.hasVisualElements(text) ? 'I can see it!' : 'Paint me a picture with your words'}
• **Sound:** ${this.hasRhythm(text) ? 'Nice rhythm and flow' : 'Try reading aloud - add some musical quality'}
• **Feel:** ${this.hasTactileElements(text) ? 'I can almost touch what you\'re describing' : 'Make it more tangible'}

**Story Elements:**
${this.assessNarrative(text)}

**Creative Spark:**
• ${wordCount < 75 ? 'Like a haiku - beautifully concise' : wordCount > 200 ? 'Rich and expansive like a flowing river' : 'Perfect length for impact'}
• ${this.hasMetaphors(text) ? 'Love the figurative language!' : 'Consider adding metaphors or comparisons'}
• ${this.hasUnexpectedElements(text) ? 'Delightful surprises in your phrasing' : 'Try adding an unexpected twist or unique perspective'}

**The Magic:** ${this.getCreativeAssessment(text)}

*Keep painting with words...* ✨`;

      case 'Precise and logical':
        return `**Technical Analysis by ${agent.name}:**

**Structural Metrics:**
- Lines of text: ${sentenceCount}
- Word density: ${wordCount} total words
- Average complexity: ${avgWordsPerSentence} words/sentence
- Readability index: ${this.calculateReadability(avgWordsPerSentence)}

**Logic Flow Assessment:**
\`\`\`
${this.assessLogicalStructure(text)}
\`\`\`

**Precision Audit:**
• **Ambiguity Level:** ${this.hasAmbiguousTerms(text) ? 'HIGH - Contains undefined terms' : 'LOW - Clear definitions'}
• **Specificity:** ${this.hasSpecificDetails(text) ? 'GOOD - Includes concrete details' : 'NEEDS IMPROVEMENT - Add measurable specifics'}
• **Consistency:** ${this.hasConsistentTerminology(text) ? 'PASS - Terminology usage is consistent' : 'FAIL - Inconsistent term usage detected'}

**Error Detection:**
${this.detectLogicalErrors(text)}

**Optimization Recommendations:**
1. ${this.needsMorePrecision(text) ? 'Replace vague terms with specific measurements' : 'Precision level acceptable'}
2. ${this.needsBetterStructure(text) ? 'Implement hierarchical information structure' : 'Structure is logically sound'}
3. ${this.needsValidation(text) ? 'Add verification steps or checkpoints' : 'Validation approach is adequate'}

**System Status:** ${this.getTechnicalAssessment(text)}
**Recommended Action:** ${this.getNextSteps(text)}`;

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

  // Helper methods for feedback analysis
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

  // Additional helper methods for other personality types
  private static assessImpact(text: string): string {
    return this.hasStrongVerbs(text) ? 
      'Strong impact - uses powerful action words' : 
      'Moderate impact - could use stronger language';
  }

  private static hasStrongVerbs(text: string): boolean {
    const strongVerbs = ['achieve', 'create', 'deliver', 'drive', 'execute', 'generate', 'launch', 'maximize', 'transform'];
    return strongVerbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(text));
  }

  private static hasUrgency(text: string): boolean {
    const urgencyWords = ['now', 'today', 'immediately', 'urgent', 'deadline', 'limited time', 'act fast'];
    return urgencyWords.some(word => new RegExp(word, 'i').test(text));
  }

  private static highlightsBenefits(text: string): boolean {
    const benefitWords = ['benefit', 'advantage', 'gain', 'improve', 'better', 'save', 'increase'];
    return benefitWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static hasCallToAction(text: string): boolean {
    const ctaWords = ['click', 'call', 'contact', 'visit', 'download', 'sign up', 'register', 'buy', 'order'];
    return ctaWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static assessConfidence(text: string): string {
    const weakPhrases = ['i think', 'maybe', 'perhaps', 'might', 'could be'];
    const hasWeakLanguage = weakPhrases.some(phrase => new RegExp(phrase, 'i').test(text));
    return hasWeakLanguage ? 'WEAK - Contains uncertain language' : 'STRONG - Confident and decisive';
  }

  private static getCompellingAssessment(text: string): string {
    const score = [
      this.hasStrongVerbs(text),
      this.hasUrgency(text),
      this.highlightsBenefits(text),
      this.hasCallToAction(text),
      !this.assessConfidence(text).includes('WEAK')
    ].filter(Boolean).length;

    if (score >= 4) return 'POWERFUL - This text commands attention and drives action!';
    if (score >= 3) return 'STRONG - Good persuasive elements, minor tweaks needed.';
    if (score >= 2) return 'MODERATE - Has potential, needs more compelling elements.';
    return 'WEAK - Requires significant strengthening to be persuasive.';
  }

  // Academic assessment helpers
  private static assessAcademicRigor(text: string): string {
    return this.hasObjectiveTone(text) && this.hasLogicalFlow(text) ? 
      'Demonstrates appropriate scholarly approach with objective analysis' : 
      'Requires enhancement of academic rigor and objectivity';
  }

  private static hasCitations(text: string): boolean {
    return /\([^)]*\d{4}[^)]*\)|\[\d+\]|et al\.|according to/i.test(text);
  }

  private static hasObjectiveTone(text: string): boolean {
    const subjectiveWords = ['i believe', 'i feel', 'obviously', 'clearly', 'definitely'];
    return !subjectiveWords.some(phrase => new RegExp(phrase, 'i').test(text));
  }

  private static hasLogicalFlow(text: string): boolean {
    const logicalConnectors = ['therefore', 'consequently', 'furthermore', 'however', 'moreover', 'thus'];
    return logicalConnectors.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static assessMethodology(text: string): string {
    return this.hasSpecificDetails(text) ? 
      'Includes methodological specificity' : 
      'Would benefit from more detailed methodological description';
  }

  private static needsMoreEvidence(text: string): boolean {
    return !this.hasCitations(text) && text.split(/\s+/).length > 50;
  }

  private static needsBetterTransitions(text: string): boolean {
    return !this.hasLogicalFlow(text) && text.split('.').length > 2;
  }

  private static getAcademicAssessment(text: string): string {
    const score = [
      this.hasObjectiveTone(text),
      this.hasLogicalFlow(text),
      this.hasCitations(text),
      this.hasSpecificDetails(text)
    ].filter(Boolean).length;

    if (score >= 3) return 'Meets academic standards with strong scholarly approach.';
    if (score >= 2) return 'Adequate academic foundation, some enhancement needed.';
    return 'Requires significant development to meet scholarly standards.';
  }

  // Creative assessment helpers
  private static assessImagery(text: string): string {
    return this.hasVisualElements(text) ? 
      'Rich visual imagery that brings the text to life' : 
      'Could benefit from more vivid, sensory descriptions';
  }

  private static hasEmotionalDepth(text: string): boolean {
    const emotionalWords = ['feel', 'heart', 'soul', 'passion', 'love', 'fear', 'joy', 'pain', 'hope'];
    return emotionalWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static hasVisualElements(text: string): boolean {
    const visualWords = ['see', 'look', 'bright', 'dark', 'color', 'light', 'shadow', 'gleam', 'sparkle'];
    return visualWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static hasRhythm(text: string): boolean {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const hasVariation = Math.max(...lengths) - Math.min(...lengths) > 3;
    return hasVariation;
  }

  private static hasTactileElements(text: string): boolean {
    const tactileWords = ['touch', 'feel', 'smooth', 'rough', 'soft', 'hard', 'warm', 'cold', 'texture'];
    return tactileWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static assessNarrative(text: string): string {
    const hasCharacters = /\b(he|she|they|character|person|people)\b/i.test(text);
    const hasAction = /\b(went|came|said|did|made|took|gave)\b/i.test(text);
    
    if (hasCharacters && hasAction) return 'Contains narrative elements with characters and action';
    if (hasCharacters) return 'Has character elements - consider adding more action';
    if (hasAction) return 'Good action elements - could use more character development';
    return 'Consider adding story elements like characters or action';
  }

  private static hasMetaphors(text: string): boolean {
    const metaphorIndicators = ['like', 'as', 'is a', 'was a', 'seems like', 'appears to be'];
    return metaphorIndicators.some(indicator => new RegExp(indicator, 'i').test(text));
  }

  private static hasUnexpectedElements(text: string): boolean {
    // Simple check for creative or unusual word combinations
    const unusualWords = ['whisper', 'dance', 'melody', 'symphony', 'paint', 'weave', 'bloom'];
    return unusualWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static getCreativeAssessment(text: string): string {
    const score = [
      this.hasEmotionalDepth(text),
      this.hasVisualElements(text),
      this.hasMetaphors(text),
      this.hasUnexpectedElements(text),
      this.hasRhythm(text)
    ].filter(Boolean).length;

    if (score >= 4) return 'Bursting with creativity and artistic flair!';
    if (score >= 3) return 'Good creative elements - let your imagination soar even higher!';
    if (score >= 2) return 'Shows creative potential - add more artistic touches.';
    return 'Ready for a creative transformation - let\'s add some magic!';
  }

  // Technical assessment helpers
  private static calculateReadability(avgWordsPerSentence: number): string {
    if (avgWordsPerSentence < 10) return 'HIGH (Simple)';
    if (avgWordsPerSentence < 15) return 'MEDIUM (Moderate)';
    if (avgWordsPerSentence < 20) return 'LOW (Complex)';
    return 'VERY LOW (Highly Complex)';
  }

  private static assessLogicalStructure(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return `Structure Analysis:
- Total statements: ${sentences.length}
- Logic flow: ${this.hasLogicalFlow(text) ? 'SEQUENTIAL' : 'NEEDS_IMPROVEMENT'}
- Coherence: ${sentences.length > 1 ? 'MULTI_POINT' : 'SINGLE_POINT'}`;
  }

  private static hasAmbiguousTerms(text: string): boolean {
    const ambiguousWords = ['thing', 'stuff', 'something', 'somehow', 'various', 'several', 'many'];
    return ambiguousWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static hasSpecificDetails(text: string): boolean {
    return /\b\d+(\.\d+)?(%|percent|dollars?|\$|hours?|minutes?|seconds?|days?|weeks?|months?|years?)\b/i.test(text);
  }

  private static hasConsistentTerminology(text: string): boolean {
    // Simple check - in a real implementation, this would be more sophisticated
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length > 0.7; // High ratio suggests good vocabulary variety
  }

  private static detectLogicalErrors(text: string): string {
    const errors = [];
    
    if (this.hasAmbiguousTerms(text)) {
      errors.push('• Ambiguous terminology detected');
    }
    
    if (!this.hasSpecificDetails(text) && text.split(/\s+/).length > 30) {
      errors.push('• Lacks quantitative specificity');
    }
    
    if (!this.hasLogicalFlow(text) && text.split('.').length > 2) {
      errors.push('• Missing logical connectors');
    }
    
    return errors.length > 0 ? errors.join('\n') : '• No critical errors detected';
  }

  private static needsMorePrecision(text: string): boolean {
    return this.hasAmbiguousTerms(text) || !this.hasSpecificDetails(text);
  }

  private static needsBetterStructure(text: string): boolean {
    return !this.hasLogicalFlow(text) && text.split('.').length > 2;
  }

  private static needsValidation(text: string): boolean {
    const validationWords = ['verify', 'check', 'confirm', 'validate', 'test', 'ensure'];
    return !validationWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  private static getTechnicalAssessment(text: string): string {
    const issues = [
      this.needsMorePrecision(text),
      this.needsBetterStructure(text),
      this.needsValidation(text)
    ].filter(Boolean).length;

    if (issues === 0) return 'OPTIMAL - All systems functioning correctly';
    if (issues === 1) return 'MINOR_ISSUES - One area needs attention';
    if (issues === 2) return 'MODERATE_ISSUES - Multiple areas need improvement';
    return 'CRITICAL_ISSUES - Significant optimization required';
  }

  private static getNextSteps(text: string): string {
    if (this.needsMorePrecision(text)) return 'Increase precision and specificity';
    if (this.needsBetterStructure(text)) return 'Implement logical structure improvements';
    if (this.needsValidation(text)) return 'Add validation and verification steps';
    return 'Continue with current approach - system is optimized';
  }

  // General assessment helpers
  private static getGeneralStrengths(text: string): string {
    const strengths = [];
    
    if (this.hasPersonalPronouns(text)) strengths.push('Personal and engaging tone');
    if (this.hasSpecificDetails(text)) strengths.push('Includes specific details');
    if (this.hasLogicalFlow(text)) strengths.push('Good logical structure');
    if (!this.hasAmbiguousTerms(text)) strengths.push('Clear and precise language');
    
    return strengths.length > 0 ? strengths[0] : 'Communicates the main message';
  }

  private static getGeneralWeaknesses(text: string): string {
    const weaknesses = [];
    
    if (this.hasAmbiguousTerms(text)) weaknesses.push('Contains vague terms');
    if (!this.hasLogicalFlow(text) && text.split('.').length > 2) weaknesses.push('Could improve flow between ideas');
    if (!this.hasSpecificDetails(text)) weaknesses.push('Could use more specific examples');
    
    return weaknesses.length > 0 ? weaknesses[0] : 'Minor areas for improvement';
  }

  private static getGeneralSuggestions(text: string): string {
    const suggestions = [];
    
    if (text.split(/\s+/).length < 30) suggestions.push('Consider expanding with more detail');
    if (text.split(/\s+/).length > 200) suggestions.push('Consider condensing for better impact');
    if (!this.hasCallToAction(text)) suggestions.push('Add a clear next step for readers');
    
    return suggestions.length > 0 ? suggestions[0] : 'Continue refining based on your audience needs';
  }
}