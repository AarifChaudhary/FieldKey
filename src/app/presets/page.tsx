
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
import { PlusCircle, Edit3, Trash2, UploadCloud } from 'lucide-react'; // Removed CheckCircle

const PRESETS_STORAGE_KEY = 'fieldkey-presets';
const TEMP_FIELDS_STORAGE_KEY = 'fieldkey-fields-to-preset';

export default function PresetsPage() {
  const [presets, setPresets] = useLocalStorage<Preset[]>(PRESETS_STORAGE_KEY, []);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [currentFieldsForNewPreset, setCurrentFieldsForNewPreset] = useState<PresetFieldDefinition[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fieldsToPresetJSON = localStorage.getItem(TEMP_FIELDS_STORAGE_KEY);
    if (fieldsToPresetJSON) {
      try {
        const parsedFields: PresetFieldDefinition[] = JSON.parse(fieldsToPresetJSON);
        setCurrentFieldsForNewPreset(parsedFields);
        // Focus the input field for preset name if fields were loaded
        const nameInput = document.getElementById('new-preset-name-input');
        if (nameInput) {
          nameInput.focus();
        }
        toast({
          title: "Field Layout Loaded",
          description: "Enter a name for your new preset based on the field layout from the generator page.",
        });
      } catch (error) {
        console.error("Error parsing fields from localStorage:", error);
        toast({ title: "Error loading field layout", variant: "destructive" });
        setCurrentFieldsForNewPreset([]); // Reset to empty if parsing fails
      } finally {
        localStorage.removeItem(TEMP_FIELDS_STORAGE_KEY); // Clean up immediately after trying to load
      }
    } else {
      // If no fields passed, initialize with a default structure or empty.
      // For now, an empty array is fine. User can still define presets manually if desired,
      // though primary flow is from generator.
      setCurrentFieldsForNewPreset([]);
    }
  }, [toast]);


  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast({ title: 'Preset name required', variant: 'destructive' });
      return;
    }
    if (currentFieldsForNewPreset.length === 0) {
        toast({ title: 'No field layout to save', description: 'Define a field layout on the Generator page first, then click "Save Field Layout as Preset".', variant: 'destructive' });
        return;
    }

    const newPreset: Preset = {
      id: Date.now().toString(), 
      name: newPresetName.trim(),
      fields: currentFieldsForNewPreset,
    };
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setCurrentFieldsForNewPreset([]); // Clear fields after saving
    toast({ title: 'Preset Saved', description: `"${newPreset.name}" has been saved.` });
  };

  const handleLoadPreset = (presetId: string) => {
    const presetToLoad = presets.find(p => p.id === presetId);
    if (presetToLoad) {
      // Store the preset's fields in localStorage for the generator page to pick up
      localStorage.setItem(TEMP_FIELDS_STORAGE_KEY, JSON.stringify(presetToLoad.fields));
      toast({ title: 'Preset Loaded', description: `"${presetToLoad.name}" is ready. Go to the Generator page to use it.` });
      // Optionally, navigate to generator page: router.push('/'); (requires importing useRouter)
    }
  };

  const handleRenamePreset = () => {
    if (!editingPreset || !newPresetName.trim()) {
      toast({ title: 'Error renaming preset', variant: 'destructive' });
      return;
    }
    setPresets(presets.map(p => p.id === editingPreset.id ? { ...p, name: newPresetName.trim() } : p));
    setEditingPreset(null);
    setNewPresetName(''); // Clear input after renaming
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
            Save and load your field layouts (labels, order, and include status). Field values are not stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 p-4 border rounded-lg bg-card/30">
            <h3 className="text-xl font-semibold">
              {currentFieldsForNewPreset.length > 0 ? "Save Imported Field Layout" : "Create New Preset Manually"}
            </h3>
            {currentFieldsForNewPreset.length > 0 && (
              <div className="mb-3 p-3 border rounded-md bg-background">
                <p className="text-sm font-medium">Fields to be saved in this preset:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground">
                  {currentFieldsForNewPreset.map(f => <li key={f.id}>{f.label} ({f.included ? "Included" : "Not Included"})</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="new-preset-name-input"
                type="text"
                placeholder="New preset name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
              <Button onClick={handleSavePreset} disabled={currentFieldsForNewPreset.length === 0 && !newPresetName.trim()}> 
                {/* Disable if no fields AND no name for manual creation (though manual creation is not primary) */}
                <PlusCircle className="mr-2 h-4 w-4" /> Save Preset
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
              {currentFieldsForNewPreset.length > 0 
                ? "The field layout from the Generator page is ready. Enter a name and save."
                : 'To save a field layout, first configure fields on the Generator page and click "Save Field Layout as Preset".'}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your Saved Presets</h3>
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
                        <Dialog onOpenChange={(open) => { if (!open) { setEditingPreset(null); setNewPresetName(''); } }}>
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

