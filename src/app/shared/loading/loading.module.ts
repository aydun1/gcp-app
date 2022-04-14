import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoadingPageComponent } from './loading-page/loading-page.component';
import { LoadingRowComponent } from './loading-row/loading-row.component';

@NgModule({
  declarations: [
    LoadingPageComponent,
    LoadingRowComponent
],
  imports: [MatProgressSpinnerModule],
  exports: [
    LoadingPageComponent,
    LoadingRowComponent
  ],
})
export class LoadingModule {}