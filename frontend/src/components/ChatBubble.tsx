import React from "react";
import ReactMarkdown from "react-markdown";
import { Citation, Message } from "../types";
import { FeedbackButtons } from "./FeedbackButtons";

interface Props {
  message: Message;
}

/*
Renders a single chat bubble.  Assistant bubbles have a light-grey (or dark-mode
slate) background similar to ChatGPT, while user bubbles align right with a
primary accent.
*/
export const ChatBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === "user";
  const bubbleClasses = isUser
    ? "bg-blue-500 text-white self-end"
    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100";

  return (
    <div className={`max-w-2xl rounded-lg p-4 mb-2 ${bubbleClasses}`}>
      <ReactMarkdown className="prose dark:prose-invert">{message.content}</ReactMarkdown>
      {message.citations?.length ? (
        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
          {message.citations.map((c) => (
            <li key={c.ref}>{c.type === "quran" ? `Q ${c.ref}` : c.ref}</li>
          ))}
        </ul>
      ) : null}
      {isUser ? null : <FeedbackButtons message={message} />}
    </div>
  );
}; 