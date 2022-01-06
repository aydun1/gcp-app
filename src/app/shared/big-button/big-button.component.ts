import { Component, Input } from '@angular/core';

@Component({
  selector: 'gcp-big-button',
  templateUrl: './big-button.component.html',
  styleUrls: ['./big-button.component.css']
})
export class BigButtonComponent {

  @Input() public text: string;
  @Input() public target: Array<string>;

  constructor() { }

}
