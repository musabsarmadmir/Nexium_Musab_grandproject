// API endpoint for optimization preview
import { NextRequest, NextResponse } from 'next/server'
import { aiWorkflowManager } from '@/ai/workflows'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, jobDescription } = body

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      )
    }

    const preview = await aiWorkflowManager.getOptimizationPreview(
      resumeText,
      jobDescription
    )

    return NextResponse.json({
      success: true,
      data: preview
    })

  } catch (error) {
    console.error('Preview API error:', error)
    return NextResponse.json(
      { 
        error: 'Preview generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
