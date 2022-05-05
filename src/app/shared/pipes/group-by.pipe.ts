import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupBy',
})
export class GroupByPipe implements PipeTransform {
  private extras = 'Other';

  transform(input: any, prop: Array<string>): Array<any> {
    if (!Array.isArray(input)) return input;

    const a = input.reduce((result, item) => ({
      ...result,
      [prop.find(_ => _ === item['fields']['Status']) || this.extras]: [
        ...(result[prop.find(_ => _ === item['fields']['Status']) || this.extras] || []),
        item,
      ]
    }), {});

    // const groupedKeyed = [...prop, this.extras].map(_ => {return {key: _, value: a[_]}});
    const groupedNoKey = [...prop, this.extras].map(_ => a[_]);
    return groupedNoKey;
  }
}