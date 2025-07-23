// Keyword analysis and extraction utilities with n8n AI integration

import fs from 'fs'
import path from 'path'
import { n8nExecutor } from './n8n-workflows'

export interface KeywordAnalysis {
  keywords: string[]
  keywordFrequency: Record<string, number>
  totalWords: number
  uniqueKeywords: number
  density: number
  aiEnhanced?: boolean
  processingMethod: 'local' | 'ai' | 'hybrid'
}

export interface KeywordImportance {
  keyword: string
  importance: number
  category: 'technical' | 'soft' | 'industry' | 'action' | 'certification'
  context: string[]
}

// Common industry keywords and their weights
const KEYWORD_WEIGHTS = {
  technical: {
    'javascript': 10, 'python': 10, 'react': 9, 'node.js': 9, 'aws': 9,
    'sql': 8, 'docker': 8, 'kubernetes': 8, 'git': 7, 'mongodb': 7,
    'typescript': 8, 'next.js': 8, 'postgresql': 7, 'redis': 6,
    'graphql': 7, 'rest api': 8, 'microservices': 8, 'devops': 8,
    'ci/cd': 7, 'jenkins': 6, 'terraform': 7, 'linux': 6
  },
  soft: {
    'leadership': 8, 'communication': 7, 'teamwork': 6, 'problem solving': 8,
    'analytical': 7, 'creative': 6, 'detail oriented': 6, 'organized': 5,
    'collaborative': 6, 'adaptable': 6, 'innovative': 7, 'strategic': 7
  },
  action: {
    'developed': 8, 'implemented': 8, 'managed': 7, 'led': 8, 'created': 7,
    'designed': 7, 'optimized': 8, 'improved': 7, 'built': 6, 'delivered': 6,
    'achieved': 7, 'increased': 8, 'reduced': 8, 'streamlined': 7
  },
  industry: {
    'agile': 7, 'scrum': 6, 'kanban': 5, 'jira': 5, 'confluence': 4,
    'startup': 6, 'enterprise': 6, 'b2b': 5, 'b2c': 5, 'saas': 7,
    'fintech': 6, 'healthcare': 6, 'e-commerce': 6, 'mobile': 6
  },
  certification: {
    'aws certified': 9, 'google cloud': 8, 'azure': 7, 'pmp': 6,
    'scrum master': 6, 'certified': 5, 'professional': 4
  }
}

export function extractKeywords(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Clean and normalize text
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Extract multi-word phrases first
  const phrases = extractPhrases(cleanText)
  
  // Extract single words
  const words = cleanText
    .split(' ')
    .filter(word => word.length > 2)
    .filter(word => !STOP_WORDS.includes(word))

  // Combine and deduplicate
  const allKeywords = [...phrases, ...words]
  return [...new Set(allKeywords)]
}

export function extractPhrasesFromJobPosting(jobText: string): string[] {
  const commonJobPhrases = [
    // Experience levels
    /(\d+\+?\s*years?\s*(?:of\s*)?experience)/gi,
    /(senior|junior|mid-level|entry-level)/gi,
    
    // Requirements
    /(bachelor'?s?\s*degree|master'?s?\s*degree|phd)/gi,
    /(required|must\s*have|essential|mandatory)/gi,
    /(preferred|nice\s*to\s*have|bonus|desired)/gi,
    
    // Technical skills
    /(full\s*stack|front\s*end|back\s*end|dev\s*ops)/gi,
    /(machine\s*learning|artificial\s*intelligence|data\s*science)/gi,
    /(cloud\s*computing|distributed\s*systems|micro\s*services)/gi,
    
    // Soft skills
    /(team\s*player|self\s*motivated|detail\s*oriented)/gi,
    /(problem\s*solving|critical\s*thinking|communication\s*skills)/gi,
    
    // Work arrangements
    /(remote|hybrid|on-site|flexible)/gi,
    /(full\s*time|part\s*time|contract|freelance)/gi
  ]

  const extractedPhrases: string[] = []
  
  commonJobPhrases.forEach(regex => {
    const matches = jobText.match(regex)
    if (matches) {
      extractedPhrases.push(...matches.map(match => match.toLowerCase().trim()))
    }
  })

  return [...new Set(extractedPhrases)]
}

