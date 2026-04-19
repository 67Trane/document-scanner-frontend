export type NoteCategory =
  | 'kfz' | 'haftpflicht' | 'hausrat' | 'rechtschutz' | 'wohngebaeude'
  | 'unfall' | 'lebensversicherung' | 'rentenversicherung' | 'berufsunfaehigkeit'
  | 'krankenversicherung' | 'tierversicherung' | 'reise' | 'gruene_karte' | 'allgemein';

export const NOTE_CATEGORY_OPTIONS: { value: NoteCategory; label: string }[] = [
  { value: 'allgemein',           label: 'Allgemein' },
  { value: 'kfz',                 label: 'Kfz-Versicherung' },
  { value: 'haftpflicht',         label: 'Privat-Haftpflicht' },
  { value: 'hausrat',             label: 'Hausrat' },
  { value: 'rechtschutz',         label: 'Rechtsschutz' },
  { value: 'wohngebaeude',        label: 'Wohngebäudeversicherung' },
  { value: 'unfall',              label: 'Unfallversicherung' },
  { value: 'lebensversicherung',  label: 'Lebensversicherung' },
  { value: 'rentenversicherung',  label: 'Rentenversicherung' },
  { value: 'berufsunfaehigkeit',  label: 'Berufsunfähigkeitsversicherung' },
  { value: 'krankenversicherung', label: 'Private Krankenversicherung' },
  { value: 'tierversicherung',    label: 'Tierhalterhaftpflicht / Tierkranken' },
  { value: 'reise',               label: 'Reiseversicherung' },
  { value: 'gruene_karte',        label: 'Grüne Karte' },
];

export interface CustomerNote {
  id: number;
  title: string;
  text: string;
  category: NoteCategory;
  category_display: string;
  is_done: boolean;
  created_at: string;
}

export interface Customer {
  id: number;

  customer_number: string | null;
  salutation: 'Herr' | 'Frau' | null;

  first_name: string;
  last_name: string;

  date_of_birth: string | null;
  email: string | null;
  phone: string | null;

  street: string | null;
  zip_code: string | null;
  city: string | null;
  country: string;
  created_at: string;
  updated_at: string;
  active_status: string;
  notes: string;
}
