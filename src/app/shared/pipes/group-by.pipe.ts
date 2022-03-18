import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupBy',
})
export class GroupByPipe implements PipeTransform {
  transform(input: any, prop: Array<string>): Array<any> {

    if (!Array.isArray(input)) return input;
    const a = input.reduce((result, item) => ({
        ...result,
        [item['fields']['Status'] === prop[0] ? prop[0] : item['fields']['Status'] === prop[1] ? prop[1] : 'Other']: [
          ...(result[item['fields']['Status'] === prop[0] ? prop[0] : item['fields']['Status'] === prop[1] ? prop[1] : 'Other'] || []),
          item,
        ],
      }),
      {},
    );
    return [a[prop[0]], a[prop[1]], a['Other']];
  }
}