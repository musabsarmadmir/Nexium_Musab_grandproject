import React from 'react'
import './styles/globals.css'

export const metadata = {
  title: 'Grand Project - AI Resume & Job Matching',
  description: 'AI-powered platform for resume optimization and job matching',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
