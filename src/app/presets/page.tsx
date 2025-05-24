
"use client";

import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import type { Preset } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Trash2, UploadCloud } from 'lucide-react';
import { PRESETS_STORAGE_KEY, TEMP_FIELDS_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';


export default function PresetsPage() {
  // Use useMemo for initialPresets to ensure stable reference
  const initialPresets = useMemo(() => [], []);
  const [presets, setPresets] = useLocalStorage<Preset[]>(PRESETS_STORAGE_KEY, initialPresets);

  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [renamePresetName, setRenamePresetName] = useState(''); // For rename modal
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fieldsToPresetJSON = localStorage.getItem(TEMP_FIELDS_STORAGE_KEY);
    if (fieldsToPresetJSON) {
      localStorage.removeItem(TEMP_FIELDS_STORAGE_KEY);
      toast({
          title: "Ready to Manage Presets",
          description: "Create new presets directly from the Generator page using the 'Save Field Layout' button.",
          variant: "default"
      });
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Manage Presets</CardTitle>
          <CardDescription>
            Load, rename, or delete your saved field layouts. Values are not stored in presets.
            To create a new preset, use the "Save Field Layout as Preset" button on the Generator page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your Saved Presets</h3>
            {presets.length === 0 ? (
              <p className="text-muted-foreground">
                You have no saved presets. Go to the Generator page to create one.
              </p>
            ) : (
              <ScrollArea className="h-96 rounded-md border"> {/* Increased height */}
                <div className="p-4 space-y-3">
                {presets.map((preset) => (
                  <Card key={preset.id} className="p-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
                      <span className="font-medium flex-1 min-w-0 break-words pr-2">{preset.name}</span>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleLoadPreset(preset.id)}>
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
                            <Button variant="outline" size="sm">
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
