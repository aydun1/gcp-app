import { Component, HostBinding, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';
import { Cage } from '../shared/cage';

@Component({
  selector: 'gcp-recycling-view',
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css']
})
export class RecyclingViewComponent implements OnDestroy, OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private cageSource$ = new BehaviorSubject<void>(undefined);
  public cage$!: Observable<Cage>;
  public cageId!: string;
  public cageNumber!: number;
  public cageHistory$!: Observable<Cage[]>;
  public displayedColumns = ['updated', 'customer', 'status', 'weight', 'nav'];
  public totalWeight!: number;
  public isCage!: boolean;
  public editCageNotes!: boolean;
  public currentCageNotes!: string;
  public newCageNotes!: string;
  public loading = new BehaviorSubject<boolean>(true);
  public loadingHistory = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    this.cage$ = combineLatest([this.route.paramMap, this.cageSource$]).pipe(
      map(_ => _[0].get('id')),
      tap(() => this.loading.next(true)),
      switchMap(_ => this.recyclingService.getCage(_)),
      tap(_ => {
        this.cageId = _.fields.id;
        this.cageNumber = _.fields.CageNumber;
        this.isCage = _.fields.AssetType.startsWith('Cage');
        this.currentCageNotes = _.fields.Notes;
        this.getCageHistory(_.fields.CageNumber, _.fields.AssetType);
        this.loading.next(false);
      }),
    );
    this.getCage();
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }

  getCage(): void {
    this.cageSource$.next();
  }

  updating(e: boolean) {
    this.loading.next(e);
  }

  getCageHistory(bin: number, cageType: string): void {
    this.cageHistory$ = this.recyclingService.getCageHistory(bin, cageType).pipe(
      tap(cages => {
        this.totalWeight = cages.map(_ => _.fields.NetWeight).filter(_ => _).reduce((acc, val) => acc + +val, 0);
        this.loadingHistory.next(false);
      })
    );
  }

  setCageNotes(id: string): void {
    this.recyclingService.setNotes(id, this.currentCageNotes).pipe(
      tap(() => {
        this.cageSource$.next();
        this.editCageNotes = false;
      })
    ).subscribe();
  }

  cancelEditCageNotes(notes: string): void {
    this.currentCageNotes = notes;
    this.editCageNotes = false;
  }

  goBack(): void {
    this.navService.back();
  }
}
