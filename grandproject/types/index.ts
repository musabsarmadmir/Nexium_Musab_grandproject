// Shared types and interfaces for the application

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface Resume {
  id: string
  userId: string
  filename: string
  content: string
  analysisScore?: number
  createdAt: Date
  updatedAt: Date
}

export interface JobPost {
  id: string
  title: string
  company: string
  description: string
  requirements: string[]
  location: string
  salary?: {
    min: number
    max: number
    currency: string
  }
  postedAt: Date
  source: string
}

export interface JobMatch {
  jobId: string
  userId: string
  score: number
  reasons: string[]
  skillGaps: string[]
  createdAt: Date
}

export interface AnalysisResult {
  score: number
  strengths: string[]
  improvements: string[]
  keywords: string[]
  formatting: string[]
}

export interface OptimizationResult {
  optimizedContent: string
  keywordsSuggested: string[]
  sectionsToEmphasize: string[]
  specificChanges: string[]
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginForm {
  email: string
}

export interface ResumeUploadForm {
  file: File
  jobTitle?: string
  targetCompany?: string
}
