import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SignaturePadComponent } from './signature-pad.component';

@NgModule({
  declarations: [SignaturePadComponent],
  imports: [
    MatButtonModule,
    MatCardModule
  ],
  exports: [SignaturePadComponent],
})
export class SignaturePadModule {}