function extractPhrases(text: string): string[] {
  const phrases: string[] = []
  
  // Common technical phrases
  const technicalPhrases = [
    'machine learning', 'artificial intelligence', 'data science',
    'full stack', 'front end', 'back end', 'dev ops', 'cloud computing',
    'rest api', 'graphql api', 'micro services', 'distributed systems',
    'ci cd', 'test driven development', 'agile development',
    'version control', 'code review', 'pair programming'
  ]
  
  // Common business phrases
  const businessPhrases = [
    'project management', 'product management', 'business analysis',
    'stakeholder management', 'cross functional', 'team leadership',
    'process improvement', 'cost reduction', 'revenue growth',
    'customer satisfaction', 'user experience', 'market research'
  ]
  
  const allPhrases = [...technicalPhrases, ...businessPhrases]
  
  allPhrases.forEach(phrase => {
    if (text.includes(phrase)) {
      phrases.push(phrase)
    }
  })
  
  return phrases
}

export function analyzeKeywordImportance(keywords: string[], context: string): KeywordImportance[] {
  return keywords.map(keyword => {
    const category = categorizeKeyword(keyword)
    const importance = calculateKeywordImportance(keyword, category, context)
    const keywordContext = extractKeywordContext(keyword, context)
    
    return {
      keyword,
      importance,
      category,
      context: keywordContext
    }
  }).sort((a, b) => b.importance - a.importance)
}

function categorizeKeyword(keyword: string): 'technical' | 'soft' | 'industry' | 'action' | 'certification' {
  const lowerKeyword = keyword.toLowerCase()
  
  if (Object.keys(KEYWORD_WEIGHTS.technical).some(tech => lowerKeyword.includes(tech))) {
    return 'technical'
  }
  
  if (Object.keys(KEYWORD_WEIGHTS.action).some(action => lowerKeyword.includes(action))) {
    return 'action'
  }
  
  if (Object.keys(KEYWORD_WEIGHTS.certification).some(cert => lowerKeyword.includes(cert))) {
    return 'certification'
  }
  
  if (Object.keys(KEYWORD_WEIGHTS.industry).some(ind => lowerKeyword.includes(ind))) {
    return 'industry'
  }
  
  return 'soft'
}

function calculateKeywordImportance(keyword: string, category: string, context: string): number {
  let baseScore = 5 // Default importance
  
  // Check against predefined weights
  const categoryWeights = KEYWORD_WEIGHTS[category as keyof typeof KEYWORD_WEIGHTS] || {}
  const exactMatch = categoryWeights[keyword.toLowerCase()]
  
  if (exactMatch) {
    baseScore = exactMatch
  } else {
    // Partial matching for compound keywords
    Object.entries(categoryWeights).forEach(([weightKeyword, weight]) => {
      if (keyword.toLowerCase().includes(weightKeyword) || weightKeyword.includes(keyword.toLowerCase())) {
        baseScore = Math.max(baseScore, weight * 0.8)
      }
    })
  }
  
  // Boost score based on context
  const contextLower = context.toLowerCase()
  
  // Required/essential keywords get higher importance
  if (contextLower.includes('required') || contextLower.includes('must') || contextLower.includes('essential')) {
    baseScore += 3
  }
  
  // Years of experience mentioned
  if (contextLower.includes('years') && contextLower.includes(keyword.toLowerCase())) {
    baseScore += 2
  }
  
  // Keyword appears multiple times
  const frequency = (contextLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
  if (frequency > 2) {
    baseScore += Math.min(frequency - 1, 3)
  }
  
  return Math.min(baseScore, 15) // Cap at 15
}

function extractKeywordContext(keyword: string, text: string): string[] {
  const contexts: string[] = []
  const sentences = text.split(/[.!?]+/)
  
  sentences.forEach(sentence => {
    if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
      contexts.push(sentence.trim())
    }
  })
  
  return contexts.slice(0, 3) // Return up to 3 contexts
}

