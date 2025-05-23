
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
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_FIELDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;
const PADDING_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>/?";

// Helper function to shuffle a string (Fisher-Yates shuffle)
function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

// Local password generation logic
function generateLocalPassword(fieldValues: string[]): string {
  if (fieldValues.length === 0) {
    return '';
  }

  let rawPassword = fieldValues.join('');

  // Ensure basic complexity
  if (!/[A-Z]/.test(rawPassword)) rawPassword += 'A';
  if (!/[a-z]/.test(rawPassword)) rawPassword += 'a';
  if (!/\d/.test(rawPassword)) rawPassword += '1';
  if (!/[^A-Za-z0-9]/.test(rawPassword)) rawPassword += '!';

  // Shuffle to better mix the appended characters
  rawPassword = shuffleString(rawPassword);

  // Adjust length
  while (rawPassword.length < PASSWORD_MIN_LENGTH) {
    rawPassword += PADDING_CHARS.charAt(Math.floor(Math.random() * PADDING_CHARS.length));
  }

  if (rawPassword.length > PASSWORD_MAX_LENGTH) {
    rawPassword = rawPassword.substring(0, PASSWORD_MAX_LENGTH);
  }
  
  // One final shuffle after length adjustment
  rawPassword = shuffleString(rawPassword);

  return rawPassword;
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
  
  const handleGeneratePassword = async () => {
    setError(null);
    const includedFields = fields.filter(field => field.included && field.value.trim() !== '');
    if (includedFields.length === 0) {
      toast({
        title: 'No input values',
        description: 'Please provide values for some included fields to generate a password.',
        variant: 'destructive',
      });
      setGeneratedPassword('');
      return;
    }

    const fieldValues = includedFields.map(field => field.value);
    
    setIsLoading(true);
    setGeneratedPassword(''); // Clear previous password
    
    // Simulate a short delay for local generation to mimic async behavior if needed for UI
    await new Promise(resolve => setTimeout(resolve, 100)); 

    try {
      const newPassword = generateLocalPassword(fieldValues);
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
    } catch (err) {
      console.error("Error generating password:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate password: ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Password generation failed: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate password when fields change, if not loading and a password was already generated or inputs are present
   useEffect(() => {
    const hasInputs = fields.some(f => f.included && f.value.trim() !== '');
    if (!isLoading && hasInputs) {
      handleGeneratePassword();
    } else if (!hasInputs) {
      setGeneratedPassword(''); // Clear password if no inputs
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]); // Dependency array: fields, so it re-runs when fields change.

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
            <Button onClick={handleAddField} variant="outline" className="mt-4" disabled={fields.length >= MAX_FIELDS}>
              Add Field
            </Button>
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
                Your generated password will appear here once you provide input values.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
           <Button onClick={handleGeneratePassword} disabled={isLoading} size="lg" className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Password Manually'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
