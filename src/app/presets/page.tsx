"use client";

import { useState, useEffect } from 'react';
import type { Preset, PresetFieldDefinition } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit3, Trash2, UploadCloud, CheckCircle } from 'lucide-react';

const PRESETS_STORAGE_KEY = 'fieldkey-presets';

export default function PresetsPage() {
  const [presets, setPresets] = useLocalStorage<Preset[]>(PRESETS_STORAGE_KEY, []);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [currentFieldsForNewPreset, setCurrentFieldsForNewPreset] = useState<PresetFieldDefinition[]>([]);
  const { toast } = useToast();

  // This is a placeholder. In a real app, you'd get these from the generator page state/context.
  useEffect(() => {
    // Simulate loading current field structure from another part of the app (e.g., generator page)
    // For now, using a default structure for demonstration.
    const exampleFields: PresetFieldDefinition[] = [
      { id: '1', label: 'Site Name', included: true },
      { id: '2', label: 'Username', included: true },
    ];
    setCurrentFieldsForNewPreset(exampleFields);
  }, []);


  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast({ title: 'Preset name required', variant: 'destructive' });
      return;
    }
    if (currentFieldsForNewPreset.length === 0) {
        toast({ title: 'No fields to save', description: 'Add some fields in the generator before saving a preset.', variant: 'destructive' });
        return;
    }

    const newPreset: Preset = {
      id: Date.now().toString(), // Simple ID generation
      name: newPresetName.trim(),
      fields: currentFieldsForNewPreset,
    };
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    toast({ title: 'Preset Saved', description: `"${newPreset.name}" has been saved.` });
  };

  const handleLoadPreset = (presetId: string) => {
    const presetToLoad = presets.find(p => p.id === presetId);
    if (presetToLoad) {
      // In a real app, you would navigate to the generator page and populate its fields
      // with presetToLoad.fields. For now, just a toast.
      toast({ title: 'Preset Loaded', description: `"${presetToLoad.name}" loaded. (Fields would be updated on Generator page)` });
    }
  };

  const handleRenamePreset = () => {
    if (!editingPreset || !newPresetName.trim()) {
      toast({ title: 'Error renaming preset', variant: 'destructive' });
      return;
    }
    setPresets(presets.map(p => p.id === editingPreset.id ? { ...p, name: newPresetName.trim() } : p));
    setEditingPreset(null);
    setNewPresetName('');
    toast({ title: 'Preset Renamed' });
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets(presets.filter(p => p.id !== presetId));
    toast({ title: 'Preset Deleted' });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Manage Presets</CardTitle>
          <CardDescription>
            Save and load your field configurations. Field values are not stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Save Current Configuration as Preset</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="New preset name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
              <Button onClick={handleSavePreset}><PlusCircle className="mr-2 h-4 w-4" /> Save Preset</Button>
            </div>
             <p className="text-xs text-muted-foreground">
              Note: This saves the current field labels, order, and include status from the Generator page.
              (Currently using example fields for demonstration).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your Presets</h3>
            {presets.length === 0 ? (
              <p className="text-muted-foreground">You have no saved presets.</p>
            ) : (
              <ScrollArea className="h-72 rounded-md border">
                <div className="p-4 space-y-3">
                {presets.map((preset) => (
                  <Card key={preset.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{preset.name}</span>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleLoadPreset(preset.id)}>
                          <UploadCloud className="mr-2 h-4 w-4" /> Load
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setEditingPreset(preset); setNewPresetName(preset.name); }}>
                              <Edit3 className="mr-2 h-4 w-4" /> Rename
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rename Preset</DialogTitle>
                              <DialogDescription>Enter a new name for "{editingPreset?.name}".</DialogDescription>
                            </DialogHeader>
                            <Input
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="New preset name"
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
                            <Button variant="destructive" size="sm">
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
                     <p className="text-xs text-muted-foreground mt-1">
                        Fields: {preset.fields.map(f => f.label).join(', ')}
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
