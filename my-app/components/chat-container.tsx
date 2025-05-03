"use client"

import type React from "react"

import { type FormEvent, useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendIcon, StopCircleIcon, RefreshCwIcon } from "lucide-react"
import { ChatMessage } from "@/components/chat-message"
import type { Message } from "ai"
import { EmptyState } from "@/components/empty-state"
import { SafeSVG } from "./safe-svg"

interface ChatContainerProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: Error | null
  reload: () => void
  stop: () => void
}

/**
 * ChatContainer component that displays messages and input field
 * Enhanced with inline styles for better cross-environment display
 */
export function ChatContainer({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  reload,
  stop,
}: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Use hasMounted pattern to safely handle client-side only rendering
  const [hasMounted, setHasMounted] = useState(false)

  // Inline styles for consistent rendering
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#0f172a',
  };

  const scrollAreaStyles = {
    flex: '1 1 auto',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: messages.length === 0 ? 'center' : 'flex-start',
  };

  const messagesContainerStyles = {
    paddingBottom: '8rem',
    paddingTop: '1.25rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    maxWidth: '48rem',
    margin: '0 auto',
    width: '100%',
  };

  const inputAreaStyles = {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '1rem',
    backgroundColor: '#0f172a',
    borderTop: '1px solid #334155',
  };

  const inputWrapperStyles = {
    maxWidth: '36rem',
    margin: '0 auto',
    position: 'relative' as const,
  };

  const inputContainerStyles = {
    position: 'relative' as const,
    borderRadius: '0.75rem',
    border: '1px solid #334155',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  };

  const inputStyles = {
    padding: '1.25rem 1rem',
    paddingRight: '6rem',
    backgroundColor: 'transparent',
    border: 0,
    width: '100%',
    color: '#e2e8f0',
    fontSize: '0.875rem',
  };

  const actionsContainerStyles = {
    position: 'absolute' as const,
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    gap: '0.5rem',
  };

  const footerStyles = {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textAlign: 'center' as const,
    marginTop: '0.5rem',
  };

  const sendButtonStyles = {
    backgroundColor: '#25c55d',
    color: '#0f172a',
    borderRadius: '0.5rem',
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: input.trim() === "" ? 'not-allowed' : 'pointer',
    opacity: input.trim() === "" ? 0.5 : 1,
  };

  const stopButtonStyles = {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    borderRadius: '0.375rem',
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  };

  const errorStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1rem 0',
  };

  const errorContentStyles = {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fee2e2',
    borderRadius: '0.5rem',
    padding: '1rem',
    maxWidth: '24rem',
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount and set mounted state
  useEffect(() => {
    setHasMounted(true)
    
    // Only focus if we're in the browser environment
    if (typeof window !== 'undefined' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Don't render client-side only components until after hydration
  if (!hasMounted) {
    return (
      <div style={containerStyles}>
        <div style={scrollAreaStyles} ref={scrollAreaRef}>
          <EmptyState />
        </div>
        <div style={inputAreaStyles}>
          <div style={inputWrapperStyles}>
            <div style={inputContainerStyles}>
              <div style={{height: '56px'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      {/* Chat Messages */}
      <div style={scrollAreaStyles} ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={messagesContainerStyles}>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} isLastMessage={index === messages.length - 1 && isLoading} />
            ))}

            {error && (
              <div style={errorStyles}>
                <div style={errorContentStyles}>
                  <p>An error occurred. Please try again.</p>
                  <Button variant="outline" size="sm" onClick={reload} className="mt-2">
                    <SafeSVG>
                      <RefreshCwIcon size={14} className="mr-1" />
                    </SafeSVG>
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={inputAreaStyles}>
        <form onSubmit={handleSubmit} style={inputWrapperStyles}>
          <div style={inputContainerStyles}>
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Yaseen"
              style={inputStyles}
            />

            <div style={actionsContainerStyles}>
              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  style={stopButtonStyles}
                >
                  <SafeSVG>
                    <StopCircleIcon size={18} />
                  </SafeSVG>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={input.trim() === ""}
                  style={sendButtonStyles}
                >
                  <SafeSVG>
                    <SendIcon size={18} />
                  </SafeSVG>
                </button>
              )}
            </div>
          </div>

          <div style={footerStyles}>
            Yaseen can make mistakes. Consider checking important information.
          </div>
        </form>
      </div>
    </div>
  )
} 