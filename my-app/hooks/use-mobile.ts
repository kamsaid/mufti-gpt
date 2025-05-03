"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect if the current viewport is mobile sized
 * Enhanced to work reliably in all browser contexts including incognito mode
 */
export const useMobile = (): boolean => {
  // Default to desktop view until client-side code runs
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // Set mounted state to confirm we're in browser environment
    setHasMounted(true)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Adjust breakpoint as needed
    }

    // Set initial value
    if (typeof window !== 'undefined') {
      handleResize()
    }

    // Listen for window resize events
    window.addEventListener("resize", handleResize)

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // If not mounted yet, assume desktop view for SSR
  return hasMounted ? isMobile : false
}

