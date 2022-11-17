import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatLegacyFormFieldControl as MatFormFieldControl } from '@angular/material/legacy-form-field';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, Subject, switchMap, tap } from 'rxjs';

import { PanListService } from '../../../pan-list/pan-list.service';
import { SuggestedItem } from '../../../pan-list/suggested-item';

@Component({
  selector: 'gcp-item-control',
  templateUrl: 'item-control.component.html',
  styleUrls: ['item-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: ItemControlComponent}]
})
export class ItemControlComponent implements ControlValueAccessor, MatFormFieldControl<SuggestedItem>, OnDestroy, OnInit {
  @HostBinding() id = `item-input-${ItemControlComponent.nextId++}`;
  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  static nextId = 0;
  public stateChanges = new Subject<void>();
  public focused = false;
  public touched = false;
  public describedBy = '';
  public item: SuggestedItem | null = null;
  public filteredOptions!: Observable<SuggestedItem[]>;  
  public isDisabled = false;
  public myControl = new FormControl<SuggestedItem | null>(null, this.itemPickedValidator);
  public loading = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  @ViewChild('itemInput', { static: false }) itemInput!: ElementRef<HTMLInputElement>;

  get empty(): boolean {
    return !this.myControl.value;
  }

  @Input()
  get placeholder(): string { return this._placeholder; }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder!: string;

  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get appearance(): string { return this._appearance; }
  set appearance(value: string) {
    this._appearance = value;
    this.stateChanges.next();
  }
  private _appearance = 'standard';

  @Input()
  get disabled(): boolean { return this.isDisabled; }
  set disabled(value: boolean) {
    this.isDisabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get value(): SuggestedItem | null { return this.item }
  set value(item: SuggestedItem | null) {
    this.myControl.setValue(item);
    this.stateChanges.next();
  }

  @Input()
  set territory(value: string | null) {
    this._territory$.next(value || '');
  }
  private _territory$ = new BehaviorSubject<string>('');

  get errorState(): boolean {
    return this.myControl.invalid && this.touched;
  }

  constructor(
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    private panListService: PanListService,
    @Optional() @Self() public ngControl: NgControl
  ) {
    _focusMonitor.monitor(_elementRef, true).subscribe(origin => {
      if (this.focused && !origin) {
        this.onTouched();
      }
      this.focused = !!origin;
      this.stateChanges.next();
    });

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.filteredOptions = combineLatest([this.myControl.valueChanges, this._territory$]).pipe(
      tap(([value, branch]) => {
        if (!value) {this.item = {} as SuggestedItem; this.addItem();}
        this.loading = true;
      }),
      debounceTime(200),
      map(([value, branch]) => [typeof value === 'string' ? value : value?.ItemNmbr, branch]),
      switchMap(([searchTerm, branch]) => this.panListService.searchItems(branch, searchTerm)),
      tap(() => this.loading = false)
    );
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  onFocusIn(event: FocusEvent): void {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent): void {
    if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]): void {
    const controlElement = this._elementRef.nativeElement
      .querySelector('.item-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick(event: MouseEvent): void {
    this.itemInput.nativeElement.focus();
  }

  addItem(): void {
    const item = this.myControl.value;
    this.item = item;
    this.onChange(this.item);
  }

  itemPickedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const unselected = control.value?.itemNmbr;
      return unselected ? {forbiddenName: {value: control.value}} : null;
    };
  }

  itemDisplayFn(item: SuggestedItem): string {
    return item ? (item.ItemNmbr ? item.ItemNmbr + ' ' : '') + '(' + item.ItemNmbr + ')' : '';
  }

  writeValue(item: SuggestedItem | null): void {
    this.value = item;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  _handleInput(): void {
    this.onChange(this.item);
  }
}
