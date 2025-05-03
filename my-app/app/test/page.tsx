"use client"

import { Button } from "@/components/ui/button"

export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-8">Style Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Test primary button */}
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Primary Button</h2>
          <Button>Primary Button</Button>
        </div>
        
        {/* Test different button variants */}
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
        
        {/* Test colors */}
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Theme Colors</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-primary rounded-md flex items-center justify-center text-primary-foreground">Primary</div>
            <div className="h-12 bg-secondary rounded-md flex items-center justify-center text-secondary-foreground">Secondary</div>
            <div className="h-12 bg-accent rounded-md flex items-center justify-center text-accent-foreground">Accent</div>
            <div className="h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground">Muted</div>
          </div>
        </div>
        
        {/* Test typography */}
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Typography</h2>
          <p className="text-lg mb-2">This is regular text</p>
          <p className="text-primary mb-2">This is primary text</p>
          <p className="text-muted-foreground mb-2">This is muted text</p>
          <p className="text-xs mb-2">Extra small text</p>
          <p className="text-sm mb-2">Small text</p>
          <p className="text-base mb-2">Base text</p>
          <p className="text-lg mb-2">Large text</p>
          <p className="text-xl mb-2">Extra large text</p>
        </div>
      </div>
    </div>
  )
} 