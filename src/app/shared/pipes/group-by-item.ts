import { Pipe, PipeTransform } from '@angular/core';

import { RequiredLine } from '../../inventory/shared/required-line';

interface groupedItem {
  itemNumber: string;
  qtyOnHand: number;
  qtyRemaining: number;
  qtyAvailable: number;
  qtyRequired: number;
  sites: RequiredLine[];
}

@Pipe({
  name: 'groupByItem',
  standalone: true
})
export class GroupByItemPipe implements PipeTransform {
  transform(collection: Array<RequiredLine> | null): groupedItem[] | null {
    if(!collection || collection.length === 0) return null;
    const groupedCollection = collection.reduce((previous, current)=> {
      if (!previous[current.ITEMNMBR]) {
        previous[current.ITEMNMBR] = [current];
      } else {
        previous[current.ITEMNMBR].push(current);
      }
      return previous;
    }, {});

    const drops = Object.keys(groupedCollection).map(key => {
      const sites = groupedCollection[key] as RequiredLine[];
      const qtyAvailable = sites.reduce((a, b) => a + b.QTYAVAIL, 0);
      const qtyOnHand = sites.reduce((a, b) => a + b.QTYONHND, 0);
      const qtyRemaining = sites.reduce((a, b) => a + b.QTYREMAI, 0);
      const qtyRequired = sites.reduce((a, b) => a + b.QTYREQUIRED, 0);
      return {itemNumber: key, qtyOnHand, qtyRemaining, qtyAvailable, qtyRequired, sites};
    });
    return drops;
  }
}
