// Central orchestrator for resume optimization and job matching

import { tailoringEngine, TailoringRequest, TailoringResult } from './tailor-engine'
import { atsScorer, ATSScoreResult } from './ats-scorer'
import { jobAnalyzer, JobAnalysisResult } from './job-analyzer'
import { generateKeywordReport, extractKeywordsWithAI, generateOptimizationSuggestions } from './keyword-analyzer'
import { n8nExecutor } from './n8n-workflows'

export interface OptimizationRequest {
  resumeText: string
  jobDescription: string
  jobUrl?: string
  targetRole?: string
  company?: string
  optimizationLevel: 'basic' | 'standard' | 'aggressive'
  preserveFormatting: boolean
}

export interface OptimizationResult {
  originalResume: string
  optimizedResume: string
  improvements: {
    beforeScore: number
    afterScore: number
    improvement: number
    keyChanges: string[]
  }
  atsAnalysis: ATSScoreResult
  jobAnalysis: JobAnalysisResult
  tailoringResults: TailoringResult
  keywordReport: any
  recommendations: OptimizationRecommendation[]
  processingTime: number
}

export interface OptimizationRecommendation {
  category: 'keywords' | 'format' | 'content' | 'structure' | 'skills'
  priority: 'high' | 'medium' | 'low'
  description: string
  impact: number
  actionable: boolean
  implementation: string
}

export class ResumeOptimizer {
  
