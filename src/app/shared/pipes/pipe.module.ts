import { NgModule } from '@angular/core';

import { GroupByPropertyPipe } from './group-by-property';
import { GroupByPipe } from './group-by.pipe';
import { GroupCagesPipe } from './group-cages';
import { StringColourPipe } from './string-colour.pipe';

@NgModule({
    declarations: [
      GroupByPipe,
      GroupByPropertyPipe,
      GroupCagesPipe,
      StringColourPipe
    ],
    exports: [
      GroupByPipe,
      GroupByPropertyPipe,
      GroupCagesPipe,
      StringColourPipe
    ],
  })
  export class PipeModule {}