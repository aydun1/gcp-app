import { Pipe, PipeTransform } from '@angular/core';

import { Delivery } from '../../runs/shared/delivery';

interface groupedDelivery {
  drops: Array<{
    key: string;
    id: string;
    fields: {
      ContactPerson: string;
      Run: string;
      Address: string;
      City: string;
      Postcode: string;
      PhoneNumber: string;
      CustomerName: string;
      CustomerNumber: string;
      Site: string;
      Status: string;
    };
    value: Delivery[];
    hasNotes: number;
    hasOrderNumbers: number;
    spaces: number;
    weight: number;
    requestedDate: Date | null;
  }>;
  deliveries: {[key:string]: number};
  spaces: {[key:string]: number};
  weights: {[key:string]: number};
}

@Pipe({
  name: 'groupByCustomerAddress',
  standalone: true
})
export class GroupByCustomerAddressPipe implements PipeTransform {
  transform(collection: Array<Delivery> | null): groupedDelivery {
    if(!collection || collection.length === 0) return {drops: [], deliveries: {}, spaces: {}, weights: {}};
    const groupedCollection = collection.reduce((previous, current)=> {
      if (current['fields']['Address']) {
        const nameAddress = current['fields']['CustomerNumber'].trimEnd() + current['fields']['Address'];
        if (!previous[nameAddress]) {
          previous[nameAddress] = [current];
          } else {
          previous[nameAddress].push(current);
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
      //groups.sort((a,b) => +a.id - +b.id)
      const hasNotes = groups.filter(_ => _.fields.Notes).length;
      const hasOrderNumbers = groups.filter(_ => _.fields.OrderNumber).length;
      const spaces = groups.filter(_ => _.fields.Spaces).reduce((acc, cur) => acc + +cur.fields.Spaces, 0);
      const weight = groups.filter(_ => _.fields.Weight).reduce((acc, cur) => acc + +cur.fields.Weight, 0);
      const requestedDate = groups.filter(_ => _.fields.RequestedDate).reduce((acc, cur) => acc = !acc ? cur.fields.RequestedDate : cur.fields.RequestedDate < acc ? cur.fields.RequestedDate : acc, null as null | Date);
      const id = groups[0]['id'];
      const fields = {
        CustomerNumber: groups[0]['fields']['CustomerNumber'],
        CustomerName: groups[0]['fields']['CustomerName'],
        City: groups[0]['fields']['City'],
        Postcode: groups[0]['fields']['Postcode'],
        ContactPerson: groups[0]['fields']['ContactPerson'],
        Address: groups[0]['fields']['Address'],
        PhoneNumber: groups[0]['fields']['PhoneNumber']?.replace(/,/g, ', '),
        Status: groups[0]['fields']['Status'],
        Site: groups[0]['fields']['Site'],
        Notes: groups[0]['fields']['Notes'],
        Run: groups[0]['fields']['Run'],
        RequestedDate: groups[0]['fields']['RequestedDate']
      };
      return {key, id, fields, value: groupedCollection[key], hasOrderNumbers, hasNotes, spaces, weight, requestedDate};
    });
    const deliveries = drops.reduce((acc, cur) => {
      const run = cur.fields.Run || '';
      acc[run] = (acc[run] || 0) + 1;
      return acc;
    }, {}); 
    const spaces = drops.reduce((acc, cur) => {
      const run = cur.fields.Run || '';
      acc[run] = (acc[run] || 0) + cur.spaces;
      return acc;
    }, {});
    const weights = drops.reduce((acc, cur) => {
      const run = cur.fields.Run || '';
      acc[run] = (acc[run] || 0) + cur.weight;
      return acc;
    }, {});
    return {drops, deliveries, spaces, weights};
  }
}
