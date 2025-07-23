// Job posting analysis and parsing utilities

export interface JobAnalysisResult {
  jobTitle: string
  company: string
  location: string
  requirements: JobRequirement[]
  skills: JobSkill[]
  experience: ExperienceRequirement
  keywords: string[]
  salary?: SalaryRange
  jobType: string
  benefits: string[]
  description: string
  analysisScore: number
}

export interface JobRequirement {
  requirement: string
  priority: 'required' | 'preferred' | 'nice-to-have'
  category: 'technical' | 'education' | 'experience' | 'soft-skill' | 'certification'
}

export interface JobSkill {
  skill: string
  importance: number
  yearsRequired?: number
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface ExperienceRequirement {
  minimumYears: number
  preferredYears?: number
  relevantFields: string[]
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
}

export interface SalaryRange {
  min?: number
  max?: number
  currency: string
  period: 'hourly' | 'monthly' | 'yearly'
}

export class JobPostingAnalyzer {
  
  analyzeJobPosting(jobText: string): JobAnalysisResult {
    const cleanText = this.cleanJobText(jobText)
    
    return {
      jobTitle: this.extractJobTitle(cleanText),
      company: this.extractCompany(cleanText),
      location: this.extractLocation(cleanText),
      requirements: this.extractRequirements(cleanText),
      skills: this.extractSkills(cleanText),
      experience: this.extractExperienceRequirements(cleanText),
      keywords: this.extractJobKeywords(cleanText),
      salary: this.extractSalaryRange(cleanText),
      jobType: this.extractJobType(cleanText),
      benefits: this.extractBenefits(cleanText),
      description: cleanText,
      analysisScore: this.calculateAnalysisScore(cleanText)
    }
  }

