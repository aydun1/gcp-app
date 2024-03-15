import { Component, HostBinding, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject, combineLatest, Observable, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { NavigationService } from '../../navigation.service';
import { Chemical } from '../shared/chemical';
import { ChemicalService } from '../shared/chemical.service';
import { ChemicalBackpackDialogComponent } from '../shared/chemical-backpack-dialog/chemical-backpack-dialog.component';


@Component({
  selector: 'gcp-chemical-view',
  templateUrl: './chemical-view.component.html',
  styleUrls: ['./chemical-view.component.css'],
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatCardModule, MatIconModule, MatListModule, MatToolbarModule]
})
export class ChemicalViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  private opened = false;
  public item$!: Observable<Chemical>;
  public itemNumber = this.route.snapshot.paramMap.get('id');
  public branch!: string;
  public refresh = new BehaviorSubject<boolean>(true);
  public definitions = this.chemicalService.defs;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private navService: NavigationService,
    private chemicalService: ChemicalService
  ) {}

  ngOnInit(): void {
    this.item$ = combineLatest([this.route.paramMap, this.sharedService.getBranch(), this.refresh]).pipe(
      tap(([params, _]) => this.itemNumber = params.get('id')),
      switchMap(([params, _]) => this.getItem(params.get('id'), _)),
      tap(chemical => {
        if (!chemical.sdsExists && !this.opened) this.openBackpack(chemical);
      })
    );
    this.refresh.next(true);
  }

  getItem(itemNumber: string | null, branch: string): Promise<Chemical> {
    return this.chemicalService.getChemical(branch, itemNumber || '');
  }

  openBackpack(chemical: Chemical): void {
    this.opened = true;
    const dialogRef = this.dialog.open(ChemicalBackpackDialogComponent, {
      width: '800px',
      data: {chemical}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refresh.next(true);
    });
  }

  unlinkChemical(chemical: Chemical) {
    this.chemicalService.unlinkChemicalFromItem(chemical.ItemNmbr).then(() => this.refresh.next(true));
  }

  getPdf(docNo: string): void {
    this.chemicalService.getPdf(docNo);
  }

  getPdfPath(itemNmbr: string): string {
    return this.chemicalService.pdfPath(itemNmbr);
  }

  goBack(): void {
    this.navService.back();
  }
}
