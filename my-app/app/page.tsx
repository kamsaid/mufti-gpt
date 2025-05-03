"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Sidebar } from "@/components/sidebar"
import { ChatContainer } from "@/components/chat-container"
import { MobileHeader } from "@/components/mobile-header"
import { useMobile } from "@/hooks/use-mobile"

/**
 * Custom fetch function to adapt between Vercel AI SDK and our backend
 */
const customFetch = async (
  input: RequestInfo | URL, 
  init?: RequestInit
): Promise<Response> => {
  console.log("Request URL:", input);
  console.log("Request init:", init);
  
  // Prepare request body - ensure message content is in the right format
  if (init?.body) {
    const body = JSON.parse(init.body as string);
    console.log("Original request body:", body);
    
    // Make the original request to our backend
    const response = await fetch(input, {
      ...init,
      headers: {
        ...init.headers,
        'Content-Type': 'application/json',
      }
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Get the original data
    const data = await response.json();
    console.log("Backend response:", data);
    
    // Convert our backend format to Vercel AI SDK format
    // Our format: { answer: string, citations: array, confidence: number }
    // Vercel AI SDK expects a ReadableStream for streaming
    // Since we're not streaming, we'll create a simple response
    const adaptedMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: data.answer,
      // You can add additional metadata if needed
      createdAt: new Date(),
    };
    
    // Create a new response with the adapted format
    // For non-streaming, we return a JSON response with the formatted data
    return new Response(JSON.stringify({ 
      messages: [adaptedMessage],
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  // If there's no body, just pass through the request
  return fetch(input, init);
};

/**
 * Main home page component that handles the chat interface
 * Enhanced with inline styles to ensure consistent display across all environments
 */
export default function Home() {
  // Always start with sidebar closed
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMobile()
  const [hasMounted, setHasMounted] = useState(false)

  // Inline styles for consistent rendering
  const pageStyles = {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
  };

  const mainContentStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: '1 1 auto',
    height: '100%',
    overflow: 'hidden',
  };

  // Use client-side only hooks after component mounts
  useEffect(() => {
    setHasMounted(true)
    
    // Force the body to have dark background
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#e2e8f0';
    document.documentElement.classList.add('dark');
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, stop } = useChat({
    initialMessages: [],
    // Point to the backend API server with the correct endpoint
    api: 'http://localhost:8000/chat',
    // Use our custom fetch function to adapt the response format
    fetch: customFetch,
    // We're not streaming so set to text
    streamProtocol: 'text',
    // Log errors
    onError: (error) => {
      console.error("Chat error:", error);
    }
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Handle pre-hydration state to avoid layout shifts
  if (!hasMounted) {
    return (
      <div style={pageStyles}>
        <div style={mainContentStyles}>
          <div style={{flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{animation: 'pulse 2s infinite', backgroundColor: 'rgba(148, 163, 184, 0.2)', height: '8rem', width: '8rem', borderRadius: '9999px'}}></div>
          </div>
        </div>
      </div>
    )
  }

  // Custom submit handling to ensure message is valid
  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Make sure input is at least 3 characters
    if (input.trim().length < 3) {
      alert("Please enter at least 3 characters for your question.");
      return;
    }
    
    // Use the standard handler
    handleSubmit(e);
  }

  return (
    <div style={pageStyles}>
      {/* Sidebar - hidden by default, shown when button is clicked */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div style={mainContentStyles}>
        {/* Always show the header with menu button */}
        <MobileHeader toggleSidebar={toggleSidebar} />

        <ChatContainer
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleCustomSubmit}
          isLoading={isLoading}
          error={error as Error | null}
          reload={reload}
          stop={stop}
        />
      </div>
    </div>
  )
}
