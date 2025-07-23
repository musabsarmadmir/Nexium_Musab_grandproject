// ATS (Applicant Tracking System) scoring engine

import { extractKeywords, analyzeKeywordImportance, calculateKeywordDensity } from './keyword-analyzer'

export interface ATSScoreResult {
  score: number
  breakdown: ATSScoreBreakdown
  recommendations: string[]
  passesATS: boolean
}

export interface ATSScoreBreakdown {
  keywordMatch: number
  formatScore: number
  contentScore: number
  lengthScore: number
  structureScore: number
  details: {
    totalKeywords: number
    matchedKeywords: number
    missingCriticalKeywords: string[]
    formatIssues: string[]
    contentIssues: string[]
  }
}

export class ATSScorer {
  
  calculateATSScore(resumeText: string, jobKeywords: string[]): ATSScoreResult {
    const breakdown = this.calculateScoreBreakdown(resumeText, jobKeywords)
    const overallScore = this.calculateOverallScore(breakdown)
    const recommendations = this.generateRecommendations(breakdown)
    const passesATS = overallScore >= 70 // Industry standard ATS passing score
    
    return {
      score: overallScore,
      breakdown,
      recommendations,
      passesATS
    }
  }

  private calculateScoreBreakdown(resumeText: string, jobKeywords: string[]): ATSScoreBreakdown {
    const keywordMatch = this.calculateKeywordMatchScore(resumeText, jobKeywords)
    const formatScore = this.calculateFormatScore(resumeText)
    const contentScore = this.calculateContentScore(resumeText)
    const lengthScore = this.calculateLengthScore(resumeText)
    const structureScore = this.calculateStructureScore(resumeText)
    
    const resumeKeywords = extractKeywords(resumeText)
    const matchedKeywords = this.findMatchedKeywords(resumeKeywords, jobKeywords)
    const missingCriticalKeywords = this.findMissingCriticalKeywords(resumeKeywords, jobKeywords)
    const formatIssues = this.identifyFormatIssues(resumeText)
    const contentIssues = this.identifyContentIssues(resumeText)
    
    return {
      keywordMatch,
      formatScore,
      contentScore,
      lengthScore,
      structureScore,
      details: {
        totalKeywords: jobKeywords.length,
        matchedKeywords: matchedKeywords.length,
        missingCriticalKeywords,
        formatIssues,
        contentIssues
      }
    }
  }

  private calculateOverallScore(breakdown: ATSScoreBreakdown): number {
    // Weighted scoring system
    const weights = {
      keywordMatch: 0.40,    // 40% - Most important for ATS
      contentScore: 0.25,    // 25% - Content quality and relevance
      structureScore: 0.15,  // 15% - Resume structure and sections
      formatScore: 0.10,     // 10% - ATS-friendly formatting
      lengthScore: 0.10      // 10% - Appropriate length
    }
    
    const weightedScore = 
      breakdown.keywordMatch * weights.keywordMatch +
      breakdown.contentScore * weights.contentScore +
      breakdown.structureScore * weights.structureScore +
      breakdown.formatScore * weights.formatScore +
      breakdown.lengthScore * weights.lengthScore
    
    return Math.round(weightedScore)
  }

  private calculateKeywordMatchScore(resumeText: string, jobKeywords: string[]): number {
    if (jobKeywords.length === 0) return 100
    
    const resumeKeywords = extractKeywords(resumeText)
    const keywordImportance = analyzeKeywordImportance(jobKeywords, resumeText)
    
    let totalImportance = 0
    let matchedImportance = 0
    
    keywordImportance.forEach(kwInfo => {
      totalImportance += kwInfo.importance
      
      const isMatched = resumeKeywords.some(resumeKw => 
        this.isKeywordMatch(resumeKw, kwInfo.keyword)
      )
      
      if (isMatched) {
        matchedImportance += kwInfo.importance
      }
    })
    
    if (totalImportance === 0) return 100
    
    const matchPercentage = (matchedImportance / totalImportance) * 100
    return Math.min(Math.round(matchPercentage), 100)
  }

  private calculateFormatScore(resumeText: string): number {
    let score = 100
    const formatIssues = this.identifyFormatIssues(resumeText)
    
    // Deduct points for each format issue
    formatIssues.forEach(issue => {
      switch (issue) {
        case 'Complex formatting detected':
          score -= 15
          break
        case 'Unusual characters found':
          score -= 10
          break
        case 'Inconsistent spacing':
          score -= 5
          break
        case 'Missing standard sections':
          score -= 20
          break
        default:
          score -= 5
      }
    })
    
    return Math.max(score, 0)
  }

