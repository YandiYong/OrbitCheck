export interface CheckList{
    Lists: List[];
}

export interface List{
  categoryId: number;
  categoryName: string;
   items: DisplayItem[]; 
}

export interface DisplayItem {
  id: number;
  name: string;
  status?: 'pending' | 'insufficient' | 'satisfactory' | 'excessive' | 'expired' | 'depleted';
  checked?: boolean;
  controlQuantity?: number;
  isConsumable?: boolean;
  items?: Item[];
}

// Variant (per-size/instance) representation used by some APIs and UI
export interface Variant {
  id?: number | string;
  description?: string;
  size?: string;
  unit?: string;
  // Optional friendly name and category used by some generated instances
  name?: string;
  category?: string;
  // Older payloads sometimes use `expiry` instead of `expiryDate`
  expiry?: string | Date | null;
  expiryDate?: string | Date | null;
  expiryDates?: Array<string | Date> | null;
  replacementDate?: string | Date | null;
  isReplacement?: boolean;
  needsReplacement?: boolean;
  available?: boolean;
}

// Main Item interface used throughout the app. Most fields are optional
// because incoming API shapes vary. Dates are kept as string|Date so
// components can accept either until normalized.
export interface Item {
  id?: number | string;
  name?: string;
  itemName?: string;
  category?: string;
  categoryName?: string;
  status?: 'pending' | 'insufficient' | 'satisfactory' | 'excessive' | 'expired' | 'depleted' | string;
  checked?: boolean;
  checkedDate?: string | Date | null;
  controlQuantity?: number;
  isConsumable?: boolean;
  expiryDate?: string | Date | null;
  expiryDates?: Array<string | Date> | null;
  replacementDate?: string | Date | null;
  replacedCount?: number;
  items?: Variant[];
  variants?: Variant[];
  usageHistory?: Array<any>;
  usedToday?: number | null;
  description?: string;
  size?: string;
}
