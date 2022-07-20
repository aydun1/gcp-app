import { Pipe, PipeTransform } from '@angular/core';
import { Cage } from '../../recycling/shared/cage';

@Pipe({
  name: 'groupCages',
})
export class GroupCagesPipe implements PipeTransform {
  private extras = 'Other';

  transform(input: Array<Cage> | null, prop: Array<number>): Array<any> {
    if (!Array.isArray(input)) return [];

    const a = input.reduce((result, item) => ({
      ...result,
      [prop.find(_ => _ === item['statusId']) || this.extras]: [
        ...(result[prop.find(_ => _ === item['statusId']) || this.extras] || []),
        item,
      ]
    }), {});

    return [...prop, this.extras].map(_ => a[_]);
  }
}