
"use client";

import type { FC, ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

type Theme = "light" | "dark" | "system";

// Helper to parse HSL string "H S% L%" into an object
const parseHslString = (hslString: string): { h: number; s: number; l: number } | null => {
  if (!hslString) return null;
  const match = hslString.match(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/);
  if (!match) {
    console.warn("Invalid HSL string format for parsing:", hslString);
    return null;
  }
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
};

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string; // HSL string, e.g., "162 72% 48%"
  setPrimaryColor: (color: string) => void;
  resolvedTheme: "light" | "dark";
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  primaryColor: "162 72% 48%", // Default Teal
  setPrimaryColor: () => null,
  resolvedTheme: "light", // Default resolved theme
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultPrimaryColor?: string; // HSL string
  storageKeyTheme?: string;
  storageKeyPrimaryColor?: string;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  defaultPrimaryColor = "162 72% 48%", // Default Teal
  storageKeyTheme = "fieldkey-theme",
  storageKeyPrimaryColor = "fieldkey-primary-color",
}) => {
  const [theme, setThemeState] = useLocalStorage<Theme>(storageKeyTheme, defaultTheme);
  const [primaryColor, setPrimaryColorState] = useLocalStorage<string>(storageKeyPrimaryColor, defaultPrimaryColor);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'; // Default for SSR
    return theme === 'system'
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light'
      : theme;
  });

  const applyTheme = useCallback((currentTheme: Theme, currentPrimaryColor: string) => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let effectiveTheme: "light" | "dark";
    if (currentTheme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effectiveTheme = currentTheme;
    }
    
    root.classList.add(effectiveTheme);
    setResolvedTheme(effectiveTheme);
    
    root.style.setProperty('--primary', currentPrimaryColor);
    root.style.setProperty('--ring', currentPrimaryColor);
    root.style.setProperty('--primary-raw', currentPrimaryColor); // Used by some components if they need raw values

    // Dynamically calculate and set --accent and --accent-foreground
    // --accent will be primaryColor with 20% alpha
    // --accent-foreground will be the full primaryColor
    const primaryHsl = parseHslString(currentPrimaryColor);
    if (primaryHsl) {
      const { h, s, l } = primaryHsl;
      
      const accentValueWithAlpha = `${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}% / 0.2`;
      root.style.setProperty('--accent', accentValueWithAlpha);
      
      // Set --accent-foreground to be the full primary color string (e.g., "162 72% 48%")
      // Tailwind's hsl(var(--accent-foreground)) will then correctly apply it.
      root.style.setProperty('--accent-foreground', currentPrimaryColor);
    }

  }, []);

  useEffect(() => {
    applyTheme(theme, primaryColor);
  }, [theme, primaryColor, applyTheme]);

  useEffect(() => {
    if (theme !== "system" || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system", primaryColor); 
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, primaryColor, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setPrimaryColor = (newColor: string) => {
    setPrimaryColorState(newColor);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, primaryColor, setPrimaryColor, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
