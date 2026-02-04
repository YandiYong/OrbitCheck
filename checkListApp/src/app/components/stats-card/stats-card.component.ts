import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="stat-card" [style.border-left]="'6px solid ' + borderColor" [style.cursor]="clickable ? 'pointer' : 'default'" (click)="handleClick()">
      <mat-card-content style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:2.2rem; font-weight:800;">{{count}}</div>
          <div style="font-weight:600; color:var(--color-subtle);">{{title}}</div>
          <div *ngIf="subtitle" style="font-size:.85rem; color:{{subtitleColor}}; margin-top:var(--space-sm);">{{subtitle}}</div>
          <ng-content></ng-content>
        </div>
        
      </mat-card-content>
    </mat-card>
  `
})
export class StatsCardComponent {
  @Input() count = 0;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() borderColor = 'var(--color-text)';
  @Input() subtitleColor = 'var(--color-subtle)';
  @Input() clickable = true;
  @Output() clicked = new EventEmitter<void>();

  handleClick() {
    if (this.clickable) this.clicked.emit();
  }
}
