import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sum',
  standalone: true
})
export class SumPipe implements PipeTransform {
    transform(collection: Array<any> | null, property: string): number {
      if(!collection || collection.length === 0) return 0;
      return property ?
      collection.filter(_ => _.uofm === property).reduce((previous, current) => previous += current.quantity, 0) :
      collection.reduce((previous, current) => previous += current.onHand, 0);
    }
  }
  