  private calculateContentScore(resumeText: string): number {
    let score = 100
    const contentIssues = this.identifyContentIssues(resumeText)
    
    contentIssues.forEach(issue => {
      switch (issue) {
        case 'Missing quantifiable achievements':
          score -= 15
          break
        case 'Weak action verbs':
          score -= 10
          break
        case 'No relevant keywords':
          score -= 20
          break
        case 'Generic job descriptions':
          score -= 12
          break
        case 'Missing skills section':
          score -= 15
          break
        default:
          score -= 5
      }
    })
    
    return Math.max(score, 0)
  }

  private calculateLengthScore(resumeText: string): number {
    const wordCount = resumeText.split(/\s+/).length
    
    // Optimal length: 400-800 words
    if (wordCount >= 400 && wordCount <= 800) {
      return 100
    } else if (wordCount >= 300 && wordCount <= 1000) {
      return 85
    } else if (wordCount >= 200 && wordCount <= 1200) {
      return 70
    } else if (wordCount < 200) {
      return 40 // Too short
    } else {
      return 50 // Too long
    }
  }

  private calculateStructureScore(resumeText: string): number {
    let score = 0
    const sections = this.identifyResumeSections(resumeText)
    
    // Essential sections
    const essentialSections = ['experience', 'skills', 'education']
    const hasEssentialSections = essentialSections.every(section => 
      sections.some(resumeSection => resumeSection.includes(section))
    )
    
    if (hasEssentialSections) score += 60
    
    // Additional beneficial sections
    const beneficialSections = ['summary', 'projects', 'certifications']
    const beneficialCount = beneficialSections.filter(section => 
      sections.some(resumeSection => resumeSection.includes(section))
    ).length
    
    score += beneficialCount * 10
    
    // Logical section order
    if (this.hasLogicalSectionOrder(sections)) {
      score += 20
    }
    
    return Math.min(score, 100)
  }

  private identifyFormatIssues(resumeText: string): string[] {
    const issues: string[] = []
    
    // Check for complex formatting
    if (resumeText.includes('\t') || resumeText.includes('  ')) {
      issues.push('Inconsistent spacing')
    }
    
    // Check for unusual characters
    const unusualChars = /[^\w\s.,!?()-]/g
    if (unusualChars.test(resumeText)) {
      issues.push('Unusual characters found')
    }
    
    // Check for standard sections
    const standardSections = ['experience', 'education', 'skills']
    const hasStandardSections = standardSections.some(section => 
      resumeText.toLowerCase().includes(section)
    )
    
    if (!hasStandardSections) {
      issues.push('Missing standard sections')
    }
    
    return issues
  }

  private identifyContentIssues(resumeText: string): string[] {
    const issues: string[] = []
    
    // Check for quantifiable achievements
    const hasNumbers = /\d+/.test(resumeText)
    const hasPercentages = /%/.test(resumeText)
    const hasCurrency = /\$/.test(resumeText)
    
    if (!hasNumbers && !hasPercentages && !hasCurrency) {
      issues.push('Missing quantifiable achievements')
    }
    
    // Check for strong action verbs
    const strongActionVerbs = [
      'achieved', 'improved', 'increased', 'reduced', 'developed',
      'implemented', 'managed', 'led', 'created', 'optimized'
    ]
    
    const hasStrongVerbs = strongActionVerbs.some(verb => 
      resumeText.toLowerCase().includes(verb)
    )
    
    if (!hasStrongVerbs) {
      issues.push('Weak action verbs')
    }
    
    // Check for skills section
    if (!resumeText.toLowerCase().includes('skill')) {
      issues.push('Missing skills section')
    }
    
    // Check for generic descriptions
    const genericPhrases = [
      'responsible for', 'duties included', 'worked on'
    ]
    
    const hasGenericPhrases = genericPhrases.some(phrase => 
      resumeText.toLowerCase().includes(phrase)
    )
    
    if (hasGenericPhrases) {
      issues.push('Generic job descriptions')
    }
    
    return issues
  }

  private identifyResumeSections(resumeText: string): string[] {
    const sections: string[] = []
    const lines = resumeText.split('\n')
    
    const sectionKeywords = [
      'summary', 'objective', 'profile',
      'experience', 'work history', 'employment',
      'education', 'academic',
      'skills', 'technical skills', 'competencies',
      'projects', 'portfolio',
      'certifications', 'licenses',
      'awards', 'achievements',
      'publications', 'research'
    ]
    
    lines.forEach(line => {
      const trimmedLine = line.trim().toLowerCase()
      sectionKeywords.forEach(keyword => {
        if (trimmedLine.includes(keyword) && line.length < 50) {
          sections.push(keyword)
        }
      })
    })
    
    return Array.from(new Set(sections))
  }

