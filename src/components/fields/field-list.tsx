"use client";

import type { Dispatch, SetStateAction } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { FieldDefinition } from '@/lib/types';
import FieldItem from './field-item';

interface FieldListProps {
  fields: FieldDefinition[];
  onFieldChange: (id: string, newField: Partial<FieldDefinition>) => void;
  onRemoveField: (id: string) => void;
  setFields: Dispatch<SetStateAction<FieldDefinition[]>>;
}

export default function FieldList({ fields, onFieldChange, onRemoveField, setFields }: FieldListProps) {
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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {fields.map((field, index) => (
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
