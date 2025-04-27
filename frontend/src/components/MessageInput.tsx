import React, { useState } from "react";

interface Props {
  onSend: (text: string) => void;
  loading: boolean;
}

export const MessageInput: React.FC<Props> = ({ onSend, loading }) => {
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
    <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Type your question..."
        className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-transparent p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white"
      >
        Send
      </button>
    </div>
  );
}; 