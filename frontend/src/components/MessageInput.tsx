import React, { useState } from "react";

interface Props {
  onSend: (text: string) => void;
  loading: boolean;
  /**
   * variant determines visual style:
   * - "chat" (default) shows border top and bottom alignment
   * - "hero" centers within intro header without top border
   */
  variant?: "chat" | "hero";
}

export const MessageInput: React.FC<Props> = ({ onSend, loading, variant = "chat" }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 p-3 backdrop-blur-sm bg-gray-800/30 ${
        variant === "chat" ? "border-t border-gray-700" : "w-full max-w-xl mx-auto rounded-lg border border-gray-700"
      }`}
    >
      {/*
        Using a textarea allows multi-line questions. `aria-label` improves screen-reader support.
        We hide the resizer and keep a single-row height by default; Shift+Enter makes new lines.
      */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Message Yaseen..."
        aria-label="Message Yaseen"
        className="flex-1 resize-none bg-transparent text-sm leading-5 text-gray-100 placeholder-gray-400 focus:outline-none"
      />
      {/* Send button with inline SVG arrow icon for minimal deps */}
      <button
        onClick={handleSend}
        disabled={loading}
        aria-label="Send message"
        className="grid place-items-center h-9 w-9 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {/* right-arrow icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-white"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}; 