
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render a static placeholder to prevent hydration mismatch
    // It mimics the size and basic look of the switch in its light state.
    return (
      <div
        className="inline-flex h-6 w-11 items-center rounded-full bg-input p-0.5"
        aria-hidden="true"
      >
        <div className="h-5 w-5 rounded-full bg-background shadow-lg" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <SwitchPrimitives.Root
      checked={isDark}
      onCheckedChange={(checked) => {
        setTheme(checked ? "dark" : "light");
      }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark ? "bg-primary" : "bg-input"
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          isDark ? "translate-x-5" : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-sky-400" />
        ) : (
          <Sun className="h-3 w-3 text-orange-500" />
        )}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
}