  private hasLogicalSectionOrder(sections: string[]): boolean {
    const idealOrder = [
      'summary', 'objective', 'profile',
      'experience', 'work history', 'employment',
      'education', 'academic',
      'skills', 'technical skills', 'competencies',
      'projects', 'certifications', 'awards'
    ]
    
    let lastOrderIndex = -1
    
    for (const section of sections) {
      const orderIndex = idealOrder.indexOf(section)
      if (orderIndex !== -1) {
        if (orderIndex < lastOrderIndex) {
          return false // Out of order
        }
        lastOrderIndex = orderIndex
      }
    }
    
    return true
  }

  private findMatchedKeywords(resumeKeywords: string[], jobKeywords: string[]): string[] {
    return jobKeywords.filter(jobKw => 
      resumeKeywords.some(resumeKw => this.isKeywordMatch(resumeKw, jobKw))
    )
  }

  private findMissingCriticalKeywords(resumeKeywords: string[], jobKeywords: string[]): string[] {
    const criticalKeywords = jobKeywords.filter(keyword => {
      const importance = this.getKeywordImportance(keyword)
      return importance >= 8 // High importance keywords
    })
    
    return criticalKeywords.filter(criticalKw => 
      !resumeKeywords.some(resumeKw => this.isKeywordMatch(resumeKw, criticalKw))
    )
  }

  private isKeywordMatch(resumeKeyword: string, jobKeyword: string): boolean {
    const resume = resumeKeyword.toLowerCase()
    const job = jobKeyword.toLowerCase()
    
    // Exact match
    if (resume === job) return true
    
    // Contains match
    if (resume.includes(job) || job.includes(resume)) return true
    
    // Synonym matching (basic)
    const synonyms: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript'],
      'python': ['py'],
      'database': ['db', 'sql'],
      'frontend': ['front-end', 'front end'],
      'backend': ['back-end', 'back end'],
      'fullstack': ['full-stack', 'full stack']
    }
    
    for (const [key, syns] of Object.entries(synonyms)) {
      if ((resume === key && syns.includes(job)) || 
          (job === key && syns.includes(resume))) {
        return true
      }
    }
    
    return false
  }

  private getKeywordImportance(keyword: string): number {
    // Simplified importance calculation
    const highImportanceKeywords = [
      'required', 'must', 'essential', 'mandatory',
      'python', 'javascript', 'react', 'aws', 'sql'
    ]
    
    if (highImportanceKeywords.some(important => 
      keyword.toLowerCase().includes(important)
    )) {
      return 10
    }
    
    return 5 // Default importance
  }

  private generateRecommendations(breakdown: ATSScoreBreakdown): string[] {
    const recommendations: string[] = []
    
    // Keyword recommendations
    if (breakdown.keywordMatch < 70) {
      recommendations.push('Add more relevant keywords from the job description')
      
      if (breakdown.details.missingCriticalKeywords.length > 0) {
        recommendations.push(`Include these critical keywords: ${breakdown.details.missingCriticalKeywords.slice(0, 3).join(', ')}`)
      }
    }
    
    // Format recommendations
    if (breakdown.formatScore < 80) {
      if (breakdown.details.formatIssues.includes('Missing standard sections')) {
        recommendations.push('Add standard resume sections: Experience, Education, Skills')
      }
      
      if (breakdown.details.formatIssues.includes('Inconsistent spacing')) {
        recommendations.push('Use consistent spacing and formatting throughout')
      }
    }
    
    // Content recommendations
    if (breakdown.contentScore < 80) {
      if (breakdown.details.contentIssues.includes('Missing quantifiable achievements')) {
        recommendations.push('Add numbers, percentages, and metrics to quantify your achievements')
      }
      
      if (breakdown.details.contentIssues.includes('Weak action verbs')) {
        recommendations.push('Use strong action verbs like "achieved," "improved," "developed"')
      }
    }
    
    // Structure recommendations
    if (breakdown.structureScore < 80) {
      recommendations.push('Organize sections in logical order: Summary, Experience, Education, Skills')
    }
    
    // Length recommendations
    if (breakdown.lengthScore < 80) {
      const wordCount = breakdown.details.totalKeywords
      if (wordCount < 400) {
        recommendations.push('Expand your resume with more detailed descriptions (aim for 400-800 words)')
      } else if (wordCount > 800) {
        recommendations.push('Condense your resume to focus on most relevant information (aim for 400-800 words)')
      }
    }
    
    return recommendations.slice(0, 5) // Return top 5 recommendations
  }
}

// Simple function for backward compatibility
export function calculateATSScore(resumeText: string, jobKeywords: string[]): number {
  const scorer = new ATSScorer()
  const result = scorer.calculateATSScore(resumeText, jobKeywords)
  return result.score
}

// Export singleton instance
export const atsScorer = new ATSScorer()
