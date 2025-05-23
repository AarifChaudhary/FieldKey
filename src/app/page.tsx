
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

  let rawPassword = fieldValues.join('');

  // Ensure basic complexity deterministically
  if (!/[A-Z]/.test(rawPassword)) rawPassword += COMPLEXITY_CHARS.uppercase;
  if (!/[a-z]/.test(rawPassword)) rawPassword += COMPLEXITY_CHARS.lowercase;
  if (!/\d/.test(rawPassword)) rawPassword += COMPLEXITY_CHARS.number;
  if (!/[^A-Za-z0-9]/.test(rawPassword)) rawPassword += COMPLEXITY_CHARS.special;

  // Adjust length deterministically
  let paddingIndex = 0;
  while (rawPassword.length < PASSWORD_MIN_LENGTH) {
    rawPassword += PADDING_CHARS.charAt(paddingIndex % PADDING_CHARS.length);
    paddingIndex++;
  }

  if (rawPassword.length > PASSWORD_MAX_LENGTH) {
    rawPassword = rawPassword.substring(0, PASSWORD_MAX_LENGTH);
  }
  
  return rawPassword;
}


export default function HomePage() {
  const [fields, setFields] = useState<FieldDefinition[]>(() => [
    { id: 'initial-field-site-name', label: 'Site Name', value: '', included: true },
    { id: 'initial-field-username', label: 'Username', value: '', included: true },
  ]);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // Kept for potential future async ops, though current is sync
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
  
  const handleGeneratePassword = () => { // Made synchronous
    setError(null);
    const includedFields = fields.filter(field => field.included && field.value.trim() !== '');
    
    if (includedFields.length === 0) {
      const hasAnyValue = fields.some(field => field.value.trim() !== '');
      if (hasAnyValue) { // Some fields have values, but none are included
        toast({
            title: 'No included fields with values',
            description: 'Please include fields with values, or provide values for included fields.',
            variant: 'destructive',
        });
      } else { // No values at all
         toast({
            title: 'No input values',
            description: 'Please provide values for some fields to generate a password.',
            variant: 'destructive',
        });
      }
      setGeneratedPassword('');
      return;
    }

    const fieldValues = includedFields.map(field => field.value);
    
    // Since generation is now synchronous, setIsLoading might not be strictly necessary
    // but kept if future versions re-introduce async aspects or for UI consistency.
    setIsLoading(true); 
    setGeneratedPassword(''); 

    try {
      const newPassword = generateLocalPassword(fieldValues);
      if (newPassword) {
        setGeneratedPassword(newPassword);
      } else {
        // This case should ideally not be hit if fieldValues is not empty
        setError("Could not generate a password. Try different inputs.");
        toast({
          title: 'Password Generation Failed',
          description: 'Could not generate a password with the given inputs. Please try modifying your field values.',
          variant: 'destructive',
        });
      }
    } catch (err) { // Should be rare for this simple sync logic
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

  // Auto-generate password when fields change
   useEffect(() => {
    const hasInputs = fields.some(f => f.included && f.value.trim() !== '');
    if (hasInputs) {
      handleGeneratePassword();
    } else {
      setGeneratedPassword(''); // Clear password if no included inputs
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

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
            {isLoading && ( // Kept for UI consistency, though generation is now fast
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
