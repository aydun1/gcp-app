import { Pipe, PipeTransform } from '@angular/core';

import { Delivery } from '../../runs/shared/delivery';

@Pipe({
  name: 'groupByCustomerAddress'
})
export class GroupByCustomerAddressPipe implements PipeTransform {
  transform(collection: Array<Delivery> | null): Array<any> {
    if(!collection || collection.length === 0) return [];
    const groupedCollection = collection.reduce((previous, current)=> {
      if(!previous[current['fields']['Address']]) {
        previous[current['fields']['Address']] = [current];
      } else {
        previous[current['fields']['Address']].push(current);
      }
      return previous;
    }, {});

    const res = Object.keys(groupedCollection).map(key => {
      const groups = groupedCollection[key] as Delivery[];
      console.log(groups.filter(_ => _.fields.OrderNumber).length)
      const id = groups[0]['id'];
      const fields = {
        CustomerNumber: groups[0]['fields']['CustomerNumber'],
        Customer: groups[0]['fields']['Customer'],
        City: groups[0]['fields']['City'],
        PostCode: groups[0]['fields']['PostCode'],
        Address: groups[0]['fields']['Address'],
        Status: groups[0]['fields']['Status'],
        Site: groups[0]['fields']['Site']
      };
      return {key, id, fields, value: groupedCollection[key], orders: groups.filter(_ => _.fields.OrderNumber).length};
    });
    return res;
  }
}
