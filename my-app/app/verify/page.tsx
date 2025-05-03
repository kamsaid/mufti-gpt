"use client"

import { useState } from "react"
import "./styles.css" // Import the direct CSS

export default function VerifyPage() {
  // Simple state to verify reactivity
  const [count, setCount] = useState(0)
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8">Styling Verification Page</h1>
      <p className="text-xl mb-8">
        This page confirms the new styles are loading properly.
        <span className="text-primary font-bold ml-2">NEW CSS IS LOADED!</span>
      </p>
      
      <div className="verify-container">
        <h2 className="text-2xl font-bold mb-4">Direct CSS Confirmation</h2>
        <p>This box has direct CSS styling with a pulse animation. If you see this with green borders and animation, CSS is working!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full mb-8 mt-8">
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Basic Elements</h2>
          <p className="mb-2">This text should use the default text color.</p>
          <p className="text-primary mb-2">This should be primary color.</p>
          <p className="text-muted-foreground mb-2">This should be muted text.</p>
          <button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md"
            onClick={() => setCount(count + 1)}
          >
            Increment ({count})
          </button>
        </div>
        
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Color Samples</h2>
          <div className="space-y-2">
            <div className="p-3 bg-background border border-border rounded-md">Background</div>
            <div className="p-3 bg-card text-card-foreground rounded-md">Card</div>
            <div className="p-3 bg-primary text-primary-foreground rounded-md">Primary</div>
            <div className="p-3 bg-secondary text-secondary-foreground rounded-md">Secondary</div>
            <div className="p-3 bg-accent text-accent-foreground rounded-md">Accent</div>
            <div className="p-3 bg-muted text-muted-foreground rounded-md">Muted</div>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-xl">
        <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
          <h3 className="font-semibold mb-2">Browser Cache Notice</h3>
          <p>If you're still seeing styling issues, try these steps:</p>
          <ol className="list-decimal pl-6 space-y-1 mt-2">
            <li>Clear your browser cache (Cmd+Shift+R or Ctrl+Shift+R)</li>
            <li>Try a private/incognito window</li>
            <li>Verify you're accessing the correct URL</li>
            <li>Look at the URL bar to ensure you're on the correct domain/port</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 