import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DsvStore } from './dsv.store';

@Component({
  selector: 'dsv-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <div class="brand">
        <mat-icon>security</mat-icon>
        <span class="title">Digital Signature Vault</span>
      </div>
      <span class="spacer"></span>
    </mat-toolbar>
  `,
  styles: [
    `
      .brand { display: flex; align-items: center; gap: 8px; }
      .title { font-weight: 600; }
      .spacer { flex: 1 1 auto; }
      .nav { display: flex; gap: 8px; }
      .user { margin-right: 4px; }
    `,
  ],
})
export class DsvHeaderComponent {
  constructor(public store: DsvStore) {}
}
