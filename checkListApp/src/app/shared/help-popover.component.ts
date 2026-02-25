import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-help-popover',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <mat-icon class="help-icon" (click)="togglePopover()">help_outline</mat-icon>
    <div *ngIf="showPopover" class="help-popover">
      <mat-icon class="help-popover-close" (click)="togglePopover()">close</mat-icon>
      <div class="help-popover-content">
        {{ helpText }}
      </div>
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-block; }
    .help-icon { 
      cursor: pointer; 
      color: #0284c7; 
      font-size: 1.5rem; 
      width: 1.5rem; 
      height: 1.5rem; 
      transition: color 0.2s ease; 
    }
    .help-icon:hover { color: #0c4a6e; }
    .help-popover { 
      position: absolute; 
      top: 40px; 
      left: 0; 
      background: white; 
      border: 1px solid #cbd5e1; 
      border-radius: 8px; 
      padding: 16px 40px 16px 20px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
      z-index: 1000; 
      max-width: 320px; 
      min-width: 280px;
      animation: fadeIn 0.2s ease; 
      white-space: normal;
    }
    .help-popover-close { 
      position: absolute; 
      top: 12px; 
      right: 12px; 
      cursor: pointer; 
      color: #64748b; 
      font-size: 1.3rem; 
      width: 1.3rem; 
      height: 1.3rem; 
      transition: color 0.2s ease; 
    }
    .help-popover-close:hover { color: #1e293b; }
    .help-popover-content { 
      color: #374151; 
      font-size: 0.9rem; 
      line-height: 1.6; 
    }
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(-8px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
  `]
})
export class HelpPopoverComponent {
  @Input() helpText: string = '';
  showPopover: boolean = false;

  togglePopover() {
    this.showPopover = !this.showPopover;
  }
}