export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0
  
  const words = text.toLowerCase().split(/\s+/)
  const keywordCount = words.filter(word => 
    word.includes(keyword.toLowerCase())
  ).length
  
  return (keywordCount / words.length) * 100
}

export function suggestKeywordPlacements(keyword: string, resumeText: string): string[] {
  const suggestions: string[] = []
  const sections = resumeText.split(/\n\s*\n/)
  
  // Suggest technical keywords for skills section
  if (categorizeKeyword(keyword) === 'technical') {
    const skillsSection = sections.find(section => 
      section.toLowerCase().includes('skill') || 
      section.toLowerCase().includes('technical')
    )
    
    if (skillsSection && !skillsSection.toLowerCase().includes(keyword.toLowerCase())) {
      suggestions.push('Add to Skills/Technical Skills section')
    }
  }
  
  // Suggest action keywords for experience section
  if (categorizeKeyword(keyword) === 'action') {
    const experienceSection = sections.find(section => 
      section.toLowerCase().includes('experience') || 
      section.toLowerCase().includes('work history')
    )
    
    if (experienceSection && !experienceSection.toLowerCase().includes(keyword.toLowerCase())) {
      suggestions.push('Incorporate into job descriptions in Experience section')
    }
  }
  
  // General suggestions
  if (suggestions.length === 0) {
    suggestions.push('Add to relevant bullet points in Experience section')
    suggestions.push('Include in Skills section if applicable')
    suggestions.push('Mention in Summary/Objective section')
  }
  
  return suggestions
}

export function generateKeywordReport(jobText: string, resumeText: string): {
  jobKeywords: KeywordImportance[]
  resumeKeywords: string[]
  missingKeywords: KeywordImportance[]
  matchingKeywords: KeywordImportance[]
  overallMatch: number
} {
  const jobKeywords = extractKeywords(jobText)
  const resumeKeywords = extractKeywords(resumeText)
  
  const jobKeywordAnalysis = analyzeKeywordImportance(jobKeywords, jobText)
  
  const missingKeywords = jobKeywordAnalysis.filter(jk => 
    !resumeKeywords.some(rk => 
      rk.toLowerCase().includes(jk.keyword.toLowerCase()) ||
      jk.keyword.toLowerCase().includes(rk.toLowerCase())
    )
  )
  
  const matchingKeywords = jobKeywordAnalysis.filter(jk => 
    resumeKeywords.some(rk => 
      rk.toLowerCase().includes(jk.keyword.toLowerCase()) ||
      jk.keyword.toLowerCase().includes(rk.toLowerCase())
    )
  )
  
  // Calculate overall match percentage
  const totalImportance = jobKeywordAnalysis.reduce((sum, kw) => sum + kw.importance, 0)
  const matchedImportance = matchingKeywords.reduce((sum, kw) => sum + kw.importance, 0)
  const overallMatch = totalImportance > 0 ? (matchedImportance / totalImportance) * 100 : 0
  
  return {
    jobKeywords: jobKeywordAnalysis,
    resumeKeywords,
    missingKeywords,
    matchingKeywords,
    overallMatch: Math.round(overallMatch * 100) / 100
  }
}

