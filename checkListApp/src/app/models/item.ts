export interface Item {
  id: number;
  name: string;
  category: string;
  expiryDate: string | null;
  expiryDates?: string[];
  replacementDate?: string | null;
  checkedDate?: string | null;
  status: 'onTrolley' | 'offTrolley' | 'insufficient' | 'satisfactory' | 'excessive' | 'expired' | 'depleted';
  checked?: boolean;
  quantity?: number;
  usageHistory?: Array<{ date: string; used: number }>;
  usedToday?: number | null;
  isConsumable: boolean;
}
