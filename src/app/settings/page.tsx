"use client";

import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button'; // Added import
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Helper to convert HSL string to HSL object and back
const parseHslString = (hslString: string): { h: number; s: number; l: number } => {
  const [h, s, l] = hslString.split(' ').map(parseFloat);
  return { h, s, l };
};

const formatHslString = (hsl: { h: number; s: number; l: number }): string => {
  return `${hsl.h.toFixed(0)} ${hsl.s.toFixed(0)}% ${hsl.l.toFixed(0)}%`;
};


export default function SettingsPage() {
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
  
  // Local state for HSL components
  const [hue, setHue] = useState(() => parseHslString(primaryColor).h);
  const [saturation, setSaturation] = useState(() => parseHslString(primaryColor).s);
  const [lightness, setLightness] = useState(() => parseHslString(primaryColor).l);
  
  // Update local HSL state if primaryColor changes from context (e.g. on initial load from localStorage)
  useEffect(() => {
    const { h, s, l } = parseHslString(primaryColor);
    setHue(h);
    setSaturation(s);
    setLightness(l);
  }, [primaryColor]);

  const handleHueChange = (value: number[]) => {
    const newHue = value[0];
    setHue(newHue);
    setPrimaryColor(formatHslString({ h: newHue, s: saturation, l: lightness }));
  };

  const handleSaturationChange = (value: number[]) => {
    const newSaturation = value[0];
    setSaturation(newSaturation);
    setPrimaryColor(formatHslString({ h: hue, s: newSaturation, l: lightness }));
  };

  const handleLightnessChange = (value: number[]) => {
    const newLightness = value[0];
    setLightness(newLightness);
    setPrimaryColor(formatHslString({ h: hue, s: saturation, l: newLightness }));
  };

  const currentColorStyle = {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Settings</CardTitle>
          <CardDescription>Customize the application's appearance and view important information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Appearance</h3>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <Label htmlFor="theme-toggle-button">Theme</Label>
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-4 p-3 border rounded-md">
            <h4 className="text-lg font-medium">Primary Color</h4>
            <div className="flex items-center space-x-4">
               <div className="w-16 h-10 rounded-md border" style={currentColorStyle}></div>
               <span className="text-sm text-muted-foreground">{`hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`}</span>
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="hue-slider">Hue: {hue.toFixed(0)}</Label>
              <Slider
                id="hue-slider"
                min={0}
                max={360}
                step={1}
                value={[hue]}
                onValueChange={handleHueChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saturation-slider">Saturation: {saturation.toFixed(0)}%</Label>
              <Slider
                id="saturation-slider"
                min={0}
                max={100}
                step={1}
                value={[saturation]}
                onValueChange={handleSaturationChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lightness-slider">Lightness: {lightness.toFixed(0)}%</Label>
              <Slider
                id="lightness-slider"
                min={0}
                max={100}
                step={1}
                value={[lightness]}
                onValueChange={handleLightnessChange}
              />
            </div>
             <Button variant="outline" onClick={() => {
                const defaultColor = "162 72% 48%"; // Default Teal
                setPrimaryColor(defaultColor);
                const {h,s,l} = parseHslString(defaultColor);
                setHue(h); setSaturation(s); setLightness(l);
             }}>Reset to Default Color</Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Security Disclaimer</h3>
            <Alert variant="default" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500/50">
              <AlertCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-500" />
              <AlertTitle className="text-yellow-700 dark:text-yellow-400">Important Notice</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                FieldKey generates passwords deterministically based on your inputs and their order. 
                It <strong>does not store your field values or generated passwords</strong> anywhere.
                You are responsible for remembering your field inputs and their sequence. 
                If you forget them, you will not be able to regenerate your password.
                While FieldKey aims to create strong passwords, ensure your master inputs are kept secure and are not easily guessable.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
