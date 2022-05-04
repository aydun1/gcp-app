import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupBy',
})
export class GroupByPipe implements PipeTransform {
  transform(input: any, prop: Array<string>): Array<any> {
    console.log(prop);
    if (!Array.isArray(input)) return input;

    const a = input.reduce((result, item) => ({
      ...result,
      [prop.find(_ => _ === item['fields']['Status']) || 'Other']: [
        ...(result[prop.find(_ => _ === item['fields']['Status']) || 'Other'] || []),
        item,
      ]
    }),
    {},
  );
    return [a[prop[0]], a[prop[1]], a['Other']];
  }
}