import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  exports: [
    DocListComponent,
    DocUploadComponent
  ],
})
export class DocsModule {}