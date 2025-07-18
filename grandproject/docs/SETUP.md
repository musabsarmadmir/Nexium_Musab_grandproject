# Development Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- VS Code (recommended)

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd grand-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.local` and fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# n8n
N8N_WEBHOOK_URL=your_n8n_webhook_url

# Auth
MAGIC_LINK_SECRET_KEY=your_magic_link_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

#### Supabase Setup
1. Create a new Supabase project
2. Run the SQL migrations in `/docs/database/supabase-schema.sql`
3. Enable authentication and configure magic link settings

#### MongoDB Setup
1. Create a MongoDB Atlas cluster or local instance
2. Create database indexes for job search functionality
3. Set up collections: `jobPosts`, `userProfiles`, `resumeAnalytics`

### 5. n8n Workflow Setup
1. Install n8n locally or use n8n cloud
2. Import workflows from `/ai/n8n-workflows/`
3. Configure webhook URLs in environment variables

## Development

### Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
/grand-project/
├── /app/              # Next.js App Router
│   ├── /components/   # Reusable UI components
│   ├── /pages/        # Page components
│   └── /styles/       # CSS and styling
├── /api/              # Backend API logic
├── /ai/               # AI workflows and prompts
├── /docs/             # Documentation and guides
├── .env.local         # Environment variables
├── vercel.json        # Deployment configuration
└── README.md
```

## Key Features Implementation

### Authentication Flow
1. User enters email on login page
2. Magic link sent via Supabase Auth
3. User clicks link and gets redirected back
4. Session established and user profile created

### Resume Analysis
1. User uploads resume file
2. File processed and text extracted
3. Text sent to n8n workflow for AI analysis
4. Results stored in Supabase and displayed to user

### Job Matching
1. Job postings stored in MongoDB
2. User profile and preferences in Supabase
3. Matching algorithm runs via n8n workflow
4. Results ranked and presented to user

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure all environment variables are set
- Check TypeScript compilation errors
- Verify all dependencies are installed

**Database Connection Issues**
- Verify connection strings in environment variables
- Check database server status
- Ensure proper network access and firewall settings

**n8n Workflow Issues**
- Verify webhook URLs are accessible
- Check workflow activation status
- Review n8n logs for errors

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment-Specific Configurations
- Development: Local databases and n8n instance
- Staging: Cloud databases with test data
- Production: Production databases with real data

## Contributing

1. Create feature branch from main
2. Make changes and test locally
3. Submit pull request with description
4. Code review and merge to main
