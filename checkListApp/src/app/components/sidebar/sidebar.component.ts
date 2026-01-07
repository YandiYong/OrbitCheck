import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatDividerModule, FormsModule],
  template: `
    <div class="header">
      <mat-icon>dashboard</mat-icon>
      <span>Categories</span>
    </div>

    <mat-form-field class="search" appearance="outline">
      <mat-label>Filter categories</mat-label>
      <input matInput [(ngModel)]="filterTerm" placeholder="Type to filter" />
    </mat-form-field>

    <mat-divider></mat-divider>

    <mat-nav-list role="listbox">
      <mat-list-item
        *ngFor="let cat of filteredCategories()"
        (click)="onSelect(cat.name)"
        [ngClass]="{ 'list-item': true, active: selectedCategory === cat.name }"
      >
        <div class="item-title">{{cat.name}}</div>
        <mat-chip class="count-chip" color="accent" style="height:24px; text-align:center;">{{cat.count}}</mat-chip>
      </mat-list-item>
    </mat-nav-list>
  `,
  styles: [
    `
    :host { display: block; }
    .header { display:flex; align-items:center; gap:8px; margin:0 0 12px 0; color:#0f172a; font-weight:700; }
    .search { width:100%; margin-bottom:12px; }
    .list-item { border-radius:8px; padding:10px 12px; margin-bottom:16px; }
    .list-item:last-child { margin-bottom: 0; }
    .list-item:hover { background:#f8fafc; }
    .list-item.active { background:#e3f2fd; border-left:4px solid #1976d2; }
    .item-title { font-weight:600; }
    .count-chip { margin-left:auto; }
    `
  ]
})
export class SidebarComponent {
  @Input() categories: Array<{ name: string; icon: string; count: number }> = [];
  @Input() selectedCategory = 'All Items';
  @Output() selectCategory = new EventEmitter<string>();

  filterTerm = '';

  onSelect(name: string) {
    this.selectCategory.emit(name);
  }

  filteredCategories() {
    const term = this.filterTerm.trim().toLowerCase();
    if (!term) return this.categories;
    return this.categories.filter(c => c.name.toLowerCase().includes(term));
  }
}
