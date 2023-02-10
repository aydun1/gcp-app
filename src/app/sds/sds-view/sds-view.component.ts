import { Component, HostBinding, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { NavigationService } from '../../navigation.service';
import { Chemical } from '../shared/chemical';
import { SdsService } from '../shared/sds.service';
import { SdsBackpackDialogComponent } from '../shared/sds-backpack-dialog/sds-backpack-dialog.component';

@Component({
  selector: 'gcp-sds-view',
  templateUrl: './sds-view.component.html',
  styleUrls: ['./sds-view.component.css']
})
export class SdsViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  private opened = false;
  public item$!: Observable<Chemical>;
  public itemNumber = this.route.snapshot.paramMap.get('id');
  public branch!: string;
  public refresh = new BehaviorSubject<boolean>(true);
  public definitions = this.sdsService.defs;

  constructor (
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private navService: NavigationService,
    private sdsService: SdsService
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
    return this.sdsService.getChemical(branch, itemNumber || '');
  }

  openBackpack(chemical: Chemical): void {
    this.opened = true;
    const dialogRef = this.dialog.open(SdsBackpackDialogComponent, {
      width: '800px',
      data: {chemical}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refresh.next(true);
    });
  }

  unlinkChemical(chemical: Chemical) {
    this.sdsService.unlinkChemicalFromItem(chemical.ItemNmbr).then(() => this.refresh.next(true));
  }

  getPdf(docNo: string): void {
    this.sdsService.getPdf(docNo);
  }

  getPdfPath(itemNmbr: string): string {
    return this.sdsService.pdfPath(itemNmbr);
  }

  goBack(): void {
    this.navService.back();
  }
}
