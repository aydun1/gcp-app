import { Component, HostBinding, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';

import { NavigationService } from '../../navigation.service';
import { Chemical } from '../chemical';
import { SdsService } from '../sds.service';
import { SdsBackpackDialogComponent } from '../shared/sds-backpack-dialog/sds-backpack-dialog.component';

@Component({
  selector: 'gcp-sds-view',
  templateUrl: './sds-view.component.html',
  styleUrls: ['./sds-view.component.css']
})
export class SdsViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  public item$!: Observable<Chemical>;
  public itemNumber = this.route.snapshot.paramMap.get('id');
  public branch!: string;
  public refresh = new BehaviorSubject<boolean>(true);
  private opened = false;

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
      tap(_ => {
        if (!_.sdsExists && !this.opened) this.openBackpack();
      })
    );
    this.refresh.next(true);
  }

  getItem(itemNumber: string | null, branch: string): Promise<Chemical> {
    return this.sdsService.getChemical(branch, itemNumber || '');
  }

  openBackpack(): void {
    this.opened = true;
    const dialogRef = this.dialog.open(SdsBackpackDialogComponent, {
      autoFocus: false,
      width: '800px',
      data: {itemNumber: this.itemNumber}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refresh.next(true);
    });
  }

  getPdf(docNo: string) {
    this.sdsService.getPdf(docNo);
  }

  goBack(): void {
    this.navService.back();
  }
}
