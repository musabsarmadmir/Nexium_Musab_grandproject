// n8n workflow definitions for AI-powered resume optimization

export interface N8nWorkflowConfig {
  id: string
  name: string
  description: string
  webhookUrl: string
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  timeout: number
}

export interface N8nWorkflowResponse {
  success: boolean
  data: any
  executionId: string
  processingTime: number
  error?: string
}

// Workflow configurations
export const N8N_WORKFLOWS: Record<string, N8nWorkflowConfig> = {
  KEYWORD_EXTRACTION: {
    id: 'keyword-extraction',
    name: 'AI Keyword Extraction',
    description: 'Extract and prioritize keywords from job descriptions using GPT-4',
    webhookUrl: '/webhook/keyword-extraction',
    inputSchema: {
      jobDescription: 'string',
      industryFocus: 'string?',
      roleLevel: 'string?'
    },
    outputSchema: {
      technicalKeywords: 'string[]',
      softSkills: 'string[]',
      requirements: 'string[]',
      priorities: 'Record<string, number>'
    },
    timeout: 30000
  },

  RESUME_ENHANCEMENT: {
    id: 'resume-enhancement',
    name: 'AI Resume Enhancement',
    description: 'Enhance resume content with AI-powered improvements',
    webhookUrl: '/webhook/resume-enhancement',
    inputSchema: {
      resumeText: 'string',
      targetKeywords: 'string[]',
      jobDescription: 'string',
      enhancementLevel: 'string'
    },
    outputSchema: {
      enhancedResume: 'string',
      improvements: 'string[]',
      confidenceScore: 'number'
    },
    timeout: 45000
  },

  CONTENT_OPTIMIZATION: {
    id: 'content-optimization',
    name: 'AI Content Optimization',
    description: 'Optimize resume sections for ATS and human readability',
    webhookUrl: '/webhook/content-optimization',
    inputSchema: {
      sectionContent: 'string',
      sectionType: 'string',
      targetKeywords: 'string[]',
      jobContext: 'string'
    },
    outputSchema: {
      optimizedContent: 'string',
      keywordDensity: 'number',
      readabilityScore: 'number',
      suggestions: 'string[]'
    },
    timeout: 25000
  },

  SKILL_MATCHING: {
    id: 'skill-matching',
    name: 'AI Skill Matching',
    description: 'Match candidate skills with job requirements using semantic analysis',
    webhookUrl: '/webhook/skill-matching',
    inputSchema: {
      candidateSkills: 'string[]',
      jobRequirements: 'string[]',
      industryContext: 'string'
    },
    outputSchema: {
      matchScore: 'number',
      matchedSkills: 'string[]',
      missingSkills: 'string[]',
      skillGaps: 'string[]',
      recommendations: 'string[]'
    },
    timeout: 20000
  },

  BULLET_POINT_GENERATOR: {
    id: 'bullet-point-generator',
    name: 'AI Bullet Point Generator',
    description: 'Generate impactful bullet points for experience sections',
    webhookUrl: '/webhook/bullet-point-generator',
    inputSchema: {
      originalBullet: 'string',
      role: 'string',
      company: 'string',
      achievements: 'string[]',
      targetKeywords: 'string[]'
    },
    outputSchema: {
      enhancedBullets: 'string[]',
      impactMetrics: 'string[]',
      actionVerbs: 'string[]'
    },
    timeout: 20000
  },

  COVER_LETTER_GENERATOR: {
    id: 'cover-letter-generator',
    name: 'AI Cover Letter Generator',
    description: 'Generate personalized cover letters based on resume and job posting',
    webhookUrl: '/webhook/cover-letter-generator',
    inputSchema: {
      resumeText: 'string',
      jobDescription: 'string',
      companyName: 'string',
      roleTitle: 'string',
      personalInfo: 'Record<string, any>'
    },
    outputSchema: {
      coverLetter: 'string',
      keyHighlights: 'string[]',
      personalizedElements: 'string[]'
    },
    timeout: 35000
  }
}

