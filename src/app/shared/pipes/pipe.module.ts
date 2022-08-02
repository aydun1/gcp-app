import { NgModule } from '@angular/core';
import { GroupByPipe } from './group-by.pipe';
import { GroupCagesPipe } from './group-cages';
import { StringColourPipe } from './string-colour.pipe';

@NgModule({
    declarations: [
      GroupByPipe,
      GroupCagesPipe,
      StringColourPipe
    ],
    exports: [
      GroupByPipe,
      GroupCagesPipe,
      StringColourPipe
    ],
  })
  export class PipeModule {}