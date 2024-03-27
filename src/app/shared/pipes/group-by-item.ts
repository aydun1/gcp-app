import { Pipe, PipeTransform } from '@angular/core';

import { RequiredLine } from '../../inventory/shared/required-line';

interface groupedItem {
  itemNmbr: string;
  description: string;
  qtyOnHand: number;
  qtyRemaining: number;
  qtyAvailable: number;
  qtyRequired: number;
  newQtyRequired: number;
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

    const drops = Object.keys(groupedCollection).sort().map(key => {
      const sites = groupedCollection[key] as RequiredLine[];
      const description = sites[0].ITEMDESC;
      const qtyAvailable = sites.reduce((a, b) => a + b.QTYAVAIL, 0);
      const qtyOnHand = sites.reduce((a, b) => a + b.QTYONHND, 0);
      const qtyRemaining = sites.reduce((a, b) => a + b.QTYREMAI, 0);
      const qtyRequired = sites.reduce((a, b) => a + b.QTYREQUIRED, 0);
      const main = sites.find(_ => _.LOCNCODE === 'MAIN');
      const otherSites = sites.filter(_ => _.LOCNCODE !== 'MAIN');
      const mainRequired = main?.QTYREQUIRED || 0;
      const mainAvail = Math.max(main?.QTYAVAIL || 0, 0);
      const otherSitesRequired = otherSites.reduce((a, b) => a + b.QTYREQUIRED, 0);
      const newQtyRequired = Math.max(otherSitesRequired - mainAvail, 0) + mainRequired;
      return {itemNmbr: key, description, qtyOnHand, qtyRemaining, qtyAvailable, qtyRequired, newQtyRequired, sites};
    });
    return [...drops.filter(_ => _.newQtyRequired > 0), ...drops.filter(_ => _.newQtyRequired === 0)]

  }
}
