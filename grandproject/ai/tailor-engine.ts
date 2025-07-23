// Core resume tailoring engine
import { extractKeywords, calculateKeywordDensity, suggestKeywordPlacements } from './keyword-analyzer'
import { calculateATSScore } from './ats-scorer'

export interface TailoringRequest {
  resumeText: string
  jobDescription: string
  targetRole: string
  company?: string
}

export interface TailoringResult {
  tailoredResume: string
  atsScore: number
  keywordMatches: KeywordMatch[]
  suggestions: TailordSuggestion[]
  improvements: string[]
  originalScore: number
}

export interface KeywordMatch {
  keyword: string
  inResume: boolean
  frequency: number
  importance: 'high' | 'medium' | 'low'
  suggestedPlacements: string[]
}

export interface TailordSuggestion {
  section: string
  original: string
  suggested: string
  reason: string
  impact: number
}

export class ResumeTagiloringEngine {
  
  async tailorResume(request: TailoringRequest): Promise<TailoringResult> {
    const { resumeText, jobDescription, targetRole, company } = request
    
    // Step 1: Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription)
    
    // Step 2: Analyze current resume
    const originalScore = calculateATSScore(resumeText, jobKeywords)
    const currentKeywords = extractKeywords(resumeText)
    
    // Step 3: Identify missing keywords
    const keywordMatches = this.analyzeKeywordMatches(jobKeywords, currentKeywords, resumeText)
    
    // Step 4: Generate tailoring suggestions
    const suggestions = this.generateTailoringSuggestions(resumeText, keywordMatches, targetRole)
    
    // Step 5: Apply suggestions to create tailored resume
    const tailoredResume = this.applyTailoringChanges(resumeText, suggestions)
    
    // Step 6: Calculate new ATS score
    const newATSScore = calculateATSScore(tailoredResume, jobKeywords)
    
    // Step 7: Generate improvement recommendations
    const improvements = this.generateImprovements(keywordMatches, suggestions)
    
    return {
      tailoredResume,
      atsScore: newATSScore,
      keywordMatches,
      suggestions,
      improvements,
      originalScore
    }
  }

  private analyzeKeywordMatches(jobKeywords: string[], resumeKeywords: string[], resumeText: string): KeywordMatch[] {
    return jobKeywords.map(keyword => {
      const inResume = resumeKeywords.some(rk => 
        rk.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(rk.toLowerCase())
      )
      
      const frequency = this.countKeywordFrequency(resumeText, keyword)
      const importance = this.determineKeywordImportance(keyword)
      const suggestedPlacements = suggestKeywordPlacements(keyword, resumeText)
      
      return {
        keyword,
        inResume,
        frequency,
        importance,
        suggestedPlacements
      }
    })
  }

  private generateTailoringSuggestions(
    resumeText: string, 
    keywordMatches: KeywordMatch[], 
    targetRole: string
  ): TailordSuggestion[] {
    const suggestions: TailordSuggestion[] = []
    const resumeSections = this.parseResumeIntoSections(resumeText)
    
    // Add missing high-importance keywords
    const missingHighImportanceKeywords = keywordMatches.filter(
      km => !km.inResume && km.importance === 'high'
    )
    
    missingHighImportanceKeywords.forEach(keyword => {
      const bestSection = this.findBestSectionForKeyword(keyword.keyword, resumeSections)
      if (bestSection) {
        suggestions.push({
          section: bestSection.name,
          original: bestSection.content,
          suggested: this.incorporateKeyword(bestSection.content, keyword.keyword),
          reason: `Add high-priority keyword "${keyword.keyword}" to improve ATS matching`,
          impact: 15
        })
      }
    })
    
    // Strengthen weak sections
    suggestions.push(...this.strengthenWeakSections(resumeSections, keywordMatches, targetRole))
    
    // Optimize keyword density
    suggestions.push(...this.optimizeKeywordDensity(resumeSections, keywordMatches))
    
    return suggestions.sort((a, b) => b.impact - a.impact)
  }

  private applyTailoringChanges(resumeText: string, suggestions: TailordSuggestion[]): string {
    let tailoredResume = resumeText
    
    // Apply suggestions in order of impact
    suggestions.forEach(suggestion => {
      if (tailoredResume.includes(suggestion.original)) {
        tailoredResume = tailoredResume.replace(suggestion.original, suggestion.suggested)
      }
    })
    
    return tailoredResume
  }

  private parseResumeIntoSections(resumeText: string) {
    const sections = []
    const sectionHeaders = [
      'summary', 'objective', 'experience', 'work experience', 'employment',
      'skills', 'technical skills', 'education', 'projects', 'achievements',
      'certifications', 'awards'
    ]
    
    const lines = resumeText.split('\n')
    let currentSection = { name: 'header', content: '', startIndex: 0 }
    
    lines.forEach((line, index) => {
      const lowercaseLine = line.toLowerCase().trim()
      const foundHeader = sectionHeaders.find(header => 
        lowercaseLine.includes(header) && line.length < 50
      )
      
      if (foundHeader) {
        if (currentSection.content.trim()) {
          sections.push(currentSection)
        }
        currentSection = { name: foundHeader, content: line + '\n', startIndex: index }
      } else {
        currentSection.content += line + '\n'
      }
    })
    
    if (currentSection.content.trim()) {
      sections.push(currentSection)
    }
    
    return sections
  }