// n8n workflow execution class
export class N8nWorkflowExecutor {
  private baseUrl: string
  private apiKey?: string

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'
    this.apiKey = process.env.N8N_API_KEY
  }

  async executeWorkflow(
    workflowId: string, 
    data: Record<string, any>,
    options: {
      timeout?: number
      retries?: number
      priority?: 'low' | 'normal' | 'high'
    } = {}
  ): Promise<N8nWorkflowResponse> {
    const workflow = N8N_WORKFLOWS[workflowId]
    
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowId}`)
    }

    const { timeout = workflow.timeout, retries = 2 } = options

    // Validate input schema
    this.validateInput(data, workflow.inputSchema)

    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest(workflow, data, timeout)
        
        return {
          success: true,
          data: response.data,
          executionId: response.executionId || `exec_${Date.now()}`,
          processingTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`Workflow ${workflowId} attempt ${attempt + 1} failed:`, error)
        
        if (attempt < retries) {
          await this.delay(1000 * (attempt + 1)) // Exponential backoff
        }
      }
    }

    // All retries failed, fall back to local processing
    console.error(`All attempts failed for workflow ${workflowId}, falling back to local processing`)
    return this.fallbackToLocal(workflowId, data, lastError)
  }

  private async makeRequest(
    workflow: N8nWorkflowConfig, 
    data: Record<string, any>,
    timeout: number
  ): Promise<any> {
    const url = `${this.baseUrl}${workflow.webhookUrl}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          workflowId: workflow.id,
          data,
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Workflow execution failed')
      }

      return result
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private validateInput(data: Record<string, any>, schema: Record<string, any>): void {
    for (const [key, type] of Object.entries(schema)) {
      const isOptional = type.endsWith('?')
      const actualType = isOptional ? type.slice(0, -1) : type
      
      if (!isOptional && !(key in data)) {
        throw new Error(`Missing required field: ${key}`)
      }

      if (key in data && data[key] !== null && data[key] !== undefined) {
        // Basic type checking (can be enhanced)
        if (actualType === 'string' && typeof data[key] !== 'string') {
          throw new Error(`Field ${key} must be a string`)
        }
        if (actualType === 'string[]' && !Array.isArray(data[key])) {
          throw new Error(`Field ${key} must be an array of strings`)
        }
      }
    }
  }

  private async fallbackToLocal(
    workflowId: string, 
    data: Record<string, any>, 
    error: Error | null
  ): Promise<N8nWorkflowResponse> {
    // Import local AI functions
    const { extractKeywords, analyzeKeywordImportance } = await import('./keyword-analyzer')
    
    switch (workflowId) {
      case 'KEYWORD_EXTRACTION':
        return this.fallbackKeywordExtraction(data)
      
      case 'SKILL_MATCHING':
        return this.fallbackSkillMatching(data)
      
      case 'CONTENT_OPTIMIZATION':
        return this.fallbackContentOptimization(data)
      
      default:
        return {
          success: false,
          data: null,
          executionId: `fallback_${Date.now()}`,
          processingTime: 0,
          error: `No fallback available for workflow ${workflowId}: ${error?.message}`
        }
    }
  }

  private async fallbackKeywordExtraction(data: any): Promise<N8nWorkflowResponse> {
    const { extractKeywords, analyzeKeywordImportance } = await import('./keyword-analyzer')
    
    try {
      const keywords = extractKeywords(data.jobDescription)
      const analysis = analyzeKeywordImportance(keywords, data.jobDescription)
      
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
        success: true,
        data: {
          technicalKeywords,
          softSkills,
          requirements,
          priorities
        },
        executionId: `local_keyword_${Date.now()}`,
        processingTime: 100
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        executionId: `local_keyword_failed_${Date.now()}`,
        processingTime: 0,
        error: (error as Error).message
      }
    }
  }

  private async fallbackSkillMatching(data: any): Promise<N8nWorkflowResponse> {
    try {
      const candidateSkills = data.candidateSkills || []
      const jobRequirements = data.jobRequirements || []
      
      const matchedSkills = candidateSkills.filter((skill: string) =>
        jobRequirements.some((req: string) =>
          req.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(req.toLowerCase())
        )
      )
      
      const missingSkills = jobRequirements.filter((req: string) =>
        !candidateSkills.some((skill: string) =>
          skill.toLowerCase().includes(req.toLowerCase()) ||
          req.toLowerCase().includes(skill.toLowerCase())
        )
      )
      
      const matchScore = jobRequirements.length > 0 
        ? (matchedSkills.length / jobRequirements.length) * 100 
        : 100

      return {
        success: true,
        data: {
          matchScore: Math.round(matchScore),
          matchedSkills,
          missingSkills,
          skillGaps: missingSkills,
          recommendations: missingSkills.map((skill: string) => `Consider adding ${skill} to your skillset`)
        },
        executionId: `local_skills_${Date.now()}`,
        processingTime: 50
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        executionId: `local_skills_failed_${Date.now()}`,
        processingTime: 0,
        error: (error as Error).message
      }
    }
  }

  private async fallbackContentOptimization(data: any): Promise<N8nWorkflowResponse> {
    try {
      const content = data.sectionContent || ''
      const keywords = data.targetKeywords || []
      
      // Simple keyword density calculation
      const wordCount = content.split(/\s+/).length
      const keywordCount = keywords.reduce((count: number, keyword: string) => {
        const regex = new RegExp(keyword, 'gi')
        return count + (content.match(regex) || []).length
      }, 0)
      
      const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0
      
      // Basic optimization suggestions
      const suggestions: string[] = []
      if (keywordDensity < 2) {
        suggestions.push('Consider adding more relevant keywords')
      }
      if (keywordDensity > 5) {
        suggestions.push('Reduce keyword density to avoid over-optimization')
      }
      if (content.length < 100) {
        suggestions.push('Consider expanding content with more details')
      }

      return {
        success: true,
        data: {
          optimizedContent: content, // In real implementation, would enhance content
          keywordDensity: Math.round(keywordDensity * 100) / 100,
          readabilityScore: 75, // Placeholder
          suggestions
        },
        executionId: `local_content_${Date.now()}`,
        processingTime: 75
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        executionId: `local_content_failed_${Date.now()}`,
        processingTime: 0,
        error: (error as Error).message
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Batch execution for multiple workflows
  async executeBatch(
    requests: Array<{ workflowId: string; data: Record<string, any> }>
  ): Promise<N8nWorkflowResponse[]> {
    const results = await Promise.allSettled(
      requests.map(req => this.executeWorkflow(req.workflowId, req.data))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          data: null,
          executionId: `batch_failed_${index}_${Date.now()}`,
          processingTime: 0,
          error: result.reason.message
        }
      }
    })
  }

  // Health check for n8n service
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${this.baseUrl}/healthz`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return { status: 'healthy', details: 'n8n service is responsive' }
      } else {
        return { status: 'unhealthy', details: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: `Connection failed: ${(error as Error).message}` 
      }
    }
  }
}

// Export singleton instance
export const n8nExecutor = new N8nWorkflowExecutor()

// Convenience functions for common workflows
export const extractKeywordsWithAI = (jobDescription: string, options?: any) =>
  n8nExecutor.executeWorkflow('KEYWORD_EXTRACTION', { jobDescription, ...options })

export const enhanceResumeWithAI = (resumeText: string, jobDescription: string, options?: any) =>
  n8nExecutor.executeWorkflow('RESUME_ENHANCEMENT', { resumeText, jobDescription, ...options })

export const matchSkillsWithAI = (candidateSkills: string[], jobRequirements: string[], options?: any) =>
  n8nExecutor.executeWorkflow('SKILL_MATCHING', { candidateSkills, jobRequirements, ...options })

export const optimizeContentWithAI = (content: string, keywords: string[], options?: any) =>
  n8nExecutor.executeWorkflow('CONTENT_OPTIMIZATION', { 
    sectionContent: content, 
    targetKeywords: keywords, 
    ...options 
  })

export const generateBulletPointsWithAI = (originalBullet: string, context: any, options?: any) =>
  n8nExecutor.executeWorkflow('BULLET_POINT_GENERATOR', { originalBullet, ...context, ...options })

export const generateCoverLetterWithAI = (resumeText: string, jobDescription: string, companyInfo: any, options?: any) =>
  n8nExecutor.executeWorkflow('COVER_LETTER_GENERATOR', { 
    resumeText, 
    jobDescription, 
    ...companyInfo, 
    ...options 
  })
