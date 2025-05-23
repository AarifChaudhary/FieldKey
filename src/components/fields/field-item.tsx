"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FieldDefinition } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FieldItemProps {
  field: FieldDefinition;
  onFieldChange: (id: string, newField: Partial<FieldDefinition>) => void;
  onRemoveField: (id: string) => void;
  isOnlyField: boolean;
}

export default function FieldItem({ field, onFieldChange, onRemoveField, isOnlyField }: FieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="bg-card/50 border rounded-lg">
      <CardContent className="p-4 flex items-center space-x-3">
        <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1" aria-label="Drag to reorder field">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor={`label-${field.id}`} className="text-xs">Label</Label>
            <Input
              id={`label-${field.id}`}
              type="text"
              placeholder="e.g., Site Name"
              value={field.label}
              onChange={(e) => onFieldChange(field.id, { label: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`value-${field.id}`} className="text-xs">Value</Label>
            <Input
              id={`value-${field.id}`}
              type="text"
              placeholder="e.g., example.com"
              value={field.value}
              onChange={(e) => onFieldChange(field.id, { value: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-1 md:pl-3">
          <Label htmlFor={`included-${field.id}`} className="text-xs">Include</Label>
          <Switch
            id={`included-${field.id}`}
            checked={field.included}
            onCheckedChange={(checked) => onFieldChange(field.id, { included: checked })}
            aria-label="Include this field in password generation"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveField(field.id)}
          disabled={isOnlyField}
          aria-label="Remove field"
          className="p-1"
        >
          <Trash2 className="h-5 w-5 text-destructive/80 hover:text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
}
