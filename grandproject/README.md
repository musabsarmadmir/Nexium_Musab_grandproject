# Grand Project - AI-Powered Resume & Job Matching Platform

## Overview
This project is an AI-powered platform that helps users optimize their resumes and match them with relevant job opportunities.

## Tech Stack

| Layer           | Tooling/Stack                                             |
| --------------- | --------------------------------------------------------- |
| **Frontend**    | Next.js + TailwindCSS                                     |
| **Backend**     | Supabase (structured data), MongoDB (raw job post text)   |
| **Auth**        | Magic link (email login via Supabase)                     |
| **AI Logic**    | n8n (simulated or local AI flow)                          |
| **CI/CD**       | GitHub + Vercel                                           |
| **Bonus Tools** | Zod (form validation), Prisma (optional ORM for Supabase) |

## Project Structure

```
/grand-project/
├── /app/              # Frontend UI (Next.js)
│   ├── /components/   # React components
│   ├── /pages/        # Next.js pages
│   └── /styles/       # CSS and styling files
├── /api/              # Auth, resume logic
├── /ai/               # n8n flows + prompt logic
├── /docs/             # PRD, walkthroughs
├── .env.local         # Environment variables
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server: `npm run dev`

## Environment Setup

Copy `.env.local` and fill in your credentials:
- Supabase URL and keys
- MongoDB connection string
- n8n webhook URL
- Magic link configuration

## Development

- Frontend: Next.js with TailwindCSS
- Backend APIs: Supabase for structured data, MongoDB for raw job posts
- Authentication: Magic link via Supabase
- AI Workflows: n8n integration

## Deployment

This project is configured for deployment on Vercel with automatic GitHub integration.
