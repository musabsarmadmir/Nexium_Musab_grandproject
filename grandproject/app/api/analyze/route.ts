// API endpoint for resume analysis
import { NextRequest, NextResponse } from 'next/server'
import { aiWorkflowManager } from '@/ai/workflows'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, targetRole } = body

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      )
    }

    const analysis = await aiWorkflowManager.analyzeResume(resumeText, targetRole)

    return NextResponse.json({
      success: true,
      data: {
        score: analysis.score,
        breakdown: analysis.breakdown,
        recommendations: analysis.recommendations,
        passesATS: analysis.passesATS
      }
    })

  } catch (error) {
    console.error('Resume analysis API error:', error)
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
