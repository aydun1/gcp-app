import { Component, Input, OnInit } from '@angular/core';
import { Cage } from '../cage';

@Component({
  selector: 'gcp-cage-details',
  templateUrl: './cage-details.component.html',
  styleUrls: ['./cage-details.component.css']
})
export class CageDetailsComponent {

  @Input() cage: Cage;

  constructor() { }

}
