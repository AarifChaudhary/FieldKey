export type FieldDefinition = {
  id: string;
  label: string;
  value: string;
  included: boolean;
};

export type PresetFieldDefinition = Omit<FieldDefinition, 'value'>;

export type Preset = {
  id: string;
  name: string;
  fields: PresetFieldDefinition[]; // Store only label, id, included status, and order
};
