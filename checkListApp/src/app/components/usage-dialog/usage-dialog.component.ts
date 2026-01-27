import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Item } from '../../models/item';

@Component({
  selector: 'app-usage-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatCheckboxModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.isMultipleRequired ? 'Select Item Variants' : 'Record Usage' }}</h2>
    <mat-dialog-content style="max-height:60vh; overflow:auto; padding:12px; box-sizing:border-box;">
      <div style="display:flex; flex-direction:column; gap:12px;">
        <!-- Standard usage dialog for single/low quantity items -->
        <div *ngIf="!data.isMultipleRequired" style="display:flex; flex-direction:column; gap:12px;">
          <div style="font-weight:700;">{{ data.item.name }}</div>
          <mat-form-field appearance="fill">
            <mat-label>Available:</mat-label>
            <input matInput type="number" min="0" [max]="(data.item.controlQuantity ?? 0) + 5" [(ngModel)]="used" />
          </mat-form-field>

          <div *ngIf="error" style="color:#b91c1c">{{ error }}</div>
        </div>

        <!-- Table view for multiple required items (same item, different expiry dates) -->
        <div *ngIf="data.isMultipleRequired" style="display:flex; flex-direction:column; gap:12px;">
          <div style="font-weight:700; font-size:0.95rem; color:#374151;">
            {{ data.item.name }} - Required: {{ data.item.controlQuantity }} item(s)
          </div>
          
          <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead style="background:#e8f4ff; border-bottom:2px solid #0ea5e9;">
              <tr>
                <th style="padding:8px; text-align:left; font-weight:600; width:40px;">Checked</th>
                <th style="padding:8px; text-align:left; font-weight:600;">Item</th>
                <th style="padding:8px; text-align:left; font-weight:600;">Unit / Size</th>
                <th style="padding:8px; text-align:left; font-weight:600;">Expiry Date</th>
                <th style="padding:8px; text-align:center; font-weight:600;">Present</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let instance of data.instances; let i = index" 
                  style="border-bottom:1px solid #e5e7eb;" 
                  [style.background]="selectedIndices.has(i) ? '#f0f9ff' : 'white'">
                <td style="padding:8px; text-align:center; cursor:pointer;" (click)="toggleItemSelection(i)">
                  <input type="checkbox" [checked]="selectedIndices.has(i)" (click)="$event.stopPropagation(); toggleItemSelection(i)" />
                </td>
                <td style="padding:8px;">{{ instance.name }}</td>
                <td style="padding:8px;">{{ instance.category }}</td>
                <td style="padding:8px;">
                  <input type="text" 
                         [ngModel]="editableDates[i]" 
                         (ngModelChange)="editableDates[i] = $event"
                         (click)="$event.stopPropagation()"
                         placeholder="dd/MM/yyyy"
                         style="width:100px; padding:4px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;" />
                </td>
                <td style="padding:8px; text-align:center;">
                  <input type="checkbox" 
                         [checked]="itemAvailability.get(i) !== false" 
                         (change)="toggleItemAvailability(i)"
                         (click)="$event.stopPropagation()"
                         style="cursor:pointer;" />
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="errorMultiple" style="color:#b91c1c; padding:8px; background:#fee2e2; border-radius:4px;">
            {{ errorMultiple }}
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">{{ data.isMultipleRequired ? 'Confirm Selection' : 'Save' }}</button>
    </mat-dialog-actions>
  `
})
export class UsageDialogComponent {
  used: number = 0;
  error: string | null = null;
  errorMultiple: string | null = null;
  selectedIndices: Set<number> = new Set();
  itemAvailability: Map<number, boolean> = new Map(); // true = available, false = not available
  editableDates: Record<number, string> = {}; // Editable expiry dates

  constructor(
    private dialogRef: MatDialogRef<UsageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: Item; instances?: Item[]; isMultipleRequired?: boolean }
  ) {
    this.used = 0;
    // Initialize all items as available by default and copy their expiry dates
    if (this.data.instances) {
      this.data.instances.forEach((instance, idx) => {
        this.itemAvailability.set(idx, true);
        this.editableDates[idx] = instance.expiryDate || '';
      });
    }
  }

  toggleItemSelection(index: number) {
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
    } else {
      this.selectedIndices.add(index);
    }
  }

  toggleItemAvailability(index: number) {
    const currentAvailability = this.itemAvailability.get(index) !== false;
    this.itemAvailability.set(index, !currentAvailability);
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'OK': '#16a34a',
      'Missing': '#ef4444',
      'Expired': '#991b1b',
      'satisfactory': '#16a34a',
      'depleted': '#ef4444',
      'insufficient': '#f97316',
      'excessive': '#0ea5e9',
      'expired': '#991b1b'
    };
    return colorMap[status] || '#6b7280';
  }

  save() {
    if (this.data.isMultipleRequired) {
      // For multiple required items, validate selection
      const required = this.data.item.controlQuantity ?? 0;
      if (this.selectedIndices.size === 0) {
        this.errorMultiple = `Please select at least 1 item.`;
        return;
      }
      if (this.selectedIndices.size < required) {
        this.errorMultiple = `Please select ${required} item(s). Currently selected: ${this.selectedIndices.size}`;
        return;
      }
      
      // Count how many selected items are available vs not available
      const availableCount = Array.from(this.selectedIndices).filter(idx => 
        this.itemAvailability.get(idx) !== false
      ).length;
      
      const notAvailableCount = this.selectedIndices.size - availableCount;
      
      // Return the counts, total selected, and updated dates
      this.dialogRef.close({ 
        used: this.selectedIndices.size,
        availableCount: availableCount,
        notAvailableCount: notAvailableCount,
        updatedDates: this.editableDates
      });
    } else {
      // Standard usage dialog validation
      const q = this.data.item.controlQuantity ?? 0;
      if (this.used == null || isNaN(this.used) || this.used < 0) {
        this.error = 'Enter a valid number.';
        return;
      }
      if (this.used > q + 5) {
        this.error = `Cannot use more than available (${q}).`;
        return;
      }
      this.dialogRef.close({ used: this.used });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
