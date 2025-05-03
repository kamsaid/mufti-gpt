/**
 * EmptyState component displays the initial landing screen with greeting and suggested questions
 * Using direct styles to ensure proper display in all environments
 */
export function EmptyState() {
  // Direct styles to ensure proper display
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '0 1rem',
    textAlign: 'center' as const,
    backgroundColor: '#0f172a', // dark slate
    color: '#e2e8f0', // light slate
    maxWidth: '100%',
  };

  const arabicTextStyle = {
    fontSize: '4.5rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    fontFamily: '"Scheherazade New", serif',
    color: '#e2e8f0', // light slate
    direction: 'rtl' as const,
  };

  const englishTextStyle = {
    fontSize: '2.25rem',
    fontWeight: 500,
    marginBottom: '2.5rem',
    color: '#e2e8f0', // light slate
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0.75rem',
    maxWidth: '36rem',
    width: '100%',
  };

  const cardStyle = {
    padding: '1rem',
    border: '1px solid #334155', // slate-700
    borderRadius: '0.5rem',
    backgroundColor: '#1e293b', // slate-800
    color: '#e2e8f0', // light slate
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '0.875rem',
    transition: 'all 200ms',
  };

  const contentWrapperStyle = {
    maxWidth: '36rem',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  };

  return (
    <div className="empty-state-container" style={containerStyle}>
      <div style={contentWrapperStyle}>
        {/* Arabic greeting with proper styling */}
        <h2 style={arabicTextStyle} className="font-scheherazade">!سلام</h2>
        
        {/* English greeting */}
        <h3 style={englishTextStyle}>Salam!</h3>

        {/* Suggested questions in a grid - stacked on mobile, side by side on desktop */}
        <div style={gridStyle} className="question-grid">
          {[
            "What does the Quran say about patience?",
            "How do I perform the 5 daily prayers?",
            "Explain the concept of Zakat",
            "What is the significance of Ramadan?",
          ].map((suggestion, i) => (
            <div
              key={i}
              style={cardStyle}
              className="question-card"
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      {/* Adding media query for desktop grid through style element */}
      <style jsx>{`
        @media (min-width: 768px) {
          .question-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .question-card:hover {
          background-color: #334155;
        }
      `}</style>
    </div>
  )
}

  