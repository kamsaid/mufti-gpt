"use client"

import type { Message } from "ai"
import { UserIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { SafeSVG } from "./safe-svg"

interface ChatMessageProps {
  message: Message
  isLastMessage?: boolean
}

/**
 * ChatMessage component displays a single message in the chat
 * Enhanced with inline styles for consistent display across all environments
 */
export function ChatMessage({ message, isLastMessage = false }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [hasMounted, setHasMounted] = useState(false)
  const [messageContent, setMessageContent] = useState("")

  // Process the message content to handle potential JSON format
  useEffect(() => {
    if (!message.content) return;

    try {
      // Check if the content is actually a JSON string
      if (typeof message.content === 'string' && 
          (message.content.startsWith('{') || message.content.startsWith('['))) {
        const parsed = JSON.parse(message.content);
        
        // Handle different JSON structures
        if (parsed.messages && Array.isArray(parsed.messages)) {
          // Format from the custom fetch function
          const assistantMessage = parsed.messages.find((msg: any) => msg.role === 'assistant');
          if (assistantMessage && assistantMessage.content) {
            setMessageContent(assistantMessage.content);
          } else {
            setMessageContent(message.content);
          }
        } else if (parsed.content) {
          // Direct content in JSON
          setMessageContent(parsed.content);
        } else if (parsed.answer) {
          // Our backend format
          setMessageContent(parsed.answer);
        } else {
          // Unknown JSON structure, show as is
          setMessageContent(message.content);
        }
      } else {
        // Plain text
        setMessageContent(message.content);
      }
    } catch (e) {
      // Not JSON or parsing error, use original content
      setMessageContent(message.content);
    }
  }, [message.content]);

  // Inline styles for consistent rendering
  const messageContainerStyles = {
    padding: '1.25rem 0',
    borderBottom: '1px solid #334155',
  };

  const messageRowStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    maxWidth: '48rem',
    margin: '0 auto',
  };

  const avatarStyles = {
    flexShrink: 0,
  };

  const userAvatarStyles = {
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '9999px',
    backgroundColor: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const botAvatarStyles = {
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '9999px',
    backgroundColor: '#25c55d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const contentContainerStyles = {
    flex: '1 1 0%',
    minWidth: 0,
  };

  const nameStyles = {
    fontWeight: 500,
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
    color: '#e2e8f0',
  };

  const messageTextStyles = {
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap' as const,
  };

  const cursorStyles = {
    display: 'inline-block',
    width: '0.375rem',
    height: '1rem',
    marginLeft: '0.25rem',
    backgroundColor: '#25c55d',
    animation: 'pulse 1.5s infinite',
  };

  // Set mounted state on client
  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <div style={messageContainerStyles}>
      {/* Avatar and Message Row */}
      <div style={messageRowStyles}>
        <div style={avatarStyles}>
          {isUser ? (
            <div style={userAvatarStyles}>
              {hasMounted && (
                <SafeSVG>
                  <UserIcon size={14} style={{color: '#94a3b8'}} />
                </SafeSVG>
              )}
            </div>
          ) : (
            <div style={botAvatarStyles}>
              <span style={{fontSize: '0.75rem', color: '#0f172a', fontWeight: 'bold'}}>ي</span>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div style={contentContainerStyles}>
          <div style={nameStyles}>{isUser ? "You" : "Yaseen"}</div>

          <div style={messageTextStyles}>
            {messageContent}
            {isLastMessage && <span style={cursorStyles} />}
          </div>
        </div>
      </div>

      {/* Add a style tag for animations */}
      {hasMounted && (
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      )}
    </div>
  )
}

