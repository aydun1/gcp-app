import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RecyclingService } from '../shared/recycling.service';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'app-recycling-view',
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css']
})
export class RecyclingViewComponent implements OnInit {
  private id: string;
  public cage$: Observable<any>;
  public cageHistory$: Observable<any>;
  public noHistory: boolean;
  public displayedColumns = ['updated', 'customer', 'weight'];
  public weight: number;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.cage$ = this.getCage().pipe(tap(_ => console.log(_)));
  }

  getCage() {
    this.id = this.route.snapshot.paramMap.get('id');
    return this.recyclingService.getCage(this.id).pipe(
      tap((_: any) => this.getCageHistory(_.fields.BinNumber2))
    );
  }

  getCageHistory(bin: number) {
    this.cageHistory$ = this.recyclingService.getCageHistory(bin).pipe(
      tap(cages => this.weight = cages.map(_ => _.fields.Weight).filter(_ => _).reduce((acc, val) => acc + val, 0)),
      tap(_ => this.noHistory = _.length === 0)   
    );
  }

  goBack() {
    this.location.back();
  }
}
