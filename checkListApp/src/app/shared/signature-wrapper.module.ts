import { NgModule } from '@angular/core';
import { DsvPageComponent, DsvSignatureFormComponent, DsvStore, DsvStoredListComponent, SignatureViewDialogComponent } from 'signature';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [],
  imports: [CommonModule, HttpClientModule,DsvPageComponent],
  exports: [DsvPageComponent]
})
export class SignatureWrapperModule {}
