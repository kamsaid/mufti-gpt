"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * ThemeProvider component wraps the application with the next-themes provider
 * for theme management (light/dark mode)
 * 
 * Using forcedTheme="dark" to ensure theme consistency in all environments
 * including incognito mode where localStorage may not be available
 */
export function ThemeProvider({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode 
  [key: string]: any
}) {
  return <NextThemesProvider forcedTheme="dark" {...props}>{children}</NextThemesProvider>
} 