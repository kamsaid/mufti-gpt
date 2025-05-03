"use client"

import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
import { SafeSVG } from "./safe-svg"

interface HeaderProps {
  toggleSidebar: () => void
}

/**
 * Header component with menu icon for opening the sidebar
 * Works on both mobile and desktop
 */
export function MobileHeader({ toggleSidebar }: HeaderProps) {
  // Inline styles for consistent rendering
  const headerStyles = {
    borderBottom: '1px solid #334155',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  };

  const logoStyles = {
    flex: '1 1 auto',
    textAlign: 'center' as const,
    fontWeight: 500,
    color: '#e2e8f0',
  };

  return (
    <header style={headerStyles}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        style={{color: '#e2e8f0'}}
      >
        <SafeSVG>
          <MenuIcon size={20} />
        </SafeSVG>
      </Button>
      <div style={logoStyles}>
        Yaseen
        <span style={{marginLeft: '0.25rem', fontSize: '0.75rem', color: '#94a3b8'}}>▼</span>
      </div>
      <div style={{width: '2.25rem'}}></div> {/* Spacer for balance */}
    </header>
  )
}
