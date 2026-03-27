export interface CheckList{
    Lists: List[];
    session: Session;
}

export interface List{
  categoryId: number;
  categoryName: string;
   items: DisplayItem[]; 
}

export interface DisplayItem {
  id: number;
  name: string;
  status: 'pending' | 'insufficient' | 'satisfactory' | 'excessive' | 'expired' | 'depleted';
  checked?: boolean;
  controlQuantity?: number;
  isConsumable: boolean;
  items: Item[];
  
}
export interface Item{

    id: number ;
    expiryDate:Date;
    description: string;
    replacementDate?: Date;
    checkedDate?: Date;
}

export interface Session {
  id?: number;
  startedAt: Date;
  endedAt?: Date;
  sessionType: 'Pre-Shift' | 'Post-Shift' | 'Post-Resus'| 'Audit';
}

export interface CompletedChecklistItem {
  id: number;
  name: string;
  category: string | null;
  status: DisplayItem['status'];
  checked: boolean;
  checkedDate: string | null;
  controlQuantity: number | null;
  available: number | null;
  expiryDate: string | null;
  replacementDate: string | null;
  displayItemId?: number | null;
  displaySubItemId?: number | null;
  subItems?: CompletedChecklistSubItem[];
}

export interface CompletedChecklistSubItem {
  id: number;
  expiryDate: string | null;
  description: string | null;
  replacementDate: string | null;
  checkedDate: string | null;
}

export interface CompletedChecklistSignature {
  user: string;
  signedFor: string;
  purpose: string;
  date: string;
  image: string;
}

export interface CompletedChecklistRecord {
  id?: string;
  checklistDate: string;
  savedAt: string;
  session: {
    type: Session['sessionType'];
    startTime: string | null;
    endTime: string | null;
    durationSeconds?: number | null;
  };
  summary: {
    totalItems: number;
    checkedItems: number;
    depletedItems: number;
    expiredItems: number;
  };
  signature: CompletedChecklistSignature;
  items?: CompletedChecklistItem[];
}
