import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Matriz de Eisenhower ',
  description: 'Created with v0, refined with Next.js, captured by Martín Fernandez',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
