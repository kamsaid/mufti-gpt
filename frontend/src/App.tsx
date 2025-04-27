import React, { useEffect, useRef, useState } from "react";
import { Message, ChatResponse } from "./types";
import { ChatBubble } from "./components/ChatBubble";
import { MessageInput } from "./components/MessageInput";
import { Sidebar } from "./components/Sidebar";

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <h1 className="text-xl font-semibold">Yaseen Chat</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((m, idx) => (
            <ChatBubble key={idx} message={m} />
          ))}
          <div ref={bottomRef} />
        </main>
        <MessageInput onSend={sendMessage} loading={loading} />
      </div>
    </div>
  );
};

export default App; 