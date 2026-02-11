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
