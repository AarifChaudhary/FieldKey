
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
// import { useRouter } from 'next/navigation'; // No longer used here, but kept in case of future routing needs from this page
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PRESETS_STORAGE_KEY, TEMP_FIELDS_STORAGE_KEY } from '@/lib/constants';

const MAX_FIELDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;
const DEFAULT_COMPLEXITY_FALLBACKS = {
  uppercase: 'A',
  lowercase: 'z',
  number: '1',
  special: '!',
};

// --- Helper for Smart Generation ---
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const capitalize = (s: string | undefined): string => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); // Ensures rest is lowercase
}

const applyLeetSpeak = (str: string | undefined, seedStr: string): string => {
  if (!str || str.length < 1) return str || '';
  // Ensure input to leetspeak is lowercase for map consistency
  const lcStr = str.toLowerCase();
  const leetMap: {[key: string]: string} = { 'a': '4', 'e': '3', 'o': '0', 'i': '1', 's': '5', 'l': '7', 't': '+' };
  const chars = lcStr.split('');
  const seed = simpleHash(seedStr);
  
  const availableLeetChars = (Object.keys(leetMap) as (keyof typeof leetMap)[])
    .filter(key => lcStr.includes(key));

  if (availableLeetChars.length > 0) {
    const charToLeet = availableLeetChars[seed % availableLeetChars.length];
    let replaced = false;
    const potentialIdx = seed % lcStr.length;
    if (lcStr[potentialIdx] === charToLeet) {
        chars[potentialIdx] = leetMap[charToLeet];
        replaced = true;
    }
    if (!replaced) {
        const firstOccurrenceIdx = lcStr.indexOf(charToLeet);
        if (firstOccurrenceIdx !== -1) {
            chars[firstOccurrenceIdx] = leetMap[charToLeet];
        }
    }
  }
  return chars.join('');
};
// --- End Helper for Smart Generation ---

