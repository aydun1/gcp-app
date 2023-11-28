import { NgModule } from '@angular/core';

import { GroupByPropertyPipe } from './group-by-property';
import { GroupByPipe } from './group-by.pipe';
import { GroupCagesPipe } from './group-cages';
import { GroupByCustomerAddressPipe } from './group-by-customer-address';
import { PhoneLinkPipe } from './phone-link';
import { StringColourPipe } from './string-colour.pipe';

@NgModule({
    declarations: [
      GroupByCustomerAddressPipe,
      GroupByPipe,
      GroupByPropertyPipe,
      GroupCagesPipe,
      PhoneLinkPipe,
      StringColourPipe
    ],
    exports: [
      GroupByCustomerAddressPipe,
      GroupByPipe,
      GroupByPropertyPipe,
      GroupCagesPipe,
      PhoneLinkPipe,
      StringColourPipe
    ],
    providers: [
      GroupByCustomerAddressPipe
    ]
  })
  export class PipeModule {}