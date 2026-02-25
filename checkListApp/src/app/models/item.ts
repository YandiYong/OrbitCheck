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
  sessionType: 'Pre-Shift' | 'Post-Shift' | 'Post-Resus';
}

export interface CompletedChecklistItem {
  id: number;
  name: string;
  category: string | null;
  status: 'pending' | 'insufficient' | 'satisfactory' | 'excessive' | 'expired' | 'depleted';
  checked: boolean;
  checkedDate: string | null;
  controlQuantity: number | null;
  usedToday: number | null;
  expiryDate: string | null;
  replacementDate: string | null;
}

export interface CompletedChecklistRecord {
  id: string;
  checklistDate: string;
  savedAt: string;
  session: {
    type: Session['sessionType'];
    startTime: string | null;
    endTime: string | null;
    durationSeconds: number | null;
  };
  summary: {
    totalItems: number;
    checkedItems: number;
    depletedItems: number;
    expiredItems: number;
  };
  items: CompletedChecklistItem[];
}
