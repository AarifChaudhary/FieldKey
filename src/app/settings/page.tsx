
"use client";

import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
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
  
  const [hue, setHue] = useState(() => parseHslString(primaryColor).h);
  const [saturation, setSaturation] = useState(() => parseHslString(primaryColor).s);
  const [lightness, setLightness] = useState(() => parseHslString(primaryColor).l);
  
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

          <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card/30">
            <h4 className="text-lg font-semibold text-foreground">Primary Color</h4>
            
            <div className="flex items-center space-x-4 mb-4">
               <div 
                 className="w-20 h-10 rounded-md border-2 border-border shadow-inner"
                 style={currentColorStyle}
                 aria-label="Current primary color preview"
               ></div>
               <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                 {`hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`}
               </span>
            </div>
           
            <div className="space-y-4">
              {/* Hue Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="hue-slider" className="text-sm font-medium">Hue</Label>
                  <span className="text-xs text-muted-foreground w-12 text-right">{hue.toFixed(0)}&deg;</span>
                </div>
                <Slider
                  id="hue-slider"
                  min={0}
                  max={360}
                  step={1}
                  value={[hue]}
                  onValueChange={handleHueChange}
                  aria-label="Hue slider"
                />
              </div>

              {/* Saturation Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="saturation-slider" className="text-sm font-medium">Saturation</Label>
                  <span className="text-xs text-muted-foreground w-12 text-right">{saturation.toFixed(0)}%</span>
                </div>
                <Slider
                  id="saturation-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[saturation]}
                  onValueChange={handleSaturationChange}
                  aria-label="Saturation slider"
                />
              </div>

              {/* Lightness Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="lightness-slider" className="text-sm font-medium">Lightness</Label>
                  <span className="text-xs text-muted-foreground w-12 text-right">{lightness.toFixed(0)}%</span>
                </div>
                <Slider
                  id="lightness-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[lightness]}
                  onValueChange={handleLightnessChange}
                  aria-label="Lightness slider"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const defaultColor = "162 72% 48%"; // Default Teal
                  setPrimaryColor(defaultColor);
                  const {h,s,l} = parseHslString(defaultColor);
                  setHue(h); setSaturation(s); setLightness(l);
                }}
                className="w-full sm:w-auto"
              >
                Reset to Default Color
              </Button>
            </div>
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
