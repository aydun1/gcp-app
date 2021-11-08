import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Cage } from '../shared/cage';
import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'app-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css']
})
export class RecyclingListComponent implements OnInit {
  public cages$: Observable<Cage[]>;

  constructor(
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.cages$ = this.recyclingService.getCages();
  }

}
