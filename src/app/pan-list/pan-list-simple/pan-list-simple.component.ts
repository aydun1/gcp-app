import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { PanListService } from '../pan-list.service';
import { RequestLine } from '../request-line';

@Component({
  selector: 'gcp-pan-list-simple',
  templateUrl: './pan-list-simple.component.html',
  styleUrls: ['./pan-list-simple.component.css']
})
export class PanListSimpleComponent implements OnInit {
  @Input() panLists!: Array<number[]>;
  @Output() addPanList = new EventEmitter<boolean>();
  @Output() deletePanList = new EventEmitter<number>();

  @Input() scheduleId!: string;

  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public loading = this.panListService.loading;
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public totals!: object;
  public transferForm!: FormGroup;
  public columns = ['product', 'transfer'];
  public panList: number | null = null;
  public selectedPan!: number;

  public get displayedColumns(): Array<string> {
    return this.columns;
  }

  public get lines(): FormArray<FormGroup> {
    return this.transferForm.get('lines') as FormArray;
  }

  public get transferQty(): number {
    return this.lines.value.reduce((acc, cur) => acc + cur['toTransfer']
  , 0);
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private panListService: PanListService
  ) { }

  ngOnInit(): void {
    this.transferForm = this.fb.group({
      lines: this.fb.array([]),
    });

    this.interstateTransfers$ = this.route.queryParams.pipe(
      startWith({}),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this._loadList ? this.getRequestedQuantities(_) : []),
      tap(_ => this._InterstateTransferSubject$.next(this.makeFormGroup(_))),
      switchMap(_ => this._InterstateTransferSubject$),
    )
  }

  makeFormGroup(lines: Array<RequestLine>): FormGroup<any> {
    this.lines.clear();
    let i = -1;
    lines.forEach(_ => {
      const formGroup = this.fb.group({
        index: [i += 1],
        id: [_.id],
        itemNumber: [_.fields.ItemNumber],
        itemDescription: [_.fields.ItemDescription],
        toTransfer: new FormControl({value: _.fields.Quantity, disabled: false})
      });
      this.lines.push(formGroup);
    });
    return this.transferForm;
  }
  
  getRequestedQuantities(params: Params): Observable<RequestLine[]> {
    if (!params['pan']) return of([]);
    return this.panListService.getRequestedQuantities(this.scheduleId, params['pan']);
  }

  updatePanList(itemNumber: string | null | undefined, itemDescription: string | null | undefined, quantity: number | null | undefined) {
    if (!itemNumber) return;
    this.panListService.setRequestedQuantities(quantity, itemNumber, itemDescription, this.scheduleId, 1);
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('pan' in params) {
      this.selectedPan = params['pan'];
    } else {
      this.selectedPan = 0;
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (this.route.children.length) {
      this._loadList = false;
    }
    if (!this._loadList) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const samePan = prev['pan'] === curr['pan'];
    return this._loadList && samePan;
  }

  setPan(panId: MatButtonToggleChange): void {
    this.router.navigate([], { queryParams: {pan: panId.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  getTotalToTransfer(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.toTransfer, 0);
  }

  deleteItemsAndList() {
    this.panListService.deletePanList(this.scheduleId, this.selectedPan).then(
      () => {
        this.deletePanList.next(this.selectedPan)
      }
    );
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

}
