import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupBy',
})
export class GroupByPipe implements PipeTransform {
  transform(input: any, prop: string): Array<any> {

    if (!Array.isArray(input)) return input;
    const a = input.reduce((result, item) => ({
        ...result,
        [item['fields']['Status'] === prop ? prop : 'Other']: [
          ...(result[item['fields']['Status'] === prop ? prop : 'Other'] || []),
          item,
        ],
      }), 
      {},
    );
    return [a['Other'], a[prop]];
  }
}