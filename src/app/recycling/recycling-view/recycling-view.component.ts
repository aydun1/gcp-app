import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';
import { Cage } from '../shared/cage';
import { ActionButtonComponent } from '../shared/action-button/action-button.component';
import { CageDetailsComponent } from '../shared/cage-details/cage-details.component';
import { CageWeightsComponent } from '../shared/cage-weights/cage-weights.component';
import { CageMaterialComponent } from '../shared/cage-material/cage-material.component';
import { CageNotesComponent } from '../shared/cage-notes/cage-notes.component';
import { LoadingPageComponent } from '../../shared/loading/loading-page/loading-page.component';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-recycling-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatListModule, MatTableModule, MatToolbarModule, ActionButtonComponent, CageDetailsComponent, CageMaterialComponent, CageNotesComponent, CageWeightsComponent, LoadingPageComponent, LoadingRowComponent]
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
  public loading = new BehaviorSubject<boolean>(true);
  public loadingHistory = new BehaviorSubject<boolean>(true);
  public name!: string;

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
        this.name = this.isCage ? 'Cage' : _.fields.AssetType;
        this.getCageHistory(_.fields.CageNumber, _.fields.AssetType);
        this.loading.next(false);
      }),
    );
    this.getCage();
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print');
  }

  getCage(): void {
    this.cageSource$.next();
  }

  updating(e: boolean): void {
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

  getPrev(): Observable<string> {
    return this.recyclingService.getNextCageId(this.cageId, true);
  }

  getNext(): Observable<string> {
    return this.recyclingService.getNextCageId(this.cageId, false);
  }

  goBack(): void {
    this.navService.back();
  }
}
