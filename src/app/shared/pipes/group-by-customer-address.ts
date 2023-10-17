import { Pipe, PipeTransform } from '@angular/core';

import { Delivery } from '../../runs/shared/delivery';

interface groupedDelivery {
  drops: Array<{
    id: string;
    fields: any;
    value: Delivery[];
    hasNotes: number;
    hasOrderNumbers: number;
    spaces: number;
    weight: number
  }>;
  deliveries: {[key:string]: number};
  spaces: {[key:string]: number};
  weights: {[key:string]: number};
}

@Pipe({
  name: 'groupByCustomerAddress'
})
export class GroupByCustomerAddressPipe implements PipeTransform {
  transform(collection: Array<Delivery> | null): groupedDelivery {
    if(!collection || collection.length === 0) return {drops: [], deliveries: {}, spaces: {}, weights: {}};
    const groupedCollection = collection.reduce((previous, current)=> {
      if (current['fields']['Address']) {
        const nameAddress = current['fields']['CustomerNumber'] + current['fields']['Address'];
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
        Notes: groups[0]['fields']['Notes'],
        Title: groups[0]['fields']['Title']
      };
      return {key, id, fields, value: groupedCollection[key], hasOrderNumbers, hasNotes, spaces, weight};
    });
    const deliveries = drops.reduce((acc, cur) => {
      const title = cur.fields.Title || '';
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {}); 
    const spaces = drops.reduce((acc, cur) => {
      const title = cur.fields.Title || '';
      acc[title] = (acc[title] || 0) + cur.spaces;
      return acc;
    }, {});
    const weights = drops.reduce((acc, cur) => {
      const title = cur.fields.Title || '';
      acc[title] = (acc[title] || 0) + cur.weight;
      return acc;
    }, {});
    return {drops, deliveries, spaces, weights};
  }
}
