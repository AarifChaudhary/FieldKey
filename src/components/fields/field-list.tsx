
"use client";

import React, { type Dispatch, type SetStateAction, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { FieldDefinition } from '@/lib/types';
import FieldItem from './field-item';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FieldListProps {
  fields: FieldDefinition[];
  onFieldChange: (id: string, newField: Partial<FieldDefinition>) => void;
  onRemoveField: (id: string) => void;
  setFields: Dispatch<SetStateAction<FieldDefinition[]>>;
}

export default function FieldList({ fields, onFieldChange, onRemoveField, setFields }: FieldListProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  if (!isMounted) {
    // Render skeletons matching the FieldItem structure during SSR and initial client render
    return (
      <div className="space-y-4">
        {(fields.length > 0 ? fields : Array.from({ length: 2 })).map((field, index) => (
          <Card key={field?.id || `skeleton-${index}`} className="bg-card/50 border rounded-lg">
            <CardContent className="p-4 flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded" /> {/* Grip placeholder */}
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label for Label */}
                  <Skeleton className="h-9 w-full rounded-md" /> {/* Input for Label */}
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label for Value */}
                  <Skeleton className="h-9 w-full rounded-md" /> {/* Input for Value */}
                </div>
              </div>
              <div className="flex flex-col items-center space-y-1 md:pl-3">
                <Skeleton className="h-4 w-10 mb-1" /> {/* Label for Include */}
                <Skeleton className="h-6 w-11 rounded-full" /> {/* Switch */}
              </div>
              <Skeleton className="h-10 w-10 rounded" /> {/* Trash button placeholder */}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {fields.map((field) => (
            <FieldItem
              key={field.id}
              field={field}
              onFieldChange={onFieldChange}
              onRemoveField={onRemoveField}
              isOnlyField={fields.length === 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
