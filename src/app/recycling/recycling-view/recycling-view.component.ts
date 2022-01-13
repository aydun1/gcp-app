import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';

@Component({
  selector: 'gcp-recycling-view',
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css']
})
export class RecyclingViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';

  private cageSource$ = new BehaviorSubject<void>(null);
  public cage$: Observable<any>;
  public cageId: string;
  public cageHistory$: Observable<any>;
  public noHistory: boolean;
  public displayedColumns = ['updated', 'customer', 'weight', 'nav'];
  public totalWeight: number;
  public isCage: boolean;
  public editCageNotes: boolean;
  public currentCageNotes: string;
  public newCageNotes: string;
  public loading = new BehaviorSubject<boolean>(true);
  public loadingHistory = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.cage$ = combineLatest([this.route.paramMap, this.cageSource$]).pipe(
      map(_ => _[0].get('id')),
      tap(() => this.loading.next(true)),
      switchMap(_ => this.recyclingService.getCage(_)),
      tap(_ => {
        this.cageId = _.fields.id;
        this.isCage = _.fields.AssetType.startsWith('Cage');
        this.currentCageNotes = _.fields.Notes;
        this.getCageHistory(_.fields.CageNumber);
        this.loading.next(false);
      }),
    );
    this.getCage();
  }

  getCage() {
    this.cageSource$.next();
  }

  getCageHistory(bin: number) {
    this.loadingHistory.next(true);
    this.cageHistory$ = this.recyclingService.getCageHistory(bin).pipe(
      tap(cages => {
        this.totalWeight = cages.map(_ => _.fields.NetWeight).filter(_ => _).reduce((acc, val) => acc + +val, 0);
        this.noHistory = cages.length === 0;
        this.loadingHistory.next(false);
      })
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
