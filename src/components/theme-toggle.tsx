
"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  let iconToDisplay;

  if (!mounted) {
    // On the server, `theme` is "system" (the default), which results in the Laptop icon.
    // The initial client render (when `mounted` is false) must match this.
    iconToDisplay = <Laptop className="h-[1.2rem] w-[1.2rem]" />;
  } else {
    // After mounting on the client, use `resolvedTheme` to display the correct icon.
    if (resolvedTheme === 'light') {
      iconToDisplay = <Sun className="h-[1.2rem] w-[1.2rem]" />;
    } else { // resolvedTheme === 'dark'
      iconToDisplay = <Moon className="h-[1.2rem] w-[1.2rem]" />;
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {iconToDisplay}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
