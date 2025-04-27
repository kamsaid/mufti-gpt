import React, { useState, useEffect } from "react";
import { Message } from "../types";

interface Props {
  message: Message;
}

const STORAGE_KEY_PREFIX = "yaseen-feedback-";

export const FeedbackButtons: React.FC<Props> = ({ message }) => {
  const [selection, setSelection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const key = STORAGE_KEY_PREFIX + hash(message.content);
    const existing = localStorage.getItem(key);
    if (existing === "up" || existing === "down") setSelection(existing);
  }, [message.content]);

  const handleClick = (value: "up" | "down") => {
    const key = STORAGE_KEY_PREFIX + hash(message.content);
    localStorage.setItem(key, value);
    setSelection(value);
  };

  return (
    <div className="flex gap-2 mt-3">
      <button
        aria-label="Thumbs up"
        className={`p-1 rounded ${selection === "up" ? "bg-green-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        onClick={() => handleClick("up")}
      >
        👍
      </button>
      <button
        aria-label="Thumbs down"
        className={`p-1 rounded ${selection === "down" ? "bg-red-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        onClick={() => handleClick("down")}
      >
        👎
      </button>
    </div>
  );
};

// Simple DJB2 hash for consistent keys
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
} 