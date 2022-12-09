import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupByProperty'
})
export class GroupByPropertyPipe implements PipeTransform {
  transform(collection: Array<any>, property: string): Array<any> | null {



    if(!collection || collection.length === 0) return [{key: 'undefined', value: []}];



    const groupedCollection = collection.reduce((previous, current)=> {
        if(!previous[current[property]]) {
            previous[current[property]] = [current];
        } else {
            previous[current[property]].push(current);
        }
        return previous;
    }, {});
    return Object.keys(groupedCollection).map(key => ({ key, value: groupedCollection[key] })).sort((a, b) => a.key.localeCompare(b.key));
  }
}
