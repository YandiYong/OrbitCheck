export interface Item {
  id: number;
  name: string;
  category: string;
  expiryDate: string | null;
  replacementDate?: string | null;
  // timestamp of when the item was checked (ISO string). Kept for history.
  checkedDate?: string | null;
  status: 'available' | 'unavailable';
  checked?: boolean;
}
