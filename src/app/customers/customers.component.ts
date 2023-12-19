import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'gcp-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  standalone: true,
  imports: [RouterModule]
})
export class CustomersComponent {
  constructor() { }

}