"use client"

import { useState, useEffect, ReactNode } from 'react'

/**
 * This component safely renders SVG content only on the client side
 * to prevent hydration errors between server and client rendering
 * 
 * Enhanced to provide a stable DOM structure for smoother hydration
 * and better support for incognito mode environments
 */
export function SafeSVG({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Only set mounted state in browser environment
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  // Return an empty span with the same dimensions to maintain layout during hydration
  if (!isMounted) {
    return <span className="inline-block w-[18px] h-[18px]" aria-hidden="true" />
  }

  return <>{children}</>
} 