export interface Item {
  id: number;
  name: string;
  category: string;
  expiryDate: string | null;
  replacementDate?: string | null;
  status: 'available' | 'unavailable';
  checked?: boolean;
}
