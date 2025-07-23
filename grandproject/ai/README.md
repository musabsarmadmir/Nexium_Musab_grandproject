# 🤖 AI Engine Documentation

## Overview
The AI engine powers the core resume optimization functionality with keyword matching, ATS scoring, and intelligent tailoring algorithms.

## Architecture

```
ai/
├── tailor-engine.ts      # Core resume tailoring logic
├── ats-scorer.ts         # ATS compatibility scoring
├── job-analyzer.ts       # Job posting analysis
├── keyword-analyzer.ts   # Keyword extraction & matching
├── resume-optimizer.ts   # High-level optimization orchestration
├── workflows.ts          # API workflow management
├── test-suite.ts         # Comprehensive tests
└── test-runner.ts        # CLI test runner
```

## Core Components

### 1. **Resume Tailoring Engine** (`tailor-engine.ts`)
- Analyzes job requirements vs resume content
- Suggests keyword additions and content improvements
- Calculates match scores and identifies gaps

### 2. **ATS Scorer** (`ats-scorer.ts`)
- Evaluates resume ATS compatibility (0-100 score)
- Analyzes format, keywords, structure, and content
- Provides actionable recommendations

### 3. **Job Analyzer** (`job-analyzer.ts`)
- Extracts key information from job postings
- Identifies required vs preferred skills
- Categorizes requirements by importance

### 4. **Keyword Analyzer** (`keyword-analyzer.ts`)
- Extracts and prioritizes keywords
- Matches technical skills, soft skills, and industry terms
- Calculates keyword density and importance

### 5. **Resume Optimizer** (`resume-optimizer.ts`)
- Orchestrates the complete optimization process
- Supports multiple optimization levels (basic/standard/aggressive)
- Provides before/after analysis and recommendations

## API Endpoints

### POST `/api/optimize`
Optimize resume for a specific job posting.

**Request:**
```json
{
  "resumeText": "Your resume content...",
  "jobDescription": "Job posting text...",
  "optimizationLevel": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimizedResume": "Enhanced resume text...",
    "atsScore": 85,
    "improvement": 15,
    "keyChanges": ["Added missing keywords", "Enhanced formatting"],
    "processingTime": 1250,
    "recommendations": [...]
  }
}
```

### POST `/api/analyze`
Analyze resume ATS compatibility.

**Request:**
```json
{
  "resumeText": "Your resume content...",
  "targetRole": "Software Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 78,
    "breakdown": {
      "keywordMatch": 75,
      "formatScore": 85,
      "contentScore": 80,
      "lengthScore": 90,
      "structureScore": 85
    },
    "recommendations": [...],
    "passesATS": true
  }
}
```

### POST `/api/preview`
Get optimization preview without full processing.

**Request:**
```json
{
  "resumeText": "Your resume content...",
  "jobDescription": "Job posting text..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentScore": 65,
    "projectedScore": 82,
    "keyChanges": ["Add 5 missing keywords", "Optimize formatting"],
    "missingKeywords": ["python", "docker", "kubernetes"],
    "estimatedImpact": 17
  }
}
```

## Testing

### Run Quick Test
```bash
npm run test-ai-quick
```

### Run Full Test Suite
```bash
npm run test-ai-full
```

### Run Performance Tests
```bash
npm run test-ai performance
```

## Configuration

### Optimization Levels

**Basic** (`basic`)
- Conservative keyword additions
- Minimal content changes
- Focus on high-impact, low-risk improvements

**Standard** (`standard`)
- Balanced approach with moderate changes
- Keyword optimization and content enhancement
- Recommended for most users

**Aggressive** (`aggressive`)
- Maximum optimization with extensive changes
- Advanced keyword integration
- Highest potential score improvement

### Keyword Importance Weights

The system uses weighted scoring for different keyword categories:

- **Technical Skills**: 8-10 (highest priority)
- **Required Experience**: 7-9
- **Certifications**: 6-9
- **Soft Skills**: 5-7
- **Industry Terms**: 4-6

## Error Handling

The AI engine includes comprehensive error handling:

- **Validation Errors**: Invalid input format or missing data
- **Processing Errors**: Algorithm failures with fallback options
- **Performance Monitoring**: Tracking processing times and success rates

## Performance Benchmarks

- **Analysis Time**: < 500ms for typical resume
- **Optimization Time**: < 2000ms for standard level
- **Memory Usage**: < 50MB per optimization
- **Accuracy**: 85%+ keyword match detection

## Future Enhancements

### Phase 2 Features
- [ ] Industry-specific optimization templates
- [ ] Cover letter generation
- [ ] Interview question preparation
- [ ] Salary negotiation insights

### Advanced AI Integration
- [ ] GPT-4 integration for content rewriting
- [ ] Real-time job market analysis
- [ ] Personalized career path recommendations
- [ ] A/B testing for optimization strategies

## Troubleshooting

### Common Issues

**Low ATS Scores**
- Check for missing keywords in job description
- Verify resume format is ATS-friendly
- Ensure standard section headers are used

**Slow Processing**
- Reduce optimization level to 'basic'
- Check system memory availability
- Verify input text length is reasonable

**Inconsistent Results**
- Ensure job description quality is sufficient
- Check for special characters in resume text
- Verify keyword extraction is working properly

### Debug Mode

Enable detailed logging:
```typescript
process.env.AI_DEBUG = 'true'
```

This will output detailed processing steps and intermediate results to help diagnose issues.
