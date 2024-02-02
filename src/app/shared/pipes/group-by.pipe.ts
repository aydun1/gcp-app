import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupBy',
  standalone: true
})
export class GroupByPipe implements PipeTransform {
  private extras = 'Other';

  transform(input: Array<any> | null, prop: Array<string>): Array<any> {
    if (!Array.isArray(input)) return [];

    const a = input.reduce((result, item) => ({
      ...result,
      [prop.find(_ => _ === item['fields']['Status']) || this.extras]: [
        ...(result[prop.find(_ => _ === item['fields']['Status']) || this.extras] || []),
        item,
      ]
    }), {});
    return [...prop, this.extras].map(_ => a[_]);
  }
}