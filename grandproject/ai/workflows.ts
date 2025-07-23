// AI workflow orchestration and integration layer

import { resumeOptimizer, OptimizationRequest, OptimizationResult } from './resume-optimizer'
import { atsScorer, ATSScoreResult } from './ats-scorer'
import { jobAnalyzer, JobAnalysisResult } from './job-analyzer'
import { tailoringEngine, TailoringRequest } from './tailor-engine'

export const WORKFLOWS = {
  RESUME_ANALYSIS: 'resume-analysis',
  JOB_MATCHING: 'job-matching', 
  RESUME_OPTIMIZATION: 'resume-optimization',
  KEYWORD_EXTRACTION: 'keyword-extraction',
  ATS_SCORING: 'ats-scoring'
}

export const PROMPTS = {
  ANALYZE_RESUME: `
    Analyze the following resume and provide:
    1. Overall ATS score (1-100)
    2. Key strengths and accomplishments
    3. Areas for improvement
    4. Missing keywords for target roles
    5. Formatting and structure suggestions
    
    Resume: {resume_text}
    Target Role: {target_role}
  `,
  
  MATCH_JOBS: `
    Match the candidate's profile with available job postings:
    
    Candidate Profile: {candidate_profile}
    Job Postings: {job_postings}
    
    Provide:
    1. Match percentage for each job (0-100%)
    2. Reasons for good matches
    3. Skills gaps for lower matches
    4. Recommended improvements
  `,
  
  OPTIMIZE_RESUME: `
    Optimize the resume for the target job description:
    
    Current Resume: {current_resume}
    Target Job: {job_description}
    Optimization Level: {optimization_level}
    
    Provide:
    1. Optimized resume content
    2. Keywords to include naturally
    3. Sections to emphasize
    4. Specific changes made with rationale
  `,

  EXTRACT_KEYWORDS: `
    Extract and prioritize keywords from this job description:
    
    Job Description: {job_description}
    
    Provide:
    1. Technical skills (priority ranked)
    2. Soft skills mentioned
    3. Required vs preferred qualifications
    4. Industry-specific terms
    5. Action verbs to use
  `,
}

// Main workflow functions
export class AIWorkflowManager {
  
  async analyzeResume(resumeText: string, targetRole?: string): Promise<ATSScoreResult> {
    try {
      // If no target role, do general analysis
      const jobKeywords = targetRole ? [targetRole] : []
      return atsScorer.calculateATSScore(resumeText, jobKeywords)
    } catch (error) {
      console.error('Resume analysis failed:', error)
      throw new Error('Failed to analyze resume')
    }
  }

  async analyzeJobPosting(jobDescription: string): Promise<JobAnalysisResult> {
    try {
      return jobAnalyzer.analyzeJobPosting(jobDescription)
    } catch (error) {
      console.error('Job analysis failed:', error)
      throw new Error('Failed to analyze job posting')
    }
  }

  async optimizeResumeForJob(
    resumeText: string,
    jobDescription: string,
    options: {
      optimizationLevel?: 'basic' | 'standard' | 'aggressive'
      preserveFormatting?: boolean
      targetRole?: string
      company?: string
    } = {}
  ): Promise<OptimizationResult> {
    try {
      const request: OptimizationRequest = {
        resumeText,
        jobDescription,
        optimizationLevel: options.optimizationLevel || 'standard',
        preserveFormatting: options.preserveFormatting ?? true,
        targetRole: options.targetRole,
        company: options.company
      }

      return await resumeOptimizer.optimizeResume(request)
    } catch (error) {
      console.error('Resume optimization failed:', error)
      throw new Error('Failed to optimize resume')
    }
  }

  async tailorResumeBasic(
    resumeText: string,
    jobDescription: string,
    targetRole: string
  ): Promise<{
    tailoredResume: string
    atsScore: number
    improvements: string[]
  }> {
    try {
      const tailoringRequest: TailoringRequest = {
        resumeText,
        jobDescription,
        targetRole
      }

      const result = await tailoringEngine.tailorResume(tailoringRequest)
      
      return {
        tailoredResume: result.tailoredResume,
        atsScore: result.atsScore,
        improvements: result.improvements
      }
    } catch (error) {
      console.error('Basic tailoring failed:', error)
      throw new Error('Failed to tailor resume')
    }
  }

  async batchOptimizeResumes(
    resumeText: string,
    jobDescriptions: Array<{ description: string; role: string; company?: string }>
  ): Promise<Array<{
    jobIndex: number
    role: string
    company?: string
    optimizedResume: string
    atsScore: number
    matchPercentage: number
    processingTime: number
  }>> {
    const results = []

    for (let i = 0; i < jobDescriptions.length; i++) {
      const startTime = Date.now()
      
      try {
        const job = jobDescriptions[i]
        const optimization = await this.optimizeResumeForJob(
          resumeText,
          job.description,
          {
            targetRole: job.role,
            company: job.company,
            optimizationLevel: 'standard'
          }
        )

        results.push({
          jobIndex: i,
          role: job.role,
          company: job.company,
          optimizedResume: optimization.optimizedResume,
          atsScore: optimization.improvements.afterScore,
          matchPercentage: optimization.keywordReport.overallMatch,
          processingTime: Date.now() - startTime
        })
      } catch (error) {
        console.error(`Failed to optimize for job ${i}:`, error)
        results.push({
          jobIndex: i,
          role: jobDescriptions[i].role,
          company: jobDescriptions[i].company,
          optimizedResume: resumeText,
          atsScore: 0,
          matchPercentage: 0,
          processingTime: Date.now() - startTime
        })
      }
    }

    return results
  }

  async getOptimizationPreview(
    resumeText: string,
    jobDescription: string
  ): Promise<{
    currentScore: number
    projectedScore: number
    keyChanges: string[]
    missingKeywords: string[]
    estimatedImpact: number
  }> {
    try {
      // Quick analysis without full optimization
      const jobAnalysis = jobAnalyzer.analyzeJobPosting(jobDescription)
      const currentATS = atsScorer.calculateATSScore(resumeText, jobAnalysis.keywords)
      
      // Simulate optimization impact
      const missingKeywords = jobAnalysis.keywords.filter(keyword => 
        !resumeText.toLowerCase().includes(keyword.toLowerCase())
      ).slice(0, 5)

      const estimatedImpact = Math.min(missingKeywords.length * 3, 25)
      const projectedScore = Math.min(currentATS.score + estimatedImpact, 100)

      return {
        currentScore: currentATS.score,
        projectedScore,
        keyChanges: [`Add ${missingKeywords.length} missing keywords`, 'Optimize formatting for ATS'],
        missingKeywords,
        estimatedImpact
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
      throw new Error('Failed to generate optimization preview')
    }
  }
}

// n8n webhook integration (fallback for advanced AI features)
export const triggerN8nWorkflow = async (workflowName: string, data: any) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL not configured, using local AI processing')
    return { success: false, message: 'External AI service not available' }
  }
  
  try {
    const response = await fetch(`${webhookUrl}/${workflowName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('n8n workflow error:', error)
    throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Export singleton instance
export const aiWorkflowManager = new AIWorkflowManager()

// Convenience functions for common operations
export const analyzeResume = (resumeText: string, targetRole?: string) => 
  aiWorkflowManager.analyzeResume(resumeText, targetRole)

export const optimizeResume = (resumeText: string, jobDescription: string, options?: any) =>
  aiWorkflowManager.optimizeResumeForJob(resumeText, jobDescription, options)

export const getOptimizationPreview = (resumeText: string, jobDescription: string) =>
  aiWorkflowManager.getOptimizationPreview(resumeText, jobDescription)
