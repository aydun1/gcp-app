import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { PanListService } from '../pan-list.service';
import { RequestLine } from '../request-line';

@Component({
  selector: 'gcp-pan-list-simple',
  templateUrl: './pan-list-simple.component.html',
  styleUrls: ['./pan-list-simple.component.css']
})
export class PanListSimpleComponent implements OnInit {
  @Input() panLists!: Array<string[]>;
  @Output() addPanList = new EventEmitter<boolean>();
  @Output() deletePanList = new EventEmitter<string>();
  @Output() sendPanList = new EventEmitter<string>();

  @Input() scheduleId!: string;

  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public loading = this.panListService.loading;
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public totals!: object;
  public transferForm!: FormGroup;
  public columns = ['product', 'notes', 'transfer'];
  public panList: number | null = null;
  public selectedPanId!: string;

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

  get sent(): string {
    if (!this.selectedPanId) return '';
    const details = this.panLists?.find(_ => _[0] === `${this.selectedPanId}`) || [];
    return details && details[2] ? details[2] : '';
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
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
        toTransfer: new FormControl({value: _.fields.Quantity, disabled: false}),
        notes: [_.fields.Notes]
      });
      this.lines.push(formGroup);
    });
    return this.transferForm;
  }
  
  getRequestedQuantities(params: Params): Observable<RequestLine[]> {
    if (!params['pan']) return of([]);
    return this.panListService.getRequestedQuantities(this.scheduleId, params['pan']);
  }

  parseParams(params: Params): void {
    if ('pan' in params) {
      this.selectedPanId = params['pan'];
    } else {
      this.selectedPanId = '0';
    }
  }

  niceDate(date: string): string {
    return new Date(date).toDateString();
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!prev['pan'] && !curr['pan'] && this.panLists) {
      this.setPan(this.panLists[0][0]);
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

  setPan(panId: number | string): void {
    this.router.navigate([], { queryParams: {pan: panId}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  getTotalToTransfer(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.toTransfer, 0);
  }

  deleteItemsAndList(): void {
    this.panListService.deletePanList(this.scheduleId, this.selectedPanId).then(
      () => this.deletePanList.next(this.selectedPanId)
    );
  }

  sendList(): void {
    this.sendPanList.next(this.selectedPanId);
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

}