function generateSmartPassword(fieldValues: string[]): string {
  if (fieldValues.length === 0) return '';

  const tokens: string[] = [];
  fieldValues.forEach(val => {
    val.split(/[ ,\-_/.@]+/) 
       .forEach(word => {
         if (word && word.length > 1) tokens.push(word.toLowerCase()); // Convert to lowercase during tokenization
       });
  });

  if (tokens.length === 0) {
    return generateLocalPassword(fieldValues.map(fv => fv.substring(0,5))); 
  }

  const baseSeed = fieldValues.join('|'); // Use original fieldValues for baseSeed
  const getDeterministicValue = <T>(arr: T[], seedPart: string): T | undefined => {
    if (arr.length === 0) return undefined;
    return arr[simpleHash(baseSeed + seedPart) % arr.length];
  };

  const LONG_WORD_THRESHOLD = 6; 
  const TARGET_SEGMENT_LENGTH = 4; 

  const processToken = (token: string | undefined, seedSuffix: string): string => {
    if (!token) return ''; // Token is already lowercase
    if (token.length > LONG_WORD_THRESHOLD && token.length > TARGET_SEGMENT_LENGTH) {
      const choice = simpleHash(baseSeed + token + seedSuffix + "segment_choice") % 3;
      if (choice === 0) { // Prefix
        return token.substring(0, TARGET_SEGMENT_LENGTH);
      } else if (choice === 1) { // Suffix
        return token.substring(token.length - TARGET_SEGMENT_LENGTH);
      } else { // Middle
        // Ensure start index allows for full TARGET_SEGMENT_LENGTH
        const maxStart = token.length - TARGET_SEGMENT_LENGTH;
        const start = simpleHash(baseSeed + token + seedSuffix + "mid_start") % (maxStart + 1);
        return token.substring(start, start + TARGET_SEGMENT_LENGTH);
      }
    }
    return token; 
  };

  let token1Raw = getDeterministicValue(tokens, "w1_seed");
  let token2Raw = getDeterministicValue(tokens.filter(t => t !== token1Raw), "w2_seed") || token1Raw;
  let token3Raw = getDeterministicValue(tokens.filter(t => t !== token1Raw && t !== token2Raw), "w3_seed") || token2Raw;

  const segment1 = processToken(token1Raw, "seg1_proc");
  const segment2 = processToken(token2Raw, "seg2_proc");
  const segment3 = processToken(token3Raw, "seg3_proc");
  
  const comp1 = capitalize(segment1); // segment1 is lowercase
  const comp2 = applyLeetSpeak(segment2, baseSeed + "leet_seg2"); // segment2 is lowercase

  let comp3 = "";
  if (segment3 && segment3.length > 0 && segment3 !== segment1 && segment3 !== segment2) {
    comp3 = segment3.split('').reverse().join(''); // segment3 is lowercase
  }

  const numericTokens = tokens.filter(t => /^\d+$/.test(t)); // These tokens are already lowercase, but numbers are fine
  let numPart = numericTokens.length > 0 ? getDeterministicValue(numericTokens, "n1_select") : (simpleHash(baseSeed + "n_fallback") % 90 + 10).toString();
  if (numPart && numPart.length > 3) numPart = numPart.substring(0,3);

  const symbols = ['@', '#', '$', '&', '*', '-', '_', '+', '%', '^'];
  const sym1 = getDeterministicValue(symbols, "sym1_select") || '@';
  const sym2 = getDeterministicValue(symbols.filter(s => s !== sym1), "sym2_select") || '#';
  const sym3 = getDeterministicValue(symbols.filter(s => s !== sym1 && s !== sym2), "sym3_select") || '$';

  const parts: (string | undefined)[] = [];
  if (comp1 && comp1.length > 0) parts.push(comp1);
  parts.push(sym1);
  if (numPart && numPart.length > 0) parts.push(numPart);
  
  if (comp2 && comp2.length > 0 && (segment2 && segment1 && segment2 !== segment1)) { 
    parts.push(sym2);
    parts.push(comp2);
  }
  
  if (comp3 && comp3.length > 0) { // comp3 is already guaranteed to be from a distinct segment if non-empty
    parts.push(sym3);
    parts.push(comp3);
  }
  
  let generatedPassword = parts.filter(p => p && p.length > 0).join('');
  
  // --- Finalization (Length and Complexity) ---
  if (generatedPassword.length > PASSWORD_MAX_LENGTH) {
    generatedPassword = generatedPassword.substring(0, PASSWORD_MAX_LENGTH);
  }

  let tempPasswordArray = generatedPassword.split('');
  const complexityNeeds = {
    uppercase: !tempPasswordArray.some(char => /[A-Z]/.test(char)),
    lowercase: !tempPasswordArray.some(char => /[a-z]/.test(char)),
    number: !tempPasswordArray.some(char => /\d/.test(char)),
    special: !tempPasswordArray.some(char => /[^A-Za-z0-9]/.test(char)),
  };

  const fallbacks = DEFAULT_COMPLEXITY_FALLBACKS;
  let fallbackKeys = Object.keys(fallbacks) as (keyof typeof fallbacks)[];
  
  fallbackKeys.sort(); 

  for (const key of fallbackKeys) {
    if (complexityNeeds[key]) {
      if (tempPasswordArray.length < PASSWORD_MAX_LENGTH) {
        tempPasswordArray.push(fallbacks[key]);
      } else if (tempPasswordArray.length > 0) {
        const replaceIdx = tempPasswordArray.length - 1 - (fallbackKeys.indexOf(key) % tempPasswordArray.length);
        tempPasswordArray[Math.max(0, replaceIdx)] = fallbacks[key];
      }
    }
  }
  generatedPassword = tempPasswordArray.join('');

  if (generatedPassword.length < PASSWORD_MIN_LENGTH) {
    let paddingSource = baseSeed.replace(/[^a-zA-Z0-9!@#$%^&*()]/g, ''); 
    if (paddingSource.length === 0) paddingSource = "FieldKey01!";
    let currentPaddingIndex = 0;
    while (generatedPassword.length < PASSWORD_MIN_LENGTH) {
      generatedPassword += paddingSource.charAt(currentPaddingIndex % paddingSource.length);
      currentPaddingIndex++;
    }
  }

  if (generatedPassword.length > PASSWORD_MAX_LENGTH) {
    generatedPassword = generatedPassword.substring(0, PASSWORD_MAX_LENGTH);
  }
  
  return generatedPassword;
}


function generateLocalPassword(fieldValues: string[]): string {
  if (fieldValues.length === 0) {
    return '';
  }

  // 1. Process Each Field
  const processedFieldValues = fieldValues.map(val => {
    if (val.length <= 1) {
      return val;
    }
    const firstChar = val[0];
    const lastChar = val[val.length - 1];
    const middlePart = val.substring(1, val.length - 1);
    const reversedMiddle = middlePart.split('').reverse().join('');
    return firstChar + reversedMiddle + lastChar;
  });

  // 2. Interleave Processed Values
  let interleavedChars: string[] = [];
  let charIndex = 0;
  let interleaveLoopGuard = 0; 
  while (interleavedChars.length < PASSWORD_MAX_LENGTH && interleaveLoopGuard < 100) {
    let charAddedInThisPass = false;
    for (const value of processedFieldValues) {
      if (charIndex < value.length) {
        if (interleavedChars.length < PASSWORD_MAX_LENGTH) {
          interleavedChars.push(value[charIndex]);
          charAddedInThisPass = true;
        } else {
          break;
        }
      }
    }
    if (!charAddedInThisPass && interleavedChars.length > 0) break;
    if (interleavedChars.length >= PASSWORD_MAX_LENGTH) break;
    charIndex++;
    interleaveLoopGuard++;
  }
  
  let tempPasswordArray = [...interleavedChars];

  // 3. Enforce Complexity (Using Defaults)
  let needsUppercase = !tempPasswordArray.some(char => /[A-Z]/.test(char));
  let needsLowercase = !tempPasswordArray.some(char => /[a-z]/.test(char));
  let needsNumber = !tempPasswordArray.some(char => /\d/.test(char));
  let needsSpecial = !tempPasswordArray.some(char => /[^A-Za-z0-9]/.test(char));

  const fallbacksToApply: { char: string, type: keyof typeof DEFAULT_COMPLEXITY_FALLBACKS }[] = [];
  if (needsUppercase) fallbacksToApply.push({ char: DEFAULT_COMPLEXITY_FALLBACKS.uppercase, type: 'uppercase' });
  if (needsLowercase) fallbacksToApply.push({ char: DEFAULT_COMPLEXITY_FALLBACKS.lowercase, type: 'lowercase' });
  if (needsNumber) fallbacksToApply.push({ char: DEFAULT_COMPLEXITY_FALLBACKS.number, type: 'number' });
  if (needsSpecial) fallbacksToApply.push({ char: DEFAULT_COMPLEXITY_FALLBACKS.special, type: 'special' });
  
  fallbacksToApply.sort((a,b) => a.type.localeCompare(b.type)); 

  for (let i = 0; i < fallbacksToApply.length; i++) {
    const fallback = fallbacksToApply[i];
    if (tempPasswordArray.length < PASSWORD_MAX_LENGTH) {
      tempPasswordArray.push(fallback.char);
    } else if (tempPasswordArray.length > 0) {
      const replacementIndex = Math.max(0, tempPasswordArray.length - 1 - i);
      tempPasswordArray[replacementIndex] = fallback.char;
    }
  }
  
  let currentPassword = tempPasswordArray.join('');

  // 4. Length Management (Padding)
  if (currentPassword.length < PASSWORD_MIN_LENGTH) {
    let paddingSource = fieldValues.join(''); 
    if (paddingSource.length === 0) { 
      paddingSource = "FkSec#01"; 
    }
    
    let currentPaddingIndex = 0;
    while (currentPassword.length < PASSWORD_MIN_LENGTH) {
      currentPassword += paddingSource.charAt(currentPaddingIndex % paddingSource.length);
      currentPaddingIndex++;
    }
  }

  // 5. Final Truncation
  if (currentPassword.length > PASSWORD_MAX_LENGTH) {
    currentPassword = currentPassword.substring(0, PASSWORD_MAX_LENGTH);
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
  const { toast } = useToast();
  // const router = useRouter(); // No longer used

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
      const anyFieldsIncluded = fields.some(field => field.included);
      const anyFieldsHaveValue = fields.some(field => field.value.trim() !== '');

      if (!anyFieldsIncluded && anyFieldsHaveValue) {
        toast({
            title: 'No fields included',
            description: 'Please mark some fields as "included" for password generation.',
            variant: 'destructive',
        });
      } else if (anyFieldsIncluded && !anyFieldsHaveValue) {
         toast({
            title: 'Included fields are empty',
            description: 'Please provide values for your included fields.',
            variant: 'destructive',
        });
      } else { 
        toast({
            title: 'No inputs for password',
            description: 'Please add values to your fields and ensure they are included and not empty.',
            variant: 'destructive',
        });
      }
      setGeneratedPassword('');
      return;
    }

    const fieldValuesInOrder = includedFieldsWithValue.map(field => field.value);
    
    setIsLoading(true); 
    setGeneratedPassword(''); 

    try {
      // Simulate a short delay for visual feedback, can be removed if not desired
      setTimeout(() => { 
        let newPassword = '';
        if (generationMode === 'smart') {
            newPassword = generateSmartPassword(fieldValuesInOrder);
        } else {
            newPassword = generateLocalPassword(fieldValuesInOrder);
        }

        if (newPassword) {
          setGeneratedPassword(newPassword);
        } else {
          setError("Could not generate a password. Try different inputs or modes.");
          toast({
            title: 'Password Generation Failed',
            description: 'Could not generate a password with the given inputs. Please try modifying your field values or generation mode.',
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
  }, [fields, generationMode]); 

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
          <div>
            <h3 className="text-xl font-semibold mb-2">Generation Mode</h3>
            <RadioGroup
                defaultValue="normal"
                value={generationMode}
                onValueChange={(value: 'normal' | 'smart') => setGenerationMode(value)}
                className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="mode-normal" />
                    <Label htmlFor="mode-normal" className="cursor-pointer">Normal Mode</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="smart" id="mode-smart" />
                    <Label htmlFor="mode-smart" className="cursor-pointer">Smart Mode</Label>
                </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mb-4">
                {generationMode === 'normal' 
                    ? "Normal mode uses a direct transformation of your field values." 
                    : "Smart mode analyzes your inputs to create a more complex, structured password using segments of your words."}
            </p>
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
    

    