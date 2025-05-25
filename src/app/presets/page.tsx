
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Preset, PresetFieldDefinition } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Trash2, UploadCloud, Download, FileUp } from 'lucide-react'; // Added Download & FileUp
import { PRESETS_STORAGE_KEY, TEMP_FIELDS_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';


export default function PresetsPage() {
  const initialPresets = useMemo(() => [], []);
  const [presets, setPresets] = useLocalStorage<Preset[]>(PRESETS_STORAGE_KEY, initialPresets);

  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [renamePresetName, setRenamePresetName] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fieldsToPresetJSON = localStorage.getItem(TEMP_FIELDS_STORAGE_KEY);
    if (fieldsToPresetJSON) {
      localStorage.removeItem(TEMP_FIELDS_STORAGE_KEY);
      // Toast for navigation from generator can be added here if needed,
      // but often silent load is preferred.
    }
  }, [toast]);


  const handleLoadPreset = (presetId: string) => {
    const presetToLoad = presets.find(p => p.id === presetId);
    if (presetToLoad) {
      localStorage.setItem(TEMP_FIELDS_STORAGE_KEY, JSON.stringify(presetToLoad.fields));
      toast({ title: 'Preset Fields Copied', description: `"${presetToLoad.name}" field layout is ready. Navigating to the Generator page...` });
      router.push('/');
    }
  };

  const handleRenamePreset = () => {
    if (!editingPreset || !renamePresetName.trim()) {
      toast({ title: 'Error renaming preset', description: 'Preset name cannot be empty.', variant: 'destructive' });
      return;
    }
    setPresets(presets.map(p => p.id === editingPreset.id ? { ...p, name: renamePresetName.trim() } : p));
    setEditingPreset(null);
    setRenamePresetName('');
    toast({ title: 'Preset Renamed' });
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets(presets.filter(p => p.id !== presetId));
    toast({ title: 'Preset Deleted' });
  };

  const handleExportPresets = () => {
    if (presets.length === 0) {
      toast({
        title: 'No Presets to Export',
        description: 'You have no saved presets to export.',
        variant: 'default',
      });
      return;
    }
    const jsonString = JSON.stringify(presets, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'fieldkey-presets-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast({
      title: 'Presets Exported',
      description: 'Your presets have been downloaded as a JSON file.',
    });
  };

  const isValidPreset = (item: any): item is Preset => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      Array.isArray(item.fields) &&
      item.fields.every(isValidPresetField)
    );
  };
  
  const isValidPresetField = (field: any): field is PresetFieldDefinition => {
    return (
      typeof field === 'object' &&
      field !== null &&
      typeof field.id === 'string' &&
      typeof field.label === 'string' &&
      typeof field.included === 'boolean'
    );
  };

  const handleImportPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not a string.");
        }
        const importedData = JSON.parse(text);

        if (!Array.isArray(importedData) || !importedData.every(isValidPreset)) {
          toast({
            title: 'Import Failed',
            description: 'Invalid JSON format or structure for presets.',
            variant: 'destructive',
          });
          return;
        }
        
        const validatedImportedPresets = importedData as Preset[];

        let importedCount = 0;
        let skippedCount = 0;
        
        setPresets(currentPresets => {
          const existingIds = new Set(currentPresets.map(p => p.id));
          const newPresetsToAdd: Preset[] = [];

          validatedImportedPresets.forEach(importedPreset => {
            if (!existingIds.has(importedPreset.id)) {
              newPresetsToAdd.push(importedPreset);
              existingIds.add(importedPreset.id); // Add to set to handle duplicates within the imported file itself
              importedCount++;
            } else {
              skippedCount++;
            }
          });
          return [...currentPresets, ...newPresetsToAdd];
        });

        toast({
          title: 'Import Successful',
          description: `${importedCount} preset(s) imported. ${skippedCount} duplicate(s) skipped.`,
        });

      } catch (error) {
        console.error("Error importing presets:", error);
        toast({
          title: 'Import Failed',
          description: 'Could not parse the JSON file or an error occurred.',
          variant: 'destructive',
        });
      } finally {
        // Reset file input to allow importing the same file again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Manage Presets</CardTitle>
          <CardDescription>
            Load, rename, or delete your saved field layouts. You can also import or export your presets.
            To create a new preset, use the "Save Field Layout as Preset" button on the Generator page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <Button onClick={handleExportPresets} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Export All Presets
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <label htmlFor="import-presets-file" className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" /> Import Presets
                <input 
                  type="file" 
                  id="import-presets-file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".json" 
                  onChange={handleImportPresets} 
                />
              </label>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your Saved Presets</h3>
            {presets.length === 0 ? (
              <p className="text-muted-foreground">
                You have no saved presets. Go to the Generator page to create one, or import a backup.
              </p>
            ) : (
              <ScrollArea className="h-80 rounded-md border"> {/* Adjusted height */}
                <div className="p-4 space-y-3">
                {presets.map((preset) => (
                  <Card key={preset.id} className="p-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-3 sm:space-y-0">
                      <span className="font-medium flex-1 min-w-0 break-words pr-2">{preset.name}</span>
                      <div className="flex flex-col space-y-2 xs:flex-row xs:space-y-0 xs:space-x-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleLoadPreset(preset.id)} className="w-full xs:w-auto">
                          <UploadCloud className="mr-2 h-4 w-4" /> Load
                        </Button>
                        <Dialog
                            open={editingPreset?.id === preset.id}
                            onOpenChange={(open) => {
                                if (open) {
                                    setEditingPreset(preset);
                                    setRenamePresetName(preset.name);
                                } else {
                                    setEditingPreset(null);
                                    setRenamePresetName('');
                                }
                            }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full xs:w-auto">
                              <Edit3 className="mr-2 h-4 w-4" /> Rename
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rename Preset</DialogTitle>
                              <DialogDescription>Enter a new name for "{editingPreset?.name}".</DialogDescription>
                            </DialogHeader>
                            <Input
                              value={renamePresetName}
                              onChange={(e) => setRenamePresetName(e.target.value)}
                              placeholder="New preset name"
                              className="my-4"
                            />
                            <DialogFooter>
                               <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button onClick={handleRenamePreset}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full xs:w-auto">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </DialogTrigger>
                           <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Preset</DialogTitle>
                              <DialogDescription>Are you sure you want to delete the preset "{preset.name}"?</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button variant="destructive" onClick={() => handleDeletePreset(preset.id)}>Delete</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                     <p className="text-xs text-muted-foreground mt-2 break-words">
                        Fields: {preset.fields.map(f => `${f.label} (${f.included ? "Incl." : "Excl."})`).join(', ')}
                    </p>
                  </Card>
                ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

