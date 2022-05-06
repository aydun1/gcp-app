import { NgModule } from '@angular/core';
import { GroupByPipe } from './group-by.pipe';
import { StringColourPipe } from './string-colour.pipe';

@NgModule({
    declarations: [
      GroupByPipe,
      StringColourPipe
    ],
    exports: [
      GroupByPipe,
      StringColourPipe
    ],
  })
  export class PipeModule {}