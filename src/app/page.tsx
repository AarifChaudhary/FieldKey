
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
const PADDING_CHARS = "!@#$%^&*()-_=+[]{};:,.<>/?abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const COMPLEXITY_CHARS = {
  uppercase: 'A',
  lowercase: 'z',
  number: '1',
  special: '!',
};

function generateLocalPassword(fieldValues: string[]): string {
  if (fieldValues.length === 0) {
    return '';
  }

  let rawPasswordChars: string[] = [];
  let charIndex = 0;
  while (rawPasswordChars.length < PASSWORD_MAX_LENGTH && charIndex < 100) {
    let charAddedInThisPass = false;
    for (const value of fieldValues) {
      if (charIndex < value.length) {
        if (rawPasswordChars.length < PASSWORD_MAX_LENGTH) {
          rawPasswordChars.push(value[charIndex]);
          charAddedInThisPass = true;
        } else {
          break;
        }
      }
    }
    if (!charAddedInThisPass) {
      break;
    }
    charIndex++;
  }
  
  let password = rawPasswordChars.join('');

  let hasUppercase = /[A-Z]/.test(password);
  let hasLowercase = /[a-z]/.test(password);
  let hasNumber = /\d/.test(password);
  let hasSpecial = /[^A-Za-z0-9]/.test(password);

  const neededComplexityChars: string[] = [];
  if (!hasUppercase) neededComplexityChars.push(COMPLEXITY_CHARS.uppercase);
  if (!hasLowercase) neededComplexityChars.push(COMPLEXITY_CHARS.lowercase);
  if (!hasNumber) neededComplexityChars.push(COMPLEXITY_CHARS.number);
  if (!hasSpecial) neededComplexityChars.push(COMPLEXITY_CHARS.special);
  
  let tempPasswordArray = password.split('');

  for (let i = 0; i < neededComplexityChars.length; i++) {
    const charToAdd = neededComplexityChars[i];
    if (tempPasswordArray.length < PASSWORD_MAX_LENGTH) {
      tempPasswordArray.push(charToAdd);
    } else {
      const replacementIndex = PASSWORD_MAX_LENGTH - 1 - i;
      if (replacementIndex >= 0 && replacementIndex < tempPasswordArray.length) {
         tempPasswordArray[replacementIndex] = charToAdd;
      }
    }
  }
  password = tempPasswordArray.join('');
  
  let paddingLoopIndex = 0;
  tempPasswordArray = password.split('');
  while (tempPasswordArray.length < PASSWORD_MIN_LENGTH) {
    tempPasswordArray.push(PADDING_CHARS.charAt(paddingLoopIndex % PADDING_CHARS.length));
    paddingLoopIndex++;
  }
  password = tempPasswordArray.join('');

  if (password.length > PASSWORD_MAX_LENGTH) {
    password = password.substring(0, PASSWORD_MAX_LENGTH);
  }
  
  return password;
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
          value: '', // Values are not stored in presets
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
  
  const handleGeneratePassword = () => { 
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
      } else if (!anyFieldsIncluded && !anyFieldsHaveValue) {
        toast({
            title: 'No inputs for password',
            description: 'Please add values to your fields and ensure they are included.',
            variant: 'destructive',
        });
      } else { 
         toast({
            title: 'Included fields are effectively empty',
            description: 'Please ensure your included fields have non-whitespace values.',
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
      handleGeneratePassword();
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
           <Button onClick={handleGeneratePassword} disabled={isLoading || !fields.some(f => f.included && f.value.trim() !== '')} size="lg" className="w-full md:w-auto">
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
