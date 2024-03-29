import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stringColour',
  standalone: true
})
export class StringColourPipe implements PipeTransform {

  private mixedWeight = 0.75;
  private textWeight = 0.25;
  private seed = 16777219;
  private factor = 49979693;

  private colors = {
    'Scheduled': '#2851e7',
    'Pan list sent': '#41a900'
  };

  getColor(text: string): string | null {
    const key = Object.entries(this.colors).find(_ => _[0] === text);
    return key ? key[1] : null;
  }

  mixColor(color: Array<number>) {
    let mixed = [0, 0, 0];
    console.log(color)
    color.forEach(c => mixed = mixed.map((v, i) => v += c));
    return [mixed[0] / color.length, mixed[1] / color.length, mixed[2] / color.length];
  }

  hexToRGB(hex: string): Array<number> {
    const longHex = parseInt(hex, 16);
    const r = longHex >> 16;
    const g = longHex >> 8 & 0xFF;
    const b = longHex & 0xFF;
    return [r,g,b];
  }

  RGBToHex(r: number, g: number, b: number ): string {
    const hexCol = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return hexCol;
  }

  transform(input: string): string {
    if (!input) return '#000000';
    const color = this.getColor(input);
    if (color) return color;
    let b = 1;
    let d = 0;
    let f = 1;
    [...input].forEach(_ => {
      if (_.charCodeAt(0) > d) d = _.charCodeAt(0);
      f = Math.floor(this.seed / d);
      b = (b + _.charCodeAt(0) * f * this.factor) % this.seed;
    });
    let hex = (b * input?.length % this.seed).toString(16);
    hex = hex.padEnd(6, hex);
    return `#${hex}`;
  }

}
