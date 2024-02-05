import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sum',
  standalone: true
})
export class SumPipe implements PipeTransform {
    transform(collection: Array<any> | null, property: string, update = 0): number {
      if(!collection || collection.length === 0) return 0;
      if (property === 'kg' || property === 'L') {
        return collection.filter(_ => _.uofm === property).reduce((previous, current) => previous += current.quantity, 0)
      } else if (property === 'onHand') {
        return collection.reduce((previous, current) => previous += current.onHand, 0);
      } else if (property === 'palletSpaces') {
        return collection.reduce((previous, current) => previous += current.palletSpaces, 0);
      } else if (property === 'linesTotal') {
        return collection.reduce((previous, current) => previous += current.linesTotal, 0);
      } else if (property === 'pickedPercent') {
        return collection.reduce((previous, current) => previous += current.fulfilledSpaces, 0) / collection.reduce((previous, current) => previous += current.palletSpaces, 0) * 100;
      } else if (property === 'Spaces') {
        return collection.reduce((previous, current) => previous += current.value.Spaces, 0);
      } else if (property === 'ToTransfer') {
        return collection.reduce((previous, current) => previous += current.value.ToTransfer, 0);
      } else {
        return collection.length;
      }
    }
  }
  