// Enhanced AI-powered keyword extraction
export async function extractKeywordsWithAI(
  jobText: string, 
  options: {
    useAI?: boolean
    industryFocus?: string
    roleLevel?: string
    fallbackToLocal?: boolean
  } = {}
): Promise<{
  keywords: string[]
  technicalKeywords: string[]
  softSkills: string[]
  requirements: string[]
  priorities: Record<string, number>
  processingMethod: 'local' | 'ai' | 'hybrid'
  processingTime: number
}> {
  const startTime = Date.now()
  const { useAI = true, fallbackToLocal = true } = options

  if (useAI) {
    try {
      // Try n8n AI workflow first
      const aiResult = await n8nExecutor.executeWorkflow('KEYWORD_EXTRACTION', {
        jobText,
        industryFocus: options.industryFocus,
        roleLevel: options.roleLevel
      })

      if (aiResult.success) {
        return {
          keywords: [
            ...aiResult.data.technicalKeywords,
            ...aiResult.data.softSkills,
            ...aiResult.data.requirements
          ],
          technicalKeywords: aiResult.data.technicalKeywords,
          softSkills: aiResult.data.softSkills,
          requirements: aiResult.data.requirements,
          priorities: aiResult.data.priorities,
          processingMethod: 'ai',
          processingTime: aiResult.processingTime
        }
      }
    } catch (error) {
      console.warn('AI keyword extraction failed:', error)
      if (!fallbackToLocal) {
        throw error
      }
    }
  }

  // Fallback to local processing
  const localKeywords = extractKeywords(jobText)
  const analysis = analyzeKeywordImportance(localKeywords, jobText)
  
  const technicalKeywords = analysis
    .filter(k => k.category === 'technical')
    .map(k => k.keyword)
  
  const softSkills = analysis
    .filter(k => k.category === 'soft')
    .map(k => k.keyword)
  
  const requirements = analysis
    .filter(k => k.importance > 7)
    .map(k => k.keyword)
  
  const priorities = analysis.reduce((acc, k) => {
    acc[k.keyword] = k.importance
    return acc
  }, {} as Record<string, number>)

  return {
    keywords: localKeywords,
    technicalKeywords,
    softSkills,
    requirements,
    priorities,
    processingMethod: useAI ? 'hybrid' : 'local',
    processingTime: Date.now() - startTime
  }
}

// AI-enhanced keyword matching and scoring
export async function generateEnhancedKeywordReport(
  jobText: string, 
  resumeText: string,
  options: {
    useAI?: boolean
    industryContext?: string
    roleLevel?: string
  } = {}
): Promise<{
  jobKeywords: KeywordImportance[]
  resumeKeywords: string[]
  missingKeywords: KeywordImportance[]
  matchingKeywords: KeywordImportance[]
  overallMatch: number
  aiInsights?: {
    semanticMatches: string[]
    contextualRecommendations: string[]
    industrySpecificKeywords: string[]
  }
  processingMethod: 'local' | 'ai' | 'hybrid'
}> {
  const { useAI = true } = options
  
  // Get enhanced job keywords
  const jobKeywordResult = await extractKeywordsWithAI(jobText, {
    useAI,
    industryFocus: options.industryContext,
    roleLevel: options.roleLevel
  })
  
  const resumeKeywords = extractKeywords(resumeText)
  const jobKeywordAnalysis = analyzeKeywordImportance(jobKeywordResult.keywords, jobText)
  
  // AI-enhanced skill matching if available
  let aiInsights
  if (useAI) {
    try {
      const skillMatchResult = await n8nExecutor.executeWorkflow('SKILL_MATCHING', {
        candidateSkills: resumeKeywords,
        jobRequirements: jobKeywordResult.keywords,
        industryContext: options.industryContext || 'general'
      })

      if (skillMatchResult.success) {
        aiInsights = {
          semanticMatches: skillMatchResult.data.matchedSkills || [],
          contextualRecommendations: skillMatchResult.data.recommendations || [],
          industrySpecificKeywords: jobKeywordResult.technicalKeywords
        }
      }
    } catch (error) {
      console.warn('AI skill matching failed:', error)
    }
  }
  
  const missingKeywords = jobKeywordAnalysis.filter(jk => 
    !resumeKeywords.some(rk => 
      rk.toLowerCase().includes(jk.keyword.toLowerCase()) ||
      jk.keyword.toLowerCase().includes(rk.toLowerCase())
    )
  )
  
  const matchingKeywords = jobKeywordAnalysis.filter(jk => 
    resumeKeywords.some(rk => 
      rk.toLowerCase().includes(jk.keyword.toLowerCase()) ||
      jk.keyword.toLowerCase().includes(rk.toLowerCase())
    )
  )
  
  // Enhanced matching calculation with AI weights
  const totalImportance = jobKeywordAnalysis.reduce((sum, kw) => sum + kw.importance, 0)
  const matchedImportance = matchingKeywords.reduce((sum, kw) => sum + kw.importance, 0)
  let overallMatch = totalImportance > 0 ? (matchedImportance / totalImportance) * 100 : 0
  
  // Boost score if AI found semantic matches
  if (aiInsights?.semanticMatches && aiInsights.semanticMatches.length > 0) {
    const semanticBoost = Math.min(aiInsights.semanticMatches.length * 2, 10)
    overallMatch = Math.min(overallMatch + semanticBoost, 100)
  }
  
  return {
    jobKeywords: jobKeywordAnalysis,
    resumeKeywords,
    missingKeywords,
    matchingKeywords,
    overallMatch: Math.round(overallMatch * 100) / 100,
    aiInsights,
    processingMethod: jobKeywordResult.processingMethod
  }
}

