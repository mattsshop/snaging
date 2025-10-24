
export type PunchlistItemCategory = 'General' | 'Electrical' | 'Plumbing' | 'HVAC' | 'Carpentry' | 'Painting' | 'Finishing';

export interface PunchlistItem {
  id: string;
  room: string;
  description: string;
  category: PunchlistItemCategory;
  photo: string; // Base64 encoded image
  createdAt: string; // ISO string
}
