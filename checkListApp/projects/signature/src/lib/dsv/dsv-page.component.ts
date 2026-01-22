import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsvHeaderComponent } from './dsv-header.component';
import { DsvSignatureFormComponent } from './dsv-signature-form.component';
import { DsvStoredListComponent } from './dsv-stored-list.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'dsv-page',
  standalone: true,
  imports: [CommonModule, DsvHeaderComponent, DsvSignatureFormComponent, DsvStoredListComponent,HttpClientModule,FormsModule],
  template: `
    <dsv-header />

    <div class="container">
      <div class="page-title">
        <h1>Secure Your Digital Signatures</h1>
        <p>Store and manage your digital signatures safely.</p>
      </div>

      <div class="grid">
        <dsv-signature-form />
        <dsv-stored-list />
      </div>
    </div>
  `,
  styles: [
    `
      .container { max-width: 1120px; margin: 0 auto; padding: 24px; }
      .page-title h1 { font-size: 28px; margin-bottom: 8px; }
      .page-title p { color: #666; }
      .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
      @media (min-width: 1024px) { .grid { grid-template-columns: 1fr 1fr; } }
    `,
  ],
})
export class DsvPageComponent {

  constructor( private dialogRef: MatDialogRef<DsvPageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

}
