import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingRowComponent } from './loading-row.component';

@NgModule({
  declarations: [LoadingRowComponent],
  imports: [MatProgressSpinnerModule],
  exports: [LoadingRowComponent],
})
export class LoadingRowModule {}