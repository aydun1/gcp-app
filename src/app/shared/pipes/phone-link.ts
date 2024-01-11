import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneLink',
  standalone: true
})
export class PhoneLinkPipe implements PipeTransform {
  private regex = /(\+?[0-9 ]+)/igm;

  transform(value: string): string {
    if (!value) return '';
    return value.replace(' ', '').replace(this.regex, _ => {
      return `<a href="tel:${_.replace(/\s/g, '')}">${_}</a>`
    }).trim();
  }
}
