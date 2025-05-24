
"use client";

import type { FC, ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

type Theme = "light" | "dark" | "system";

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
    
    // Set the primary color CSS variable with just the HSL values.
    // Tailwind's config (hsl(var(--primary))) will wrap this in hsl().
    root.style.setProperty('--primary', currentPrimaryColor);
    // Also update the ring color to match the primary color values.
    root.style.setProperty('--ring', currentPrimaryColor);
    // Storing the raw HSL string might be useful for other direct JS manipulations if needed.
    root.style.setProperty('--primary-raw', currentPrimaryColor);


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