  async optimizeResume(request: OptimizationRequest): Promise<OptimizationResult> {
    const startTime = Date.now()
    
    try {
      // Step 1: Analyze the job posting
      console.log('Analyzing job posting...')
      const jobAnalysis = jobAnalyzer.analyzeJobPosting(request.jobDescription)
      
      // Step 2: Calculate initial ATS score
      console.log('Calculating initial ATS score...')
      const jobKeywords = jobAnalysis.keywords
      const initialATSScore = atsScorer.calculateATSScore(request.resumeText, jobKeywords)
      
      // Step 3: Generate keyword report
      console.log('Generating keyword analysis...')
      const keywordReport = generateKeywordReport(request.jobDescription, request.resumeText)
      
      // Step 4: Tailor the resume
      console.log('Tailoring resume...')
      const tailoringRequest: TailoringRequest = {
        resumeText: request.resumeText,
        jobDescription: request.jobDescription,
        targetRole: request.targetRole || jobAnalysis.jobTitle,
        company: request.company || jobAnalysis.company
      }
      
      const tailoringResults = await tailoringEngine.tailorResume(tailoringRequest)
      
      // Step 5: Calculate optimized ATS score
      console.log('Calculating optimized ATS score...')
      const optimizedATSScore = atsScorer.calculateATSScore(
        tailoringResults.tailoredResume, 
        jobKeywords
      )
      
      // Step 6: Generate comprehensive recommendations
      console.log('Generating recommendations...')
      const recommendations = this.generateOptimizationRecommendations(
        initialATSScore,
        optimizedATSScore,
        tailoringResults,
        keywordReport,
        request.optimizationLevel
      )
      
      // Step 7: Apply optimization level adjustments
      const finalOptimizedResume = this.applyOptimizationLevel(
        tailoringResults.tailoredResume,
        request.optimizationLevel,
        tailoringResults.suggestions
      )
      
      const processingTime = Date.now() - startTime
      
      return {
        originalResume: request.resumeText,
        optimizedResume: finalOptimizedResume,
        improvements: {
          beforeScore: initialATSScore.score,
          afterScore: optimizedATSScore.score,
          improvement: optimizedATSScore.score - initialATSScore.score,
          keyChanges: this.extractKeyChanges(tailoringResults.suggestions)
        },
        atsAnalysis: optimizedATSScore,
        jobAnalysis,
        tailoringResults,
        keywordReport,
        recommendations,
        processingTime
      }
      
    } catch (error) {
      console.error('Error during resume optimization:', error)
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generateOptimizationRecommendations(
    initialScore: ATSScoreResult,
    optimizedScore: ATSScoreResult,
    tailoringResults: TailoringResult,
    keywordReport: any,
    optimizationLevel: string
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Keyword recommendations
    if (keywordReport.missingKeywords.length > 0) {
      const topMissingKeywords = keywordReport.missingKeywords
        .slice(0, optimizationLevel === 'aggressive' ? 8 : 5)
        .map((kw: any) => kw.keyword)
        .join(', ')

      recommendations.push({
        category: 'keywords',
        priority: 'high',
        description: `Add these important keywords: ${topMissingKeywords}`,
        impact: 15,
        actionable: true,
        implementation: 'Naturally incorporate these keywords into your experience bullets and skills section'
      })
    }

    // ATS Score improvement recommendations
    if (optimizedScore.score < 80) {
      if (optimizedScore.breakdown.formatScore < 80) {
        recommendations.push({
          category: 'format',
          priority: 'high',
          description: 'Improve ATS compatibility formatting',
          impact: 12,
          actionable: true,
          implementation: 'Use standard section headers, consistent formatting, and avoid complex layouts'
        })
      }

      if (optimizedScore.breakdown.contentScore < 80) {
        recommendations.push({
          category: 'content',
          priority: 'medium',
          description: 'Strengthen content with quantifiable achievements',
          impact: 10,
          actionable: true,
          implementation: 'Add numbers, percentages, and metrics to demonstrate impact'
        })
      }
    }

    // Skills gap recommendations
    if (tailoringResults.keywordMatches.some(km => !km.inResume && km.importance === 'high')) {
      recommendations.push({
        category: 'skills',
        priority: 'high',
        description: 'Bridge critical skills gaps identified in job requirements',
        impact: 18,
        actionable: true,
        implementation: 'Add missing technical skills to your skills section and provide examples in experience'
      })
    }

    // Structure recommendations
    if (optimizedScore.breakdown.structureScore < 85) {
      recommendations.push({
        category: 'structure',
        priority: 'medium',
        description: 'Optimize resume structure and section organization',
        impact: 8,
        actionable: true,
        implementation: 'Reorganize sections in logical order: Summary, Experience, Skills, Education'
      })
    }

    // Advanced recommendations for higher optimization levels
    if (optimizationLevel === 'aggressive') {
      recommendations.push({
        category: 'content',
        priority: 'medium',
        description: 'Consider creating role-specific resume versions',
        impact: 12,
        actionable: true,
        implementation: 'Create targeted versions emphasizing different skills based on job requirements'
      })
    }

    return recommendations
      .sort((a, b) => b.impact - a.impact)
      .slice(0, optimizationLevel === 'aggressive' ? 8 : 6)
  }

  private applyOptimizationLevel(
    baseOptimizedResume: string,
    optimizationLevel: 'basic' | 'standard' | 'aggressive',
    suggestions: any[]
  ): string {
    let finalResume = baseOptimizedResume

    switch (optimizationLevel) {
      case 'basic':
        // Apply only high-impact, low-risk changes
        const basicSuggestions = suggestions.filter(s => s.impact > 12 && s.impact < 20)
        finalResume = this.applySuggestions(finalResume, basicSuggestions)
        break

      case 'standard':
        // Apply most suggestions with medium risk tolerance
        const standardSuggestions = suggestions.filter(s => s.impact > 8)
        finalResume = this.applySuggestions(finalResume, standardSuggestions)
        break

      case 'aggressive':
        // Apply all suggestions for maximum optimization
        finalResume = this.applySuggestions(finalResume, suggestions)
        finalResume = this.enhanceForAggressiveOptimization(finalResume)
        break
    }

    return finalResume
  }

  private applySuggestions(resume: string, suggestions: any[]): string {
    let optimizedResume = resume

    suggestions.forEach(suggestion => {
      if (suggestion.original && suggestion.suggested) {
        optimizedResume = optimizedResume.replace(
          suggestion.original,
          suggestion.suggested
        )
      }
    })

    return optimizedResume
  }

  private enhanceForAggressiveOptimization(resume: string): string {
    // For aggressive optimization, add additional enhancements
    let enhancedResume = resume

    // Enhance bullet points with stronger action verbs
    const strongerVerbs: Record<string, string> = {
      'worked on': 'developed',
      'responsible for': 'managed',
      'helped with': 'contributed to',
      'involved in': 'collaborated on',
      'used': 'utilized',
      'made': 'created'
    }

    Object.entries(strongerVerbs).forEach(([weak, strong]) => {
      const regex = new RegExp(weak, 'gi')
      enhancedResume = enhancedResume.replace(regex, strong)
    })

    return enhancedResume
  }

  private extractKeyChanges(suggestions: any[]): string[] {
    return suggestions
      .filter(s => s.impact > 10)
      .map(s => s.reason)
      .slice(0, 5)
  }

  // Quick optimization for simple use cases
  async quickOptimize(resumeText: string, jobDescription: string): Promise<{
    optimizedResume: string
    score: number
    keyChanges: string[]
  }> {
    const request: OptimizationRequest = {
      resumeText,
      jobDescription,
      optimizationLevel: 'standard',
      preserveFormatting: true
    }

    const result = await this.optimizeResume(request)

    return {
      optimizedResume: result.optimizedResume,
      score: result.improvements.afterScore,
      keyChanges: result.improvements.keyChanges
    }
  }

  // Batch optimization for multiple job applications
  async batchOptimize(
    resumeText: string, 
    jobDescriptions: string[]
  ): Promise<Array<{
    jobIndex: number
    optimizedResume: string
    score: number
    matchPercentage: number
  }>> {
    const results: Array<{
      jobIndex: number
      optimizedResume: string
      score: number
      matchPercentage: number
    }> = []

    for (let i = 0; i < jobDescriptions.length; i++) {
      try {
        const optimization = await this.quickOptimize(resumeText, jobDescriptions[i])
        const keywordReport = generateKeywordReport(jobDescriptions[i], resumeText)
        
        results.push({
          jobIndex: i,
          optimizedResume: optimization.optimizedResume,
          score: optimization.score,
          matchPercentage: keywordReport.overallMatch
        })
      } catch (error) {
        console.error(`Failed to optimize for job ${i}:`, error)
        results.push({
          jobIndex: i,
          optimizedResume: resumeText,
          score: 0,
          matchPercentage: 0
        })
      }
    }

    return results
  }

  // A/B testing for optimization strategies
  async compareOptimizationStrategies(
    resumeText: string,
    jobDescription: string
  ): Promise<{
    basic: OptimizationResult
    standard: OptimizationResult
    aggressive: OptimizationResult
    recommendation: string
  }> {
    const baseRequest: OptimizationRequest = {
      resumeText,
      jobDescription,
      optimizationLevel: 'standard',
      preserveFormatting: true
    }

    const [basic, standard, aggressive] = await Promise.all([
      this.optimizeResume({ ...baseRequest, optimizationLevel: 'basic' }),
      this.optimizeResume({ ...baseRequest, optimizationLevel: 'standard' }),
      this.optimizeResume({ ...baseRequest, optimizationLevel: 'aggressive' })
    ])

    // Determine best strategy based on improvement vs risk
    let recommendation = 'standard'
    
    if (aggressive.improvements.improvement > standard.improvements.improvement + 10) {
      recommendation = 'aggressive'
    } else if (basic.improvements.improvement >= standard.improvements.improvement - 5) {
      recommendation = 'basic'
    }

    return {
      basic,
      standard,
      aggressive,
      recommendation: `Recommended strategy: ${recommendation} optimization`
    }
  }
}

// Export singleton instance
export const resumeOptimizer = new ResumeOptimizer()

// AI-Enhanced Resume Optimization Functions
export async function optimizeResumeAI(request: OptimizationRequest): Promise<OptimizationResult> {
  const startTime = Date.now()
  const {
    resumeText,
    jobDescription,
    optimizationLevel = 'standard',
    preserveFormatting = true
  } = request

  try {
    // 1. Enhanced job analysis with AI
    const [jobAnalysis, keywordAnalysis] = await Promise.all([
      jobAnalyzer.analyzeJobPosting(jobDescription),
      extractKeywordsWithAI(jobDescription, {
        useAI: true,
        industryFocus: request.targetRole,
        fallbackToLocal: true
      })
    ])

    // 2. AI-powered resume enhancement
    let optimizedResume = resumeText
    const optimizationSuggestions: string[] = []
    let coverLetter = ''

    // Try n8n AI workflow for comprehensive enhancement
    try {
      const enhancementResult = await n8nExecutor.executeWorkflow('RESUME_ENHANCEMENT', {
        resumeContent: resumeText,
        jobDescription,
        targetRole: request.targetRole || '',
        company: request.company || '',
        enhancementLevel: optimizationLevel
      })

      if (enhancementResult.success) {
        optimizedResume = enhancementResult.data.enhancedResume || resumeText
        optimizationSuggestions.push(...(enhancementResult.data.suggestions || []))
        
        // Generate cover letter if enhancement level is aggressive
        if (optimizationLevel === 'aggressive') {
          const coverLetterResult = await n8nExecutor.executeWorkflow('COVER_LETTER_GENERATION', {
            resumeContent: optimizedResume,
            jobDescription,
            candidateName: extractCandidateName(resumeText),
            company: request.company || ''
          })

          if (coverLetterResult.success) {
            coverLetter = coverLetterResult.data.coverLetter || ''
          }
        }
      }
    } catch (aiError) {
      console.warn('AI enhancement failed, falling back to local optimization:', aiError)
      
      // Fallback to standard optimization
      return await resumeOptimizer.optimizeResume(request)
    }

    // 3. Generate comprehensive keyword report using traditional method
    const keywordReport = generateKeywordReport(jobDescription, optimizedResume)

    // 4. Calculate ATS scores
    const initialATSScore = atsScorer.calculateATSScore(resumeText, jobAnalysis.keywords)
    const optimizedATSScore = atsScorer.calculateATSScore(optimizedResume, jobAnalysis.keywords)

    // 5. Generate section-specific optimization suggestions
    const sectionOptimizations = await generateSectionOptimizations(
      optimizedResume,
      keywordAnalysis.keywords,
      jobDescription
    )

    // Convert keyword analysis to match expected format
    const keywordMatches = keywordReport.matchingKeywords.map(k => ({
      keyword: k.keyword,
      inResume: true,
      frequency: 1,
      importance: k.importance > 7 ? 'high' as const : k.importance > 4 ? 'medium' as const : 'low' as const,
      suggestedPlacements: []
    }))

    // Convert optimization suggestions to proper format
    const tailordSuggestions = optimizationSuggestions.map((suggestion, index) => ({
      section: 'general',
      original: 'Current content',
      suggested: suggestion,
      reason: 'AI-powered enhancement for better job matching',
      impact: Math.max(0.1, 0.8 - (index * 0.1))
    }))

    return {
      originalResume: resumeText,
      optimizedResume,
      improvements: {
        beforeScore: initialATSScore.score,
        afterScore: optimizedATSScore.score,
        improvement: calculateImprovementScore(initialATSScore.score, optimizedATSScore.score),
        keyChanges: optimizationSuggestions
      },
      atsAnalysis: optimizedATSScore,
      jobAnalysis,
      tailoringResults: {
        tailoredResume: optimizedResume,
        atsScore: optimizedATSScore.score,
        keywordMatches,
        suggestions: tailordSuggestions,
        improvements: optimizationSuggestions,
        originalScore: initialATSScore.score
      },
      keywordReport,
      recommendations: [
        ...optimizationSuggestions.map((suggestion, index) => ({
          category: 'content' as const,
          priority: 'medium' as const,
          description: suggestion,
          impact: Math.max(0.1, 0.8 - (index * 0.1)),
          actionable: true,
          implementation: `Update resume content: ${suggestion}`
        })),
        ...sectionOptimizations.flatMap(s => s.suggestions.map(suggestion => ({
          category: 'structure' as const,
          priority: 'high' as const,
          description: `${s.section}: ${suggestion}`,
          impact: 0.7,
          actionable: true,
          implementation: `Improve ${s.section} section: ${suggestion}`
        })))
      ],
      processingTime: Date.now() - startTime
    }
  } catch (error) {
    console.error('AI-enhanced optimization failed:', error)
    
    // Complete fallback to standard optimization
    return await resumeOptimizer.optimizeResume(request)
  }
}

async function generateSectionOptimizations(
  resumeText: string,
  targetKeywords: string[],
  jobContext: string
): Promise<Array<{
  section: string
  suggestions: string[]
  optimizedContent?: string
}>> {
  const sections = extractResumeSections(resumeText)
  const optimizations: Array<{
    section: string
    suggestions: string[]
    optimizedContent?: string
  }> = []

  for (const [sectionName, content] of Object.entries(sections)) {
    if (content && content.trim().length > 0) {
      const sectionType = mapSectionType(sectionName)
      const optimization = await generateOptimizationSuggestions(
        content,
        targetKeywords,
        sectionType,
        {
          useAI: true,
          jobContext,
          enhancementLevel: 'standard'
        }
      )

      optimizations.push({
        section: sectionName,
        suggestions: optimization.suggestions,
        optimizedContent: optimization.optimizedContent
      })
    }
  }

  return optimizations
}

function extractResumeSections(resumeText: string): Record<string, string> {
  const sections: Record<string, string> = {}
  
  // Basic section extraction - this would be enhanced with proper parsing
  const lines = resumeText.split('\n')
  let currentSection = 'header'
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase()
    
    if (trimmedLine.includes('experience') || trimmedLine.includes('employment')) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n')
      }
      currentSection = 'experience'
      currentContent = []
    } else if (trimmedLine.includes('education')) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n')
      }
      currentSection = 'education'
      currentContent = []
    } else if (trimmedLine.includes('skills')) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n')
      }
      currentSection = 'skills'
      currentContent = []
    } else if (trimmedLine.includes('summary') || trimmedLine.includes('objective')) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n')
      }
      currentSection = 'summary'
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  // Add final section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n')
  }

  return sections
}

function mapSectionType(sectionName: string): 'summary' | 'experience' | 'skills' | 'education' | 'projects' {
  const name = sectionName.toLowerCase()
  if (name.includes('experience') || name.includes('employment')) return 'experience'
  if (name.includes('education')) return 'education'
  if (name.includes('skills')) return 'skills'
  if (name.includes('summary') || name.includes('objective')) return 'summary'
  return 'projects'
}

function extractCandidateName(resumeText: string): string {
  // Basic name extraction - would be enhanced with proper parsing
  const lines = resumeText.split('\n').slice(0, 5)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 2 && trimmed.length < 50 && /^[A-Za-z\s]+$/.test(trimmed)) {
      return trimmed
    }
  }
  return 'Candidate'
}

function calculateImprovementScore(initialScore: number, optimizedScore: number): number {
  if (initialScore === 0) return optimizedScore > 0 ? 100 : 0
  
  const improvement = ((optimizedScore - initialScore) / initialScore) * 100
  return Math.max(0, Math.min(100, improvement))
}
