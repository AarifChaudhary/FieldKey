
"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { FieldDefinition, Preset, PresetFieldDefinition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FieldList from '@/components/fields/field-list';
import PasswordDisplay from '@/components/password-display';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Added Tabs imports
import { PRESETS_STORAGE_KEY, TEMP_FIELDS_STORAGE_KEY } from '@/lib/constants';

const MAX_FIELDS = 10;
const DEFAULT_PASSWORD_LENGTH = 16;
const AVAILABLE_PASSWORD_LENGTHS = [8, 16, 20];

const DEFAULT_COMPLEXITY_FALLBACKS = {
  uppercase: 'A',
  lowercase: 'z',
  number: '1',
  special: '!',
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return Math.abs(hash);
};

const capitalize = (s: string | undefined): string => {
    if (!s || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const getDeterministicItem = <T>(arr: T[], seed: string, fallback?: T): T | undefined => {
  if (!arr || arr.length === 0) return fallback;
  return arr[simpleHash(seed) % arr.length];
};


function generateSmartPassword(fieldValues: string[], targetLength: number): string {
  if (fieldValues.length === 0) return '';

  const baseSeed = fieldValues.join('|');

  const allTokens = fieldValues.flatMap(val => 
    val.split(/[ ,\-_/.@]+/).filter(Boolean)
  ).map(t => t.toLowerCase());

  const wordTokens = allTokens.filter(t => /^[a-z]+$/.test(t) && t.length >= 3);
  const numericTokens = allTokens.filter(t => /^\d+$/.test(t));

  const symbols = ['#', '$', '@', '!', '.', '-'];
  const sym1 = getDeterministicItem(symbols, baseSeed + "s1", '#')!;
  const sym2 = getDeterministicItem(symbols.filter(s => s !== sym1), baseSeed + "s2", '$')!;
  
  let numPart = getDeterministicItem(numericTokens, baseSeed + "n", undefined);
  if (!numPart) {
    const numFallback = simpleHash(baseSeed + "numFall");
    if (targetLength === 8) {
      numPart = (numFallback % 90 + 10).toString(); // 10-99
    } else {
      numPart = (numFallback % 900 + 100).toString(); // 100-999
    }
  } else {
     if (targetLength === 8) {
      numPart = numPart.slice(0, 2);
    } else {
      numPart = numPart.slice(0, 3);
    }
  }


  const baseWord1 = getDeterministicItem(wordTokens, baseSeed + "w1", "field")!;
  const baseWord2 = getDeterministicItem(wordTokens.filter(t => t !== baseWord1), baseSeed + "w2", "key")!;
  const baseWord3 = getDeterministicItem(wordTokens.filter(t => t !== baseWord1 && t !== baseWord2), baseSeed + "w3", "pass")!;

  const passArray: string[] = [];

  if (targetLength === 8) {
    passArray.push(capitalize(baseWord1.slice(0, 3)));
    passArray.push(sym1);
    passArray.push(numPart.slice(0,2)); 
    const remainingForW2 = Math.max(1, 8 - passArray.join('').length);
    passArray.push(baseWord2.slice(0, remainingForW2));
  } else if (targetLength === 16) {
    passArray.push(capitalize(baseWord1.slice(0, 5)));
    passArray.push(sym1);
    passArray.push(baseWord2.slice(0, 5));
    passArray.push(sym2);
    passArray.push(numPart.slice(0,3)); 
    const currentLength = passArray.join('').length;
    if (currentLength < 16) {
      passArray.push(baseWord3.slice(0, 16 - currentLength));
    }
  } else { // targetLength === 20
    passArray.push(capitalize(baseWord1.slice(0, 7)));
    passArray.push(sym1);
    passArray.push(baseWord2.slice(0, 7));
    passArray.push(sym2);
    passArray.push(numPart.slice(0,3)); 
    const currentLength = passArray.join('').length;
    if (currentLength < 20) {
      passArray.push(baseWord3.slice(0, 20 - currentLength));
    }
  }

  let generatedPassword = passArray.join('');

  if (generatedPassword.length < targetLength) {
    let paddingSource = (baseWord1 + baseWord2 + baseWord3).replace(/[^a-z]/gi, '');
    if (paddingSource.length === 0) paddingSource = "abcdefghij";
    let currentPaddingIndex = 0;
    while (generatedPassword.length < targetLength) {
      generatedPassword += paddingSource[simpleHash(baseSeed + "pad_smart" + currentPaddingIndex++) % paddingSource.length];
    }
  }
  
  if (generatedPassword.length > targetLength) {
    generatedPassword = generatedPassword.substring(0, targetLength);
  }

  let tempPasswordArray = generatedPassword.split('');
  const needs = {
    uppercase: !tempPasswordArray.some(char => /[A-Z]/.test(char)),
    lowercase: !tempPasswordArray.some(char => /[a-z]/.test(char)),
    number: !tempPasswordArray.some(char => /\d/.test(char)),
    special: !tempPasswordArray.some(char => /[^A-Za-z0-9]/.test(char)),
  };

  const fallbacks = DEFAULT_COMPLEXITY_FALLBACKS;
  const fallbackKeys = Object.keys(fallbacks).sort() as (keyof typeof fallbacks)[];
  let replacementIdxCounter = 0;

  for (const key of fallbackKeys) {
    if (needs[key]) {
      if (tempPasswordArray.length < targetLength) {
        tempPasswordArray.push(fallbacks[key]);
      } else if (tempPasswordArray.length > 0) {
        const idxToReplace = Math.max(0, tempPasswordArray.length - 1 - (replacementIdxCounter % tempPasswordArray.length));
        tempPasswordArray[idxToReplace] = fallbacks[key];
        replacementIdxCounter++;
      }
    }
  }
  generatedPassword = tempPasswordArray.join('');
  
   if (generatedPassword.length > targetLength) {
    generatedPassword = generatedPassword.substring(0, targetLength);
  }
  while (generatedPassword.length < targetLength) { 
     let paddingSource = (baseWord1 + baseWord2 + baseWord3).replace(/[^a-z]/gi, '');
     if (paddingSource.length === 0) paddingSource = "fallback";
     generatedPassword += paddingSource[simpleHash(baseSeed + "final_pad" + generatedPassword.length) % paddingSource.length];
  }

  return generatedPassword;
}


function generateLocalPassword(fieldValues: string[], targetLength: number): string {
  if (fieldValues.length === 0) {
    return '';
  }

  const processedFieldValues = fieldValues.map(val => {
    if (val.length <= 1) return val;
    const firstChar = val[0];
    const lastChar = val[val.length - 1];
    const middlePart = val.substring(1, val.length - 1);
    const reversedMiddle = middlePart.split('').reverse().join('');
    return firstChar + reversedMiddle + lastChar;
  });

  let interleavedChars: string[] = [];
  let charIndex = 0;
  let interleaveLoopGuard = 0;
  const maxInterleaveLength = targetLength * 2; 

  while (interleavedChars.length < maxInterleaveLength && interleaveLoopGuard < 100) {
    let charAddedInThisPass = false;
    for (const value of processedFieldValues) {
      if (charIndex < value.length) {
        if (interleavedChars.length < maxInterleaveLength) {
          interleavedChars.push(value[charIndex]);
          charAddedInThisPass = true;
        } else {
          break;
        }
      }
    }
    if (!charAddedInThisPass && interleavedChars.length > 0) break;
    if (interleavedChars.length >= maxInterleaveLength) break;
    charIndex++;
    interleaveLoopGuard++;
  }
  
  let tempPasswordArray = interleavedChars.slice(0, targetLength); 

  const needs = {
    uppercase: !tempPasswordArray.some(char => /[A-Z]/.test(char)),
    lowercase: !tempPasswordArray.some(char => /[a-z]/.test(char)),
    number: !tempPasswordArray.some(char => /\d/.test(char)),
    special: !tempPasswordArray.some(char => /[^A-Za-z0-9]/.test(char)),
  };
  
  const fallbacks = DEFAULT_COMPLEXITY_FALLBACKS;
  const fallbackKeys = Object.keys(fallbacks).sort() as (keyof typeof fallbacks)[];
  let replacementIdxCounter = 0;

  for (const key of fallbackKeys) {
    if (needs[key]) {
      if (tempPasswordArray.length < targetLength) {
        tempPasswordArray.push(fallbacks[key]);
      } else if (tempPasswordArray.length > 0) {
         const idxToReplace = Math.max(0, tempPasswordArray.length - 1 - (replacementIdxCounter % tempPasswordArray.length));
         tempPasswordArray[idxToReplace] = fallbacks[key];
         replacementIdxCounter++;
      }
    }
  }
  
  let currentPassword = tempPasswordArray.join('');

  if (currentPassword.length < targetLength) {
    let paddingSource = fieldValues.join('').replace(/[^a-zA-Z0-9!@#$%^&*()]/g, ''); 
    if (paddingSource.length === 0) paddingSource = "FkSec#01"; 
    
    let currentPaddingIndex = 0;
    while (currentPassword.length < targetLength) {
      currentPassword += paddingSource[simpleHash(fieldValues.join('|') + "pad_local" + currentPaddingIndex++) % paddingSource.length];
    }
  }

  if (currentPassword.length > targetLength) {
    currentPassword = currentPassword.substring(0, targetLength);
  }
  
  return currentPassword;
}


export default function HomePage() {
  const [fields, setFields] = useState<FieldDefinition[]>([
    { id: 'initial-field-site-name', label: 'Site Name', value: '', included: true },
    { id: 'initial-field-username', label: 'Username', value: '', included: true },
  ]);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'normal' | 'smart'>('normal');
  const [selectedPasswordLength, setSelectedPasswordLength] = useState<number>(DEFAULT_PASSWORD_LENGTH);
  const { toast } = useToast();

  const [isSavePresetModalOpen, setSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    const fieldsToLoadJSON = localStorage.getItem(TEMP_FIELDS_STORAGE_KEY);
    if (fieldsToLoadJSON) {
      try {
        const presetFields: PresetFieldDefinition[] = JSON.parse(fieldsToLoadJSON);
        const newFields: FieldDefinition[] = presetFields.map(pf => ({
          ...pf,
          value: '', 
        }));
        setFields(newFields);
        toast({
          title: 'Preset Fields Loaded',
          description: 'The field layout has been applied. Enter new values to generate a password.',
        });
      } catch (e) {
        console.error("Error loading preset fields:", e);
        toast({ title: 'Error Loading Preset Fields', variant: 'destructive' });
      } finally {
        localStorage.removeItem(TEMP_FIELDS_STORAGE_KEY);
      }
    }
  }, [toast]);


  const handleAddField = () => {
    if (fields.length < MAX_FIELDS) {
      setFields([...fields, { id: uuidv4(), label: `Field ${fields.length + 1}`, value: '', included: true }]);
    } else {
      toast({
        title: 'Maximum fields reached',
        description: `You can add up to ${MAX_FIELDS} fields.`,
        variant: 'destructive',
      });
    }
  };

  const handleFieldChange = (id: string, newField: Partial<FieldDefinition>) => {
    setFields(fields.map(field => field.id === id ? { ...field, ...newField } : field));
  };

  const handleRemoveField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(field => field.id !== id));
    } else {
       toast({
        title: 'Cannot remove last field',
        description: 'At least one field is required.',
        variant: 'destructive',
      });
    }
  };
  
  const handleGeneratePasswordInternal = () => { 
    setError(null);
    const includedFieldsWithValue = fields.filter(field => field.included && field.value.trim() !== '');
    
    if (includedFieldsWithValue.length === 0) {
      toast({
          title: 'No inputs for password',
          description: 'Please add values to your fields, ensure they are included, and not empty.',
          variant: 'destructive',
      });
      setGeneratedPassword('');
      return;
    }

    const fieldValuesInOrder = includedFieldsWithValue.map(field => field.value);
    
    setIsLoading(true); 
    setGeneratedPassword(''); 

    try {
      setTimeout(() => { 
        let newPassword = '';
        if (generationMode === 'smart') {
            newPassword = generateSmartPassword(fieldValuesInOrder, selectedPasswordLength);
        } else {
            newPassword = generateLocalPassword(fieldValuesInOrder, selectedPasswordLength);
        }

        if (newPassword) {
          setGeneratedPassword(newPassword);
        } else {
          setError("Could not generate a password. Try different inputs or modes.");
          toast({
            title: 'Password Generation Failed',
            description: 'Could not generate a password. Please check inputs or try a different mode/length.',
            variant: 'destructive',
          });
        }
        setIsLoading(false);
      }, 50); 
    } catch (err) { 
      console.error("Error generating password:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate password: ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Password generation failed: ${errorMessage}`,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

   useEffect(() => {
    const hasIncludedInputsWithValue = fields.some(f => f.included && f.value.trim() !== '');
    if (hasIncludedInputsWithValue) {
      handleGeneratePasswordInternal();
    } else {
      setGeneratedPassword(''); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, generationMode, selectedPasswordLength]); 

  const handleConfirmSavePreset = () => {
    if (!newPresetName.trim()) {
      toast({ title: 'Preset name required', variant: 'destructive' });
      return;
    }
    if (fields.length === 0) {
      toast({ title: 'No field layout to save', description: 'Add fields before saving.', variant: 'destructive' });
      return;
    }

    const fieldsForPreset: PresetFieldDefinition[] = fields.map(({ id, label, included }) => ({ id, label, included }));
    const newPreset: Preset = {
      id: uuidv4(),
      name: newPresetName.trim(),
      fields: fieldsForPreset,
    };

    try {
      const existingPresetsJSON = localStorage.getItem(PRESETS_STORAGE_KEY);
      const existingPresets: Preset[] = existingPresetsJSON ? JSON.parse(existingPresetsJSON) : [];
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify([...existingPresets, newPreset]));
      toast({
        title: 'Preset Saved!',
        description: `"${newPreset.name}" has been saved. You can manage it on the Presets page.`,
      });
      setNewPresetName('');
      setSavePresetModalOpen(false);
    } catch (error) {
      console.error("Error saving preset to localStorage:", error);
      toast({ title: 'Failed to Save Preset', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Password Generator</CardTitle>
          <CardDescription>
            Define your custom fields, order them, and FieldKey will generate a password based on your inputs.
            The same inputs in the same order will always produce the same password. 
            <strong> No data is ever stored.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <Label className="text-lg font-semibold mb-2 block">Generation Mode</Label>
              <Tabs
                  value={generationMode}
                  onValueChange={(value) => setGenerationMode(value as 'normal' | 'smart')}
                  className="w-full"
              >
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="normal">Normal Mode</TabsTrigger>
                      <TabsTrigger value="smart">Smart Mode</TabsTrigger>
                  </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground mt-2">
                  {generationMode === 'normal' 
                      ? "Normal mode uses a direct transformation of your field values." 
                      : "Smart mode creates a structured password using segments of your words, symbols, and numbers."}
              </p>
            </div>
            <div>
              <Label className="text-lg font-semibold mb-2 block">Password Length</Label>
               <Tabs
                  value={selectedPasswordLength.toString()}
                  onValueChange={(value) => setSelectedPasswordLength(parseInt(value, 10))}
                  className="w-full"
              >
                  <TabsList className="grid w-full grid-cols-3">
                    {AVAILABLE_PASSWORD_LENGTHS.map(len => (
                        <TabsTrigger key={len} value={len.toString()}>{len} Chars</TabsTrigger>
                    ))}
                  </TabsList>
              </Tabs>
            </div>
          </div>


          <div>
            <h3 className="text-xl font-semibold mb-2">Your Fields</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add up to {MAX_FIELDS} fields. Drag to reorder. Toggle 'Include' to use a field's value in generation.
            </p>
            <FieldList
              fields={fields}
              onFieldChange={handleFieldChange}
              onRemoveField={handleRemoveField}
              setFields={setFields}
            />
            <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleAddField} variant="outline" disabled={fields.length >= MAX_FIELDS}>
                  Add Field
                </Button>
                <Dialog open={isSavePresetModalOpen} onOpenChange={setSavePresetModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={fields.length === 0}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Field Layout as Preset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Preset Layout</DialogTitle>
                      <DialogDescription>
                        Enter a name for your current field layout. Field values are not saved.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="preset-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="preset-name"
                          value={newPresetName}
                          onChange={(e) => setNewPresetName(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., Social Media Fields"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleConfirmSavePreset}>Save Preset</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-3">Generated Password</h3>
            {isLoading && ( 
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating your password...</span>
              </div>
            )}
            {error && (
               <Alert variant="destructive" className="mb-4">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Generation Error</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
               </Alert>
            )}
            {!isLoading && generatedPassword && (
              <PasswordDisplay password={generatedPassword} />
            )}
            {!isLoading && !generatedPassword && !error && (
              <p className="text-muted-foreground">
                Your generated password will appear here once you provide and include input values.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
           <Button onClick={handleGeneratePasswordInternal} disabled={isLoading || !fields.some(f => f.included && f.value.trim() !== '')} size="lg" className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Regenerate Password'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    
