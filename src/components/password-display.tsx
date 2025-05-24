
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
// Removed useToast import
import { cn } from '@/lib/utils';

interface PasswordDisplayProps {
  password?: string;
}

export default function PasswordDisplay({ password }: PasswordDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [isAnimatingCopy, setIsAnimatingCopy] = useState(false); // New state for animation
  // Removed toast instance: const { toast } = useToast();

  const onCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setHasCopied(true);
    setIsAnimatingCopy(true); // Trigger animation

    // Reset animation state after a short duration
    setTimeout(() => {
      setIsAnimatingCopy(false);
    }, 700); // Animation duration in milliseconds

    // Toast removed
    // toast({
    //   title: 'Copied to clipboard!',
    //   description: 'Your password has been copied.',
    // });
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false); // This resets the button icon
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
    <div className="flex w-full max-w-md items-center space-x-2">
      <Input
        type="text"
        value={displayPassword}
        readOnly
        className={cn(
          "text-lg font-mono tracking-wider",
          displayPassword.length > 0 ? "text-foreground" : "text-muted-foreground",
          // Add transition properties for smooth animation
          "transition-all duration-300 ease-in-out",
          // Apply animation styles conditionally
          isAnimatingCopy ? "border-primary shadow-md scale-[1.02]" : "border-input"
        )}
        aria-label="Generated Password"
      />
      <Button variant="outline" size="icon" onClick={onCopy} disabled={!displayPassword}>
        {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        <span className="sr-only">Copy password</span>
      </Button>
    </div>
  );
}
