import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RecyclingService } from '../shared/recycling.service';
import { BehaviorSubject, Observable, Subject, switchMap, tap } from 'rxjs';

@Component({
  selector: 'gcp-recycling-view',
  host: {class:'app-component'},
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css']
})
export class RecyclingViewComponent implements OnInit {
  private id: string;
  private cageSource$: Subject<string>;

  public cage$: Observable<any>;
  public cageHistory$: Observable<any>;
  public noHistory: boolean;
  public displayedColumns = ['updated', 'customer', 'weight'];
  public totalWeight: number;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.cageSource$ = new BehaviorSubject(this.id);
    this.cage$ = this.cageSource$.pipe(
      switchMap(_ => this.recyclingService.getCage(_)),
      tap(_ => this.getCageHistory(_.fields.CageNumber))
    );
  }

  getCage() {
    this.cageSource$.next(this.id);
  }

  getCageHistory(bin: number) {
    this.cageHistory$ = this.recyclingService.getCageHistory(bin).pipe(
      tap(cages => this.totalWeight = cages.map(_ => _.fields.NetWeight).filter(_ => _).reduce((acc, val) => acc + val, 0)),
      tap(_ => this.noHistory = _.length === 0)
    );
  }

  goBack() {
    this.location.back();
  }
}
