import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { DocListComponent } from './doc-list/doc-list.component';
import { DocUploadComponent } from './doc-upload/doc-upload.component';

@NgModule({
  declarations: [
    DocListComponent,
    DocUploadComponent
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  exports: [
    DocListComponent,
    DocUploadComponent
  ],
})
export class DocsModule {}