  private cleanJobText(jobText: string): string {
    return jobText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?()-]/g, ' ')
      .trim()
  }

  private extractJobTitle(jobText: string): string {
    // Common patterns for job titles
    const titlePatterns = [
      /job title[:\s]+([^\n]+)/i,
      /position[:\s]+([^\n]+)/i,
      /role[:\s]+([^\n]+)/i,
      /^([^\n]{10,60})\s*$/m, // First line if reasonable length
    ]

    for (const pattern of titlePatterns) {
      const match = jobText.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Fallback: try to extract from common job title keywords
    const commonTitles = [
      'software engineer', 'developer', 'programmer', 'architect',
      'manager', 'director', 'analyst', 'consultant', 'specialist',
      'coordinator', 'administrator', 'technician', 'designer'
    ]

    for (const title of commonTitles) {
      if (jobText.toLowerCase().includes(title)) {
        const regex = new RegExp(`([^\\n]*${title}[^\\n]*)`, 'i')
        const match = jobText.match(regex)
        if (match) {
          return match[1].trim()
        }
      }
    }

    return 'Position Title Not Found'
  }

  private extractCompany(jobText: string): string {
    const companyPatterns = [
      /company[:\s]+([^\n]+)/i,
      /employer[:\s]+([^\n]+)/i,
      /organization[:\s]+([^\n]+)/i,
      /at\s+([A-Z][a-zA-Z\s&]{2,30})\s/,
      /join\s+([A-Z][a-zA-Z\s&]{2,30})\s/i
    ]

    for (const pattern of companyPatterns) {
      const match = jobText.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return 'Company Not Specified'
  }

  private extractLocation(jobText: string): string {
    const locationPatterns = [
      /location[:\s]+([^\n]+)/i,
      /based in[:\s]+([^\n]+)/i,
      /office[:\s]+([^\n]+)/i,
      /(remote|hybrid|on-site)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/,  // City, State format
      /([A-Z][a-z]+,\s*[A-Z][a-z]+)/ // City, Country format
    ]

    for (const pattern of locationPatterns) {
      const match = jobText.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return 'Location Not Specified'
  }

  private extractRequirements(jobText: string): JobRequirement[] {
    const requirements: JobRequirement[] = []
    
    // Split into sections and find requirements
    const sections = this.findRequirementsSections(jobText)
    
    sections.forEach(section => {
      const sectionRequirements = this.parseRequirementsFromSection(section)
      requirements.push(...sectionRequirements)
    })

    return requirements
  }

  private findRequirementsSections(jobText: string): string[] {
    const sectionHeaders = [
      'requirements', 'qualifications', 'must have', 'required',
      'preferred', 'nice to have', 'ideal candidate', 'you should have'
    ]

    const sections: string[] = []
    const lines = jobText.split('\n')
    
    let currentSection = ''
    let inRequirementsSection = false

    lines.forEach(line => {
      const lowerLine = line.toLowerCase().trim()
      
      // Check if this line is a section header
      const isHeader = sectionHeaders.some(header => 
        lowerLine.includes(header) && line.length < 100
      )

      if (isHeader) {
        if (currentSection.trim()) {
          sections.push(currentSection)
        }
        currentSection = line + '\n'
        inRequirementsSection = true
      } else if (inRequirementsSection) {
        // Stop if we hit another major section
        if (lowerLine.includes('responsibilities') || 
            lowerLine.includes('about us') ||
            lowerLine.includes('benefits')) {
          if (currentSection.trim()) {
            sections.push(currentSection)
          }
          currentSection = ''
          inRequirementsSection = false
        } else {
          currentSection += line + '\n'
        }
      }
    })

    if (currentSection.trim()) {
      sections.push(currentSection)
    }

    return sections
  }

  private parseRequirementsFromSection(sectionText: string): JobRequirement[] {
    const requirements: JobRequirement[] = []
    const lines = sectionText.split('\n')

    // Determine section priority
    const sectionLower = sectionText.toLowerCase()
    let priority: 'required' | 'preferred' | 'nice-to-have' = 'required'
    
    if (sectionLower.includes('preferred') || sectionLower.includes('nice to have')) {
      priority = 'preferred'
    }
    if (sectionLower.includes('bonus') || sectionLower.includes('plus')) {
      priority = 'nice-to-have'
    }

    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      // Skip empty lines and headers
      if (!trimmedLine || trimmedLine.length < 10) return
      
      // Check if it's a bullet point or numbered item
      if (trimmedLine.match(/^[\•\-\*\d]/)) {
        const requirement = trimmedLine.replace(/^[\•\-\*\d\.)\s]+/, '').trim()
        if (requirement.length > 5) {
          requirements.push({
            requirement,
            priority,
            category: this.categorizeRequirement(requirement)
          })
        }
      }
    })

    return requirements
  }

  private categorizeRequirement(requirement: string): 'technical' | 'education' | 'experience' | 'soft-skill' | 'certification' {
    const reqLower = requirement.toLowerCase()

    // Technical skills
    if (reqLower.includes('programming') || reqLower.includes('software') ||
        reqLower.includes('coding') || reqLower.includes('development') ||
        reqLower.includes('python') || reqLower.includes('javascript') ||
        reqLower.includes('database') || reqLower.includes('api')) {
      return 'technical'
    }

    // Education
    if (reqLower.includes('degree') || reqLower.includes('bachelor') ||
        reqLower.includes('master') || reqLower.includes('phd') ||
        reqLower.includes('education') || reqLower.includes('university')) {
      return 'education'
    }

    // Experience
    if (reqLower.includes('years') || reqLower.includes('experience') ||
        reqLower.includes('background') || reqLower.includes('worked')) {
      return 'experience'
    }

    // Certifications
    if (reqLower.includes('certified') || reqLower.includes('certification') ||
        reqLower.includes('license') || reqLower.includes('aws') ||
        reqLower.includes('google cloud') || reqLower.includes('azure')) {
      return 'certification'
    }

    // Default to soft skills
    return 'soft-skill'
  }

  private extractSkills(jobText: string): JobSkill[] {
    const skills: JobSkill[] = []
    
    // Common technical skills
    const technicalSkills = [
      'python', 'javascript', 'java', 'c++', 'react', 'angular', 'vue',
      'node.js', 'django', 'flask', 'spring', 'sql', 'mongodb', 'postgresql',
      'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'git',
      'jenkins', 'terraform', 'ansible', 'redis', 'elasticsearch'
    ]

    technicalSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi')
      const matches = jobText.match(regex)
      
      if (matches) {
        const importance = this.calculateSkillImportance(skill, jobText)
        const yearsRequired = this.extractYearsForSkill(skill, jobText)
        
        skills.push({
          skill,
          importance,
          yearsRequired,
          proficiencyLevel: this.determineProficiencyLevel(skill, jobText)
        })
      }
    })

    return skills.sort((a, b) => b.importance - a.importance)
  }

  private calculateSkillImportance(skill: string, jobText: string): number {
    let importance = 5 // Base importance
    
    const skillContext = this.getSkillContext(skill, jobText)
    
    // Increase importance based on context
    if (skillContext.includes('required') || skillContext.includes('must')) {
      importance += 5
    }
    
    if (skillContext.includes('preferred') || skillContext.includes('desired')) {
      importance += 3
    }
    
    if (skillContext.includes('years')) {
      importance += 2
    }
    
    // Frequency matters
    const frequency = (jobText.toLowerCase().match(new RegExp(skill, 'g')) || []).length
    importance += Math.min(frequency - 1, 3)
    
    return Math.min(importance, 15)
  }

  private getSkillContext(skill: string, jobText: string): string {
    const sentences = jobText.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(skill.toLowerCase())) {
        return sentence.toLowerCase()
      }
    }
    
    return ''
  }

  private extractYearsForSkill(skill: string, jobText: string): number | undefined {
    const context = this.getSkillContext(skill, jobText)
    const yearsMatch = context.match(/(\d+)\+?\s*years?/i)
    
    return yearsMatch ? parseInt(yearsMatch[1]) : undefined
  }

  private determineProficiencyLevel(skill: string, jobText: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined {
    const context = this.getSkillContext(skill, jobText)
    
    if (context.includes('expert') || context.includes('advanced')) {
      return 'expert'
    }
    if (context.includes('senior') || context.includes('lead')) {
      return 'advanced'
    }
    if (context.includes('intermediate') || context.includes('mid')) {
      return 'intermediate'
    }
    if (context.includes('junior') || context.includes('entry')) {
      return 'beginner'
    }
    
    return undefined
  }

  private extractExperienceRequirements(jobText: string): ExperienceRequirement {
    const yearsMatch = jobText.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i)
    const minimumYears = yearsMatch ? parseInt(yearsMatch[1]) : 0
    
    const seniorityLevel = this.determineSeniorityLevel(jobText)
    const relevantFields = this.extractRelevantFields(jobText)
    
    return {
      minimumYears,
      relevantFields,
      seniorityLevel
    }
  }

  private determineSeniorityLevel(jobText: string): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' {
    const jobLower = jobText.toLowerCase()
    
    if (jobLower.includes('senior') || jobLower.includes('sr.')) {
      return 'senior'
    }
    if (jobLower.includes('lead') || jobLower.includes('principal')) {
      return 'lead'
    }
    if (jobLower.includes('director') || jobLower.includes('vp') || jobLower.includes('executive')) {
      return 'executive'
    }
    if (jobLower.includes('junior') || jobLower.includes('entry') || jobLower.includes('graduate')) {
      return 'entry'
    }
    
    return 'mid'
  }

  private extractRelevantFields(jobText: string): string[] {
    const fields = [
      'software development', 'web development', 'mobile development',
      'data science', 'machine learning', 'artificial intelligence',
      'cybersecurity', 'devops', 'cloud computing', 'database administration',
      'product management', 'project management', 'marketing', 'sales'
    ]
    
    return fields.filter(field => 
      jobText.toLowerCase().includes(field)
    )
  }

  private extractSalaryRange(jobText: string): SalaryRange | undefined {
    const salaryPatterns = [
      /\$(\d{1,3}(?:,\d{3})*)\s*-\s*\$(\d{1,3}(?:,\d{3})*)\s*(per year|annually|yearly)/i,
      /\$(\d{1,3}(?:,\d{3})*)\s*-\s*\$(\d{1,3}(?:,\d{3})*)\s*k/i,
      /(\d{1,3})k\s*-\s*(\d{1,3})k/i
    ]

    for (const pattern of salaryPatterns) {
      const match = jobText.match(pattern)
      if (match) {
        let min = parseInt(match[1].replace(/,/g, ''))
        let max = parseInt(match[2].replace(/,/g, ''))
        
        // Handle 'k' notation
        if (pattern.source.includes('k')) {
          min *= 1000
          max *= 1000
        }
        
        return {
          min,
          max,
          currency: 'USD',
          period: 'yearly'
        }
      }
    }

    return undefined
  }

  private extractJobType(jobText: string): string {
    const jobTypes = ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'freelance']
    
    for (const type of jobTypes) {
      if (jobText.toLowerCase().includes(type)) {
        return type
      }
    }
    
    return 'full-time' // Default assumption
  }

  private extractBenefits(jobText: string): string[] {
    const commonBenefits = [
      'health insurance', 'dental insurance', 'vision insurance',
      'retirement plan', '401k', 'pto', 'paid time off', 'vacation',
      'remote work', 'flexible hours', 'stock options', 'equity',
      'professional development', 'training', 'conference', 'learning budget'
    ]

    return commonBenefits.filter(benefit => 
      jobText.toLowerCase().includes(benefit)
    )
  }

  private extractJobKeywords(jobText: string): string[] {
    // Import the extractKeywords function from keyword-analyzer
    // For now, implementing a simplified version
    const words = jobText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word))

    // Get unique words and sort by frequency
    const wordFreq: Record<string, number> = {}
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([word]) => word)
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]
    
    return stopWords.includes(word)
  }

  private calculateAnalysisScore(jobText: string): number {
    let score = 0
    
    // Length and detail score (0-30 points)
    const wordCount = jobText.split(/\s+/).length
    if (wordCount > 100) score += 10
    if (wordCount > 300) score += 10
    if (wordCount > 500) score += 10
    
    // Structure score (0-30 points)
    const hasRequirements = jobText.toLowerCase().includes('requirement')
    const hasResponsibilities = jobText.toLowerCase().includes('responsibilit')
    const hasQualifications = jobText.toLowerCase().includes('qualification')
    
    if (hasRequirements) score += 10
    if (hasResponsibilities) score += 10
    if (hasQualifications) score += 10
    
    // Content richness score (0-40 points)
    const hasTechnicalSkills = /python|javascript|sql|aws|react/i.test(jobText)
    const hasYearsExperience = /\d+\s*years?/.test(jobText)
    const hasEducation = /degree|bachelor|master/i.test(jobText)
    const hasBenefits = /benefit|insurance|401k|pto/i.test(jobText)
    
    if (hasTechnicalSkills) score += 10
    if (hasYearsExperience) score += 10
    if (hasEducation) score += 10
    if (hasBenefits) score += 10
    
    return Math.min(score, 100)
  }
}

// Export singleton instance
export const jobAnalyzer = new JobPostingAnalyzer()
