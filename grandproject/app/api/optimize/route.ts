// API endpoint for resume optimization
import { NextRequest, NextResponse } from 'next/server'
import { aiWorkflowManager } from '@/ai/workflows'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, jobDescription, optimizationLevel = 'standard' } = body

    // Validate input
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      )
    }

    // Process optimization
    const result = await aiWorkflowManager.optimizeResumeForJob(
      resumeText,
      jobDescription,
      { optimizationLevel }
    )

    return NextResponse.json({
      success: true,
      data: {
        optimizedResume: result.optimizedResume,
        atsScore: result.improvements.afterScore,
        improvement: result.improvements.improvement,
        keyChanges: result.improvements.keyChanges,
        processingTime: result.processingTime,
        recommendations: result.recommendations
      }
    })

  } catch (error) {
    console.error('Resume optimization API error:', error)
    return NextResponse.json(
      { 
        error: 'Optimization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Resume Optimization API',
    endpoints: {
      'POST /api/optimize': 'Optimize resume for job posting',
      'POST /api/analyze': 'Analyze resume ATS score',
      'POST /api/preview': 'Get optimization preview'
    }
  })
}
