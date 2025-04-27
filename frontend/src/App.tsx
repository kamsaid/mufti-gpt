import React, { useEffect, useRef, useState } from "react";
import { Message, ChatResponse } from "./types";
import { ChatBubble } from "./components/ChatBubble";
import { MessageInput } from "./components/MessageInput";
import { IntroHero } from "./components/IntroHero";

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    // Append user message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      // Determine API base URL:
      // 1. Use VITE_API_URL if set (via env var)
      // 2. If running on localhost without proxy, call backend at localhost:8000
      // 3. In production (e.g. nginx), use relative paths ('') to leverage nginx proxy
      const viteUrl = import.meta.env.VITE_API_URL;
      let API_BASE: string;
      if (viteUrl) {
        API_BASE = viteUrl;
      } else if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        API_BASE = "http://localhost:8000";
      } else {
        API_BASE = "";
      }
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          confidence: data.confidence,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, an error occurred. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showIntro = messages.length === 0;

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-gray-100">
      {/* Intro hero appears only before any message is sent */}
      {showIntro ? (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center gap-8">
          <IntroHero />
          {/* MessageInput embedded in hero */}
          <MessageInput
            onSend={sendMessage}
            loading={loading}
            variant="hero"
          />
        </div>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((m, idx) => (
              <ChatBubble key={idx} message={m} />
            ))}
            <div ref={bottomRef} />
          </main>
          {/* Fixed bottom input for continuing chat */}
          <div className="sticky bottom-0 w-full bg-neutral-900/80 backdrop-blur-md">
            <MessageInput onSend={sendMessage} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
};

export default App; 