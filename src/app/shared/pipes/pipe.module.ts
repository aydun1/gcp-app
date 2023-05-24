import { NgModule } from '@angular/core';

import { GroupByPropertyPipe } from './group-by-property';
import { GroupByPipe } from './group-by.pipe';
import { GroupCagesPipe } from './group-cages';
import { StringColourPipe } from './string-colour.pipe';
import { GroupByCustomerAddressPipe } from './group-by-customer-address';

@NgModule({
    declarations: [
      GroupByCustomerAddressPipe,
      GroupByPipe,
      GroupByPropertyPipe,
      GroupCagesPipe,
      StringColourPipe
    ],
    exports: [
      GroupByCustomerAddressPipe,
      GroupByPipe,
      GroupByPropertyPipe,
      GroupCagesPipe,
      StringColourPipe
    ],
    providers: [
      GroupByCustomerAddressPipe
    ]
  })
  export class PipeModule {}