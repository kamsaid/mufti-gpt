import type React from "react"
import type { Metadata } from "next"
import { Amiri, Scheherazade_New } from "next/font/google"
import "./globals.css"
import "./force-styles.css" // Import the force styles
import "./emergency-styles.css" // Import emergency styles
import { ThemeProvider } from "@/components/theme-provider"

// Islamic-style font for headings
const scheherazade = Scheherazade_New({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-scheherazade",
  display: "swap", // Ensure text remains visible during webfont load
})

// Islamic-style font for body text
const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap", // Ensure text remains visible during webfont load
})

export const metadata: Metadata = {
  title: "Yaseen - Islamic Q&A Assistant",
  description: "Your companion for Islamic knowledge and guidance",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to Google Fonts to improve font loading performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical inline styles to ensure the page looks correct immediately */}
        <style dangerouslySetInnerHTML={{ __html: `
          body, html { 
            background-color: #0f172a !important; 
            color: #e2e8f0 !important; 
          }
          .dark {
            color-scheme: dark;
          }
        `}} />
      </head>
      <body className={`${scheherazade.variable} ${amiri.variable} font-amiri bg-background text-foreground`}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false} 
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
