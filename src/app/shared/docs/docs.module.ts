import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { DocListComponent } from './doc-list/doc-list.component';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';

import { DocUploadComponent } from './doc-upload/doc-upload.component';
import { DocsComponent } from './docs.component';

@NgModule({
  declarations: [
    DocsComponent,
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
    DocsComponent
  ],
})
export class DocsModule {}