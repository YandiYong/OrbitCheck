import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalSnackbarService } from './global-snackbar.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-global-snackbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="svc.visible() && svc.message()" class="global-snack" role="status" aria-live="polite">
      <div class="icon"><mat-icon>warning</mat-icon></div>
      <div class="msg">{{ svc.message() }}</div>
      <button class="ok" (click)="svc.hide()">OK</button>
    </div>
  `,
  styles: [`
    .global-snack { position:fixed; left:50%; transform:translateX(-50%); top:20px; z-index:9999; min-width:320px; max-width:86%; display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:10px; box-shadow:0 12px 36px rgba(2,6,23,0.12); background:var(--color-surface); color:var(--color-text); font-weight:700; }
    .global-snack .icon { width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(124,58,237,0.06); color:var(--color-primary-600); }
    .global-snack .msg { flex:1; }
    .global-snack .ok { background:transparent; border:none; color:var(--color-primary-600); font-weight:800; cursor:pointer; }
  `]
})
export class GlobalSnackbarComponent {
  constructor(public svc: GlobalSnackbarService) {}
}
