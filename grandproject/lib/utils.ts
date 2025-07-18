// Utility functions and helpers

export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const calculateMatchPercentage = (score: number): string => {
  return `${Math.round(score * 100)}%`
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const extractTextFromFile = async (file: File): Promise<string> => {
  // This would implement actual file text extraction
  // For now, returning a placeholder
  return `Extracted text from ${file.name}`
}

export const downloadFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const classNames = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

// Constants
export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const SCORE_RANGES = {
  EXCELLENT: { min: 90, max: 100, label: 'Excellent', color: 'green' },
  GOOD: { min: 75, max: 89, label: 'Good', color: 'blue' },
  FAIR: { min: 60, max: 74, label: 'Fair', color: 'yellow' },
  POOR: { min: 0, max: 59, label: 'Needs Improvement', color: 'red' },
}

export const getScoreCategory = (score: number) => {
  for (const [key, range] of Object.entries(SCORE_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return range
    }
  }
  return SCORE_RANGES.POOR
}
