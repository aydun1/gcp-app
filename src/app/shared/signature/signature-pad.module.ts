import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
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