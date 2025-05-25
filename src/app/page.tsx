
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
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
// Simple, deterministic leetspeak map
const LEET_MAP: { [key: string]: string } = {
  'o': '0', 'O': '0',
  'l': '1', 'I': '1',
  'e': '3', 'E': '3',
  'a': '4', 'A': '4',
  's': '5', 'S': '5',
  't': '7', 'T': '7',
  'b': '8', 'B': '8',
  'g': '9', 'G': '9', // Can also be '6' for 'G'
};


function generateLocalPassword(fieldValues: string[]): string {
  if (fieldValues.length === 0) {
    return '';
  }

  // 1. Interleave inputs to form the base
  let interleavedChars: string[] = [];
  let charIndex = 0;
  while (interleavedChars.length < PASSWORD_MAX_LENGTH && charIndex < 100) { // Safeguard charIndex
    let charAddedInThisPass = false;
    for (const value of fieldValues) {
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
  }
  let tempPasswordArray = interleavedChars; // Work with this array

  // Full character pool from user inputs for transformations/padding checks
  const characterPool = fieldValues.join('');

  // 2. Complexity Pass (Transform First, then Default Fallback)
  let needsUppercase = !tempPasswordArray.some(char => /[A-Z]/.test(char));
  let needsLowercase = !tempPasswordArray.some(char => /[a-z]/.test(char));
  let needsNumber = !tempPasswordArray.some(char => /\d/.test(char));
  let needsSpecial = !tempPasswordArray.some(char => /[^A-Za-z0-9]/.test(char));

  // Attempt Transformations
  if (needsUppercase) {
    for (let i = 0; i < tempPasswordArray.length; i++) {
      if (/[a-z]/.test(tempPasswordArray[i])) {
        tempPasswordArray[i] = tempPasswordArray[i].toUpperCase();
        needsUppercase = false;
        break;
      }
    }
  }
  if (needsLowercase) {
    for (let i = 0; i < tempPasswordArray.length; i++) {
      if (/[A-Z]/.test(tempPasswordArray[i])) {
        tempPasswordArray[i] = tempPasswordArray[i].toLowerCase();
        needsLowercase = false;
        break;
      }
    }
  }
  if (needsNumber) {
    for (let i = 0; i < tempPasswordArray.length; i++) {
      if (LEET_MAP[tempPasswordArray[i].toLowerCase()]) { // Check lowercase for broader match
        tempPasswordArray[i] = LEET_MAP[tempPasswordArray[i].toLowerCase()];
        needsNumber = false;
        break;
      }
    }
  }
  if (needsSpecial) {
    let specialCharFromPool = '';
    for (const char of characterPool) {
      if (/[^A-Za-z0-9]/.test(char)) {
        specialCharFromPool = char;
        break;
      }
    }
    if (specialCharFromPool) {
      if (tempPasswordArray.length < PASSWORD_MAX_LENGTH) {
        tempPasswordArray.push(specialCharFromPool);
      } else if (tempPasswordArray.length > 0) { // Replace last if at max length
        tempPasswordArray[tempPasswordArray.length - 1] = specialCharFromPool;
      }
      needsSpecial = false;
    }
  }

  // Fallback to Default Complexity Characters if still needed
  const fallbacksToAdd: string[] = [];
  if (needsUppercase) fallbacksToAdd.push(DEFAULT_COMPLEXITY_FALLBACKS.uppercase);
  if (needsLowercase) fallbacksToAdd.push(DEFAULT_COMPLEXITY_FALLBACKS.lowercase);
  if (needsNumber) fallbacksToAdd.push(DEFAULT_COMPLEXITY_FALLBACKS.number);
  if (needsSpecial) fallbacksToAdd.push(DEFAULT_COMPLEXITY_FALLBACKS.special);
  
  for (let i = 0; i < fallbacksToAdd.length; i++) {
    const charToAdd = fallbacksToAdd[i];
    if (tempPasswordArray.length < PASSWORD_MAX_LENGTH) {
      tempPasswordArray.push(charToAdd);
    } else if (tempPasswordArray.length > 0) {
      // Replace from the end, ensuring not to replace what we just added/transformed if possible
      // A simple strategy: replace characters starting from (length - fallbacks.length + current_fallback_idx)
      // More robust: replace characters that are not part of an already met complexity type.
      // For now, simple replacement from end for remaining defaults.
      const replacementIndex = Math.max(0, tempPasswordArray.length - fallbacksToAdd.length + i);
      tempPasswordArray[replacementIndex] = charToAdd;
    }
  }
  
  let currentPassword = tempPasswordArray.join('');

  // 3. Length Management (Padding)
  if (currentPassword.length < PASSWORD_MIN_LENGTH) {
    let paddingSource = interleavedChars.join(''); // Use the user's interleaved data for padding
    if (paddingSource.length === 0) { 
      paddingSource = "FkSec#01"; // Fallback if user inputs were all empty
    }
    let currentPaddingIndex = 0;
    while (currentPassword.length < PASSWORD_MIN_LENGTH) {
      currentPassword += paddingSource.charAt(currentPaddingIndex % paddingSource.length);
      currentPaddingIndex++;
    }
  }

  // 4. Final Truncation (should be rare if logic is tight)
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
  const { toast } = useToast();
  const router = useRouter();

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
        const newPassword = generateLocalPassword(fieldValuesInOrder);
        if (newPassword) {
          setGeneratedPassword(newPassword);
        } else {
          setError("Could not generate a password. Try different inputs.");
          toast({
            title: 'Password Generation Failed',
            description: 'Could not generate a password with the given inputs. Please try modifying your field values.',
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
  }, [fields]); 

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
