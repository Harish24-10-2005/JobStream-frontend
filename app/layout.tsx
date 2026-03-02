import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobStream — AI Career Command Center',
  description: 'Autonomous job application flows with live browser control, AI agents, and human-in-the-loop approvals.',
  keywords: ['AI', 'job search', 'career', 'resume', 'cover letter', 'interview prep'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%23ff8a1f"/><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23111" font-size="16" font-weight="bold" font-family="sans-serif">JS</text></svg>' />
      </head>
      <body>{children}</body>
    </html>
  )
}
