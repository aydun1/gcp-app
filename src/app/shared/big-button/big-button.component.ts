import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gcp-big-button',
  templateUrl: './big-button.component.html',
  styleUrls: ['./big-button.component.css'],
  standalone: true,
  imports: [NgIf, RouterModule, MatIconModule, MatRippleModule]
})
export class BigButtonComponent {

  @Input() public icon!: string;
  @Input() public text!: string;
  @Input() public target!: Array<string>;

  constructor() { }

}
