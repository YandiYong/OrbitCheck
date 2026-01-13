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
  // total quantity currently available for use
  quantity?: number;
  // history of usages: { date: ISO string, used: number }
  usageHistory?: Array<{ date: string; used: number }>;
  // last used amount for the current day (optional)
  usedToday?: number | null;
}
