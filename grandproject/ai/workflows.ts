// n8n workflow configurations and prompts

export const WORKFLOWS = {
  RESUME_ANALYSIS: 'resume-analysis',
  JOB_MATCHING: 'job-matching',
  RESUME_OPTIMIZATION: 'resume-optimization',
}

export const PROMPTS = {
  ANALYZE_RESUME: `
    Analyze the following resume and provide:
    1. Overall score (1-100)
    2. Key strengths
    3. Areas for improvement
    4. Missing keywords for target roles
    5. Formatting suggestions
    
    Resume: {resume_text}
  `,
  
  MATCH_JOBS: `
    Match the candidate's profile with available job postings:
    
    Candidate Profile: {candidate_profile}
    Job Postings: {job_postings}
    
    Provide:
    1. Match percentage for each job
    2. Reasons for good matches
    3. Skills gaps for lower matches
  `,
  
  OPTIMIZE_RESUME: `
    Optimize the resume for the target job description:
    
    Current Resume: {current_resume}
    Target Job: {job_description}
    
    Provide:
    1. Optimized resume content
    2. Keywords to include
    3. Sections to emphasize
    4. Specific changes made
  `,
}

// n8n webhook integration
export const triggerN8nWorkflow = async (workflowName: string, data: any) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  
  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL not configured')
  }
  
  try {
    const response = await fetch(`${webhookUrl}/${workflowName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    return await response.json()
  } catch (error) {
    console.error('n8n workflow error:', error)
    throw error
  }
}
