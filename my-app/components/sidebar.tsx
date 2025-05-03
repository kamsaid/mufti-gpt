"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PlusIcon,
  XIcon,
  TrashIcon,
  FileIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useMobile } from "@/hooks/use-mobile"
import { SafeSVG } from "./safe-svg"

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

/**
 * Sidebar component that can be shown/hidden
 * Simplified to only include chat history and new chat button
 */
export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  // Track if the component has mounted to prevent hydration mismatches
  const [hasMounted, setHasMounted] = useState(false)
  
  const [conversations, setConversations] = useState<string[]>([
    "Understanding Salah",
    "Ramadan Practices",
    "Islamic History",
    "Quran Interpretation",
    "Daily Duas",
  ])
  
  // Force dark theme for consistency regardless of environment
  const { setTheme } = useTheme()
  const isMobile = useMobile()

  useEffect(() => {
    setHasMounted(true)
    // Force dark theme on mount
    setTheme("dark")
  }, [setTheme])

  const startNewChat = () => {
    // Logic to start a new chat would go here
    setConversations([`New Chat ${conversations.length + 1}`, ...conversations])
  }

  const clearConversations = () => {
    setConversations([])
  }

  // Handle the case where we're still on the server or during initial hydration
  if (!hasMounted) {
    return null; // Don't render anything during SSR/hydration
  }

  // Use JSX inline styles to avoid typing issues
  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }} 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside 
        style={{
          position: isMobile ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: isMobile ? '75%' : '16rem',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          borderRight: '1px solid #334155',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* New Chat Button */}
        <div style={{padding: '0.5rem'}}>
          <Button
            onClick={startNewChat}
            variant="outline"
            className="w-full justify-start text-sm bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
          >
            <SafeSVG>
              <PlusIcon size={16} className="mr-2" />
            </SafeSVG>
            New chat
          </Button>

          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-sidebar-foreground">
              <SafeSVG>
                <XIcon size={20} />
              </SafeSVG>
            </Button>
          )}
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <div className="text-xs font-medium text-sidebar-foreground opacity-70 px-3 py-2">Chat History</div>
            {conversations.map((title, i) => (
              <Button
                key={i}
                variant="ghost"
                className="w-full justify-start text-left text-sm font-normal truncate text-sidebar-foreground"
              >
                <SafeSVG>
                  <FileIcon size={16} className="mr-2 text-sidebar-foreground opacity-70 flex-shrink-0" />
                </SafeSVG>
                <span className="truncate">{title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm font-normal text-sidebar-foreground"
            onClick={clearConversations}
          >
            <SafeSVG>
              <TrashIcon size={16} className="mr-2 text-sidebar-foreground opacity-70" />
            </SafeSVG>
            Clear conversations
          </Button>

          <div className="text-xs text-sidebar-foreground opacity-70 mt-4 text-center">Yaseen - Islamic Q&A Assistant</div>
        </div>
      </aside>
    </>
  )
}

