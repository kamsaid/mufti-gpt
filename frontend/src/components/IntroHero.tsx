import React from "react";

/**
 * IntroHero renders the welcome headline shown before any messages are sent.
 * It is purely presentational, no props required.
 */
export const IntroHero: React.FC = () => (
  <header className="flex flex-col items-center gap-2">
    {/* Primary greeting */}
    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
      Salam, I&rsquo;m Yaseen.
    </h1>
    {/* Sub-line */}
    <p className="text-lg text-gray-400">How can I help you today?</p>
  </header>
); 