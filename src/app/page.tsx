
"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { FieldDefinition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FieldList from '@/components/fields/field-list';
import PasswordDisplay from '@/components/password-display';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2, Save } from 'lucide-react'; // Added Save icon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation'; // Added useRouter

const MAX_FIELDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;
// Using a fixed set of characters for deterministic padding and complexity.
const PADDING_CHARS = "!@#$%^&*()-_=+[]{};:,.<>/?abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const COMPLEXITY_CHARS = {
  uppercase: 'A',
  lowercase: 'z',
  number: '1',
  special: '!',
};

// Deterministic local password generation logic
function generateLocalPassword(fieldValues: string[]): string {
  if (fieldValues.length === 0) {
    return '';
  }

  let rawPasswordChars: string[] = [];
  let charIndex = 0;
  // Max charIndex of 100 is a safety break, actual break is when no more chars can be added or max length is reached.
  while (rawPasswordChars.length < PASSWORD_MAX_LENGTH && charIndex < 100) {
    let charAddedInThisPass = false;
    for (const value of fieldValues) {
      if (charIndex < value.length) {
        if (rawPasswordChars.length < PASSWORD_MAX_LENGTH) {
          rawPasswordChars.push(value[charIndex]);
          charAddedInThisPass = true;
        } else {
          break; // Max password length reached
        }
      }
    }
    if (!charAddedInThisPass) {
      // If no characters were added from any field at this charIndex, we're done with interleaving.
      break;
    }
    charIndex++;
  }
  
  let password = rawPasswordChars.join('');

  // Ensure basic complexity
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
      // Replace characters from the end to ensure complexity
      const replacementIndex = PASSWORD_MAX_LENGTH - 1 - i;
      if (replacementIndex >= 0 && replacementIndex < tempPasswordArray.length) {
         tempPasswordArray[replacementIndex] = charToAdd;
      }
    }
  }
  password = tempPasswordArray.join('');
  
  // Adjust length: Pad if too short
  let paddingLoopIndex = 0;
  tempPasswordArray = password.split(''); // Re-split as it might have changed
  while (tempPasswordArray.length < PASSWORD_MIN_LENGTH) {
    tempPasswordArray.push(PADDING_CHARS.charAt(paddingLoopIndex % PADDING_CHARS.length));
    paddingLoopIndex++;
  }
  password = tempPasswordArray.join('');

  // Final truncation if somehow it became too long 
  if (password.length > PASSWORD_MAX_LENGTH) {
    password = password.substring(0, PASSWORD_MAX_LENGTH);
  }
  
  return password;
}


export default function HomePage() {
  const [fields, setFields] = useState<FieldDefinition[]>(() => [
    { id: 'initial-field-site-name', label: 'Site Name', value: '', included: true },
    { id: 'initial-field-username', label: 'Username', value: '', included: true },
  ]);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

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

  const handleSaveLayoutAsPreset = () => {
    if (fields.length === 0) {
      toast({
        title: 'No fields to save',
        description: 'Please add some fields before saving a preset.',
        variant: 'destructive',
      });
      return;
    }
    const fieldsForPreset = fields.map(({ id, label, included }) => ({ id, label, included }));
    localStorage.setItem('fieldkey-fields-to-preset', JSON.stringify(fieldsForPreset));
    toast({
      title: 'Field Layout Ready',
      description: 'Navigating to Presets page to name and save your field layout.',
    });
    router.push('/presets');
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
                <Button onClick={handleSaveLayoutAsPreset} variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save Field Layout as Preset
                </Button>
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
