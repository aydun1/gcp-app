import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DocListComponent } from './doc-list/doc-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocUploadComponent } from './doc-upload/doc-upload.component';

@NgModule({
  declarations: [
    DocListComponent,
    DocUploadComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  exports: [
    DocListComponent,
    DocUploadComponent
  ],
})
export class DocsModule {}