  private findBestSectionForKeyword(keyword: string, sections: any[]) {
    // Technical keywords go to skills section
    if (this.isTechnicalKeyword(keyword)) {
      return sections.find(s => s.name.includes('skill')) || sections[0]
    }
    
    // Action keywords go to experience section
    if (this.isActionKeyword(keyword)) {
      return sections.find(s => s.name.includes('experience') || s.name.includes('employment')) || sections[0]
    }
    
    // Default to first suitable section
    return sections.find(s => s.name !== 'header') || sections[0]
  }

  private incorporateKeyword(sectionContent: string, keyword: string): string {
    const lines = sectionContent.split('\n')
    
    // Find a bullet point or sentence to enhance
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('•') || line.startsWith('-') || line.includes('experience')) {
        // Add keyword naturally to the line
        if (!line.toLowerCase().includes(keyword.toLowerCase())) {
          lines[i] = this.enhanceLineWithKeyword(line, keyword)
          break
        }
      }
    }
    
    return lines.join('\n')
  }

  private enhanceLineWithKeyword(line: string, keyword: string): string {
    // Simple keyword integration logic
    if (line.includes('experience') || line.includes('worked')) {
      return line.replace('experience', `experience with ${keyword}`)
    }
    
    if (line.startsWith('•') || line.startsWith('-')) {
      return `${line} utilizing ${keyword}`
    }
    
    return `${line} (${keyword})`
  }

  private strengthenWeakSections(sections: any[], keywordMatches: KeywordMatch[], targetRole: string): TailordSuggestion[] {
    const suggestions: TailordSuggestion[] = []
    
    // Find sections with low keyword density
    sections.forEach(section => {
      const sectionKeywordCount = keywordMatches.filter(km => 
        section.content.toLowerCase().includes(km.keyword.toLowerCase())
      ).length
      
      if (sectionKeywordCount < 2 && section.name !== 'header') {
        const relevantKeywords = keywordMatches
          .filter(km => !km.inResume && km.importance !== 'low')
          .slice(0, 2)
        
        if (relevantKeywords.length > 0) {
          let enhancedContent = section.content
          relevantKeywords.forEach(km => {
            enhancedContent = this.incorporateKeyword(enhancedContent, km.keyword)
          })
          
          suggestions.push({
            section: section.name,
            original: section.content,
            suggested: enhancedContent,
            reason: `Strengthen ${section.name} section with relevant keywords`,
            impact: 10
          })
        }
      }
    })
    
    return suggestions
  }

  private optimizeKeywordDensity(sections: any[], keywordMatches: KeywordMatch[]): TailordSuggestion[] {
    const suggestions: TailordSuggestion[] = []
    
    // Check for keyword stuffing or under-utilization
    keywordMatches.forEach(km => {
      if (km.inResume && km.frequency > 0) {
        const density = calculateKeywordDensity(sections.map(s => s.content).join(' '), km.keyword)
        
        if (density > 3) {
          // Too much keyword stuffing
          suggestions.push({
            section: 'overall',
            original: km.keyword,
            suggested: `Reduce repetition of "${km.keyword}"`,
            reason: 'Avoid keyword stuffing which can hurt ATS scoring',
            impact: -5
          })
        } else if (density < 0.5 && km.importance === 'high') {
          // Not enough usage of important keyword
          suggestions.push({
            section: 'overall',
            original: km.keyword,
            suggested: `Increase usage of "${km.keyword}"`,
            reason: 'Important keyword needs more presence in resume',
            impact: 8
          })
        }
      }
    })
    
    return suggestions
  }

  private generateImprovements(keywordMatches: KeywordMatch[], suggestions: TailordSuggestion[]): string[] {
    const improvements: string[] = []
    
    const missingKeywords = keywordMatches.filter(km => !km.inResume)
    if (missingKeywords.length > 0) {
      improvements.push(`Add ${missingKeywords.length} missing keywords to improve job match`)
    }
    
    const highImpactSuggestions = suggestions.filter(s => s.impact > 10)
    if (highImpactSuggestions.length > 0) {
      improvements.push(`${highImpactSuggestions.length} high-impact changes identified`)
    }
    
    const weakSections = suggestions.filter(s => s.reason.includes('Strengthen'))
    if (weakSections.length > 0) {
      improvements.push(`Strengthen ${weakSections.length} sections with relevant keywords`)
    }
    
    return improvements
  }

  private countKeywordFrequency(text: string, keyword: string): number {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    return (text.match(regex) || []).length
  }

  private determineKeywordImportance(keyword: string): 'high' | 'medium' | 'low' {
    const highPriorityPatterns = [
      'required', 'must have', 'essential', 'critical', 'mandatory',
      'python', 'javascript', 'react', 'aws', 'sql', 'docker'
    ]
    
    const mediumPriorityPatterns = [
      'preferred', 'desired', 'nice to have', 'bonus',
      'git', 'agile', 'scrum', 'testing'
    ]
    
    const lowerKeyword = keyword.toLowerCase()
    
    if (highPriorityPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      return 'high'
    }
    
    if (mediumPriorityPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      return 'medium'
    }
    
    return 'low'
  }

  private isTechnicalKeyword(keyword: string): boolean {
    const technicalPatterns = [
      'python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker',
      'kubernetes', 'git', 'api', 'database', 'cloud', 'devops'
    ]
    
    return technicalPatterns.some(pattern => 
      keyword.toLowerCase().includes(pattern)
    )
  }

  private isActionKeyword(keyword: string): boolean {
    const actionPatterns = [
      'developed', 'implemented', 'managed', 'led', 'created',
      'designed', 'optimized', 'improved', 'collaborated'
    ]
    
    return actionPatterns.some(pattern => 
      keyword.toLowerCase().includes(pattern)
    )
  }
}

// Export singleton instance
export const tailoringEngine = new ResumeTagiloringEngine()