// AI-powered content optimization suggestions
export async function generateOptimizationSuggestions(
  content: string,
  targetKeywords: string[],
  sectionType: 'summary' | 'experience' | 'skills' | 'education' | 'projects',
  options: {
    useAI?: boolean
    jobContext?: string
    enhancementLevel?: 'basic' | 'standard' | 'aggressive'
  } = {}
): Promise<{
  suggestions: string[]
  optimizedContent?: string
  keywordDensity: number
  readabilityScore?: number
  processingMethod: 'local' | 'ai'
}> {
  const { useAI = true, enhancementLevel = 'standard' } = options
  
  if (useAI) {
    try {
      const optimizationResult = await n8nExecutor.executeWorkflow('CONTENT_OPTIMIZATION', {
        sectionContent: content,
        sectionType,
        targetKeywords,
        jobContext: options.jobContext || '',
        enhancementLevel
      })

      if (optimizationResult.success) {
        return {
          suggestions: optimizationResult.data.suggestions || [],
          optimizedContent: optimizationResult.data.optimizedContent,
          keywordDensity: optimizationResult.data.keywordDensity || 0,
          readabilityScore: optimizationResult.data.readabilityScore,
          processingMethod: 'ai'
        }
      }
    } catch (error) {
      console.warn('AI content optimization failed:', error)
    }
  }

  // Local fallback
  const suggestions = generateLocalOptimizationSuggestions(content, targetKeywords, sectionType)
  const keywordDensity = calculateKeywordDensity(content, targetKeywords.join(' '))
  
  return {
    suggestions,
    keywordDensity,
    processingMethod: 'local'
  }
}

function generateLocalOptimizationSuggestions(
  content: string,
  targetKeywords: string[],
  sectionType: string
): string[] {
  const suggestions: string[] = []
  
  // Check keyword presence
  const missingKeywords = targetKeywords.filter(keyword => 
    !content.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (missingKeywords.length > 0) {
    suggestions.push(`Add these keywords: ${missingKeywords.slice(0, 3).join(', ')}`)
  }
  
  // Section-specific suggestions
  if (sectionType === 'experience') {
    if (!content.includes('•') && !content.includes('-')) {
      suggestions.push('Use bullet points for better readability')
    }
    if (!/\d+/.test(content)) {
      suggestions.push('Add quantifiable metrics and achievements')
    }
  }
  
  if (sectionType === 'skills') {
    if (content.length < 100) {
      suggestions.push('Expand skills section with more technical details')
    }
  }
  
  if (sectionType === 'summary') {
    if (content.length < 150) {
      suggestions.push('Expand summary to 150-200 words for better impact')
    }
  }
  
  return suggestions
}

// Common stop words to filter out
const STOP_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'one', 'also', 'just',
  'now', 'here', 'there', 'when', 'where', 'why', 'how'
]
