import React from "react";

/**
 * Sidebar component with New Chat button.
 * Placeholder for chat list, settings, etc.
 */
export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          + New Chat
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Chat list will go here */}
      </nav>
      <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
        {/* Settings / Info */}
      </div>
    </aside>
  );
};