
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider'; // Import useTheme

interface PasswordDisplayProps {
  password?: string;
}

interface BubbleState {
  id: string;
  size: number;
  delay: string;
  finalX: number;
  finalY: number;
  startOpacity: number;
}

export default function PasswordDisplay({ password }: PasswordDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [isAnimatingCopy, setIsAnimatingCopy] = useState(false);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]); // State for bubbles
  const { primaryColor } = useTheme(); // Get primary color for bubbles

  const [hStr, sStr, lStr] = primaryColor.split(' ');
  const h = parseFloat(hStr);
  const s = parseFloat(sStr.replace('%', ''));
  const l = parseFloat(lStr.replace('%', ''));

  const triggerBubbleAnimation = () => {
    const newBubbles: BubbleState[] = [];
    const numBubbles = 15;

    for (let i = 0; i < numBubbles; i++) {
      newBubbles.push({
        id: `bubble-${Date.now()}-${i}`,
        size: Math.random() * 8 + 4, // 4px to 12px
        delay: `${Math.random() * 0.3}s`,
        finalX: (Math.random() - 0.5) * 160, // Spread -80px to +80px
        finalY: (Math.random() - 0.7) * 100 - 30, // Spread mostly upwards (-100px to +30px)
        startOpacity: Math.random() * 0.4 + 0.5, // 0.5 to 0.9
      });
    }
    setBubbles(newBubbles);

    setTimeout(() => {
      setBubbles([]);
    }, 1300); // Animation duration (1s) + max delay (0.3s)
  };

  const onCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setHasCopied(true);
    setIsAnimatingCopy(true);
    triggerBubbleAnimation(); // Trigger bubbles

    setTimeout(() => {
      setIsAnimatingCopy(false);
    }, 700);
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);
  
  const [displayPassword, setDisplayPassword] = useState("");
  useEffect(() => {
    setDisplayPassword(password || "");
  }, [password]);

  if (!displayPassword) {
    return <p className="text-muted-foreground">Generated password will appear here.</p>;
  }

  return (
    <div className="flex w-full max-w-md items-center space-x-2 relative"> {/* Added position: relative */}
      <Input
        type="text"
        value={displayPassword}
        readOnly
        className={cn(
          "text-lg font-mono tracking-wider",
          displayPassword.length > 0 ? "text-foreground" : "text-muted-foreground",
          "transition-all duration-300 ease-in-out",
          isAnimatingCopy ? "border-primary shadow-md scale-[1.02]" : "border-input"
        )}
        aria-label="Generated Password"
      />
      <Button variant="outline" size="icon" onClick={onCopy} disabled={!displayPassword}>
        {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        <span className="sr-only">Copy password</span>
      </Button>

      {/* Render Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: 'calc(100% - 20px)', // Origin near the center of the copy button
            top: '50%',              // Vertically centered with the button
            backgroundColor: `hsla(${h}, ${s}%, ${l}%, ${bubble.startOpacity})`,
            animationName: 'float-and-fade',
            animationDuration: '1s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: bubble.delay,
            opacity: 0, // Initial state for animation to fade in
            // CSS custom properties for the animation
            '--final-x': `${bubble.finalX}px`,
            '--final-y': `${bubble.finalY}px`,
            // '--start-opacity': bubble.startOpacity // startOpacity is now directly in backgroundColor
          }}
        />
      ))}
    </div>
  );
}
