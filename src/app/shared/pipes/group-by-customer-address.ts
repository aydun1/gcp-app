import { Pipe, PipeTransform } from '@angular/core';

import { Delivery } from '../../runs/shared/delivery';

@Pipe({
  name: 'groupByCustomerAddress'
})
export class GroupByCustomerAddressPipe implements PipeTransform {
  transform(collection: Array<Delivery> | null): {drops: Array<any>, deliveries: number, spaces: number, weight: number} {
    if(!collection || collection.length === 0) return {drops: [], deliveries: 0, weight: 0, spaces: 0};
    const groupedCollection = collection.reduce((previous, current)=> {
      if (current['fields']['Address']) {
        if (!previous[current['fields']['Address']]) {
          previous[current['fields']['Address']] = [current];
          } else {
          previous[current['fields']['Address']].push(current);
        }
      } else {
        if (!previous[current['fields']['CustomerNumber']]) {
          previous[current['fields']['CustomerNumber']] = [current];
        } else {
          previous[current['fields']['CustomerNumber']].push(current);
        }
      }
      return previous;
    }, {});

    const drops = Object.keys(groupedCollection).map(key => {
      const groups = groupedCollection[key] as Delivery[];
      const hasNotes = groups.filter(_ => _.fields.Notes).length;
      const hasOrderNumbers = groups.filter(_ => _.fields.OrderNumber).length;
      const spaces = groups.filter(_ => _.fields.Spaces).reduce((acc, cur) => acc + +cur.fields.Spaces, 0);
      const weight = groups.filter(_ => _.fields.Weight).reduce((acc, cur) => acc + +cur.fields.Weight, 0);
      const id = groups[0]['id'];
      const fields = {
        CustomerNumber: groups[0]['fields']['CustomerNumber'],
        Customer: groups[0]['fields']['Customer'],
        City: groups[0]['fields']['City'],
        PostCode: groups[0]['fields']['PostCode'],
        ContactPerson: groups[0]['fields']['ContactPerson'],
        Address: groups[0]['fields']['Address'],
        PhoneNumber: groups[0]['fields']['PhoneNumber']?.replace(/,/g, ', '),
        Status: groups[0]['fields']['Status'],
        Site: groups[0]['fields']['Site'],
        Notes: groups[0]['fields']['Notes']
      };
      return {key, id, fields, value: groupedCollection[key], hasOrderNumbers, hasNotes, spaces, weight};
    });
    const deliveries = drops.length;
    const spaces = drops.reduce((acc, cur) => acc + cur.spaces, 0)
    const weight = drops.reduce((acc, cur) => acc + cur.weight, 0)
    return {drops, deliveries, spaces, weight};
  }
}
