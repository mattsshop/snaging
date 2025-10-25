export type PunchlistItemCategory = string;

export interface PunchlistItem {
  id: string;
  room: string;
  description: string;
  category: PunchlistItemCategory;
  photo: string; // This will now be a URL from cloud storage
  createdAt: string; // ISO string
}

export interface Job {
  id: string;
  name: string;
  createdAt: string;
  items: PunchlistItem[];
  userId: string; // Associate job with a user
}
