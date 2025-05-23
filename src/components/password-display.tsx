"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PasswordDisplayProps {
  password?: string;
}

export default function PasswordDisplay({ password }: PasswordDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const onCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setHasCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'Your password has been copied.',
    });
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);
  
  // Prevent hydration mismatch for password value if it's initially empty then populated
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
          displayPassword.length > 0 ? "text-foreground" : "text-muted-foreground"
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
