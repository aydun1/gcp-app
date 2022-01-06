import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject, switchMap, tap } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';

@Component({
  selector: 'gcp-recycling-view',
  host: {class:'app-component'},
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css']
})
export class RecyclingViewComponent implements OnInit {
  private cageSource$ = new BehaviorSubject<void>(null);

  public cage$: Observable<any>;
  public cageHistory$: Observable<any>;
  public noHistory: boolean;
  public displayedColumns = ['updated', 'customer', 'weight'];
  public totalWeight: number;
  public isCage: boolean;
  public editCageNotes: boolean;
  public currentCageNotes: string;
  public newCageNotes: string;

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.cage$ = combineLatest([this.route.paramMap, this.cageSource$]).pipe(
      switchMap(_ => this.recyclingService.getCage(_[0].get('id'))),
      tap(_ => this.isCage = _.fields.AssetType.startsWith('Cage')),
      tap(_ => this.currentCageNotes = _.fields.Notes),
      tap(_ => this.getCageHistory(_.fields.CageNumber)),
    );
    this.getCage();
  }

  getCage() {
    this.cageSource$.next();
  }

  getCageHistory(bin: number) {
    this.cageHistory$ = this.recyclingService.getCageHistory(bin).pipe(
      tap(cages => this.totalWeight = cages.map(_ => _.fields.NetWeight).filter(_ => _).reduce((acc, val) => acc + val, 0)),
      tap(_ => this.noHistory = _.length === 0)
    );
  }

  setCageNotes(id: string) {
    this.recyclingService.setNotes(id, this.currentCageNotes).pipe(
      tap(() => {
        this.cageSource$.next();
        this.editCageNotes = false;
      })
    ).subscribe()
  }

  cancelEditCageNotes(notes: string) {
    this.currentCageNotes = notes;
    this.editCageNotes = false;
  }

  goBack() {
    this.navService.back();
  }
}
