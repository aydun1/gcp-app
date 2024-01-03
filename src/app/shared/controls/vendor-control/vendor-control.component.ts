import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { combineLatest, debounceTime, map, Observable, Subject, switchMap, tap } from 'rxjs';

import { CustomersService } from '../../../customers/shared/customers.service';
import { Vendor } from '../../../customers/shared/vendor';

@Component({
  selector: 'gcp-vendor-control',
  templateUrl: 'vendor-control.component.html',
  styleUrls: ['vendor-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: VendorControlComponent}]
})
export class VendorControlComponent implements ControlValueAccessor, MatFormFieldControl<Vendor>, OnDestroy, OnInit {
  @HostBinding() id = `vendor-input-${VendorControlComponent.nextId++}`;
  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  static nextId = 0;
  public stateChanges = new Subject<void>();
  public focused = false;
  public touched = false;
  public describedBy = '';
  public vendor: Vendor | null = null;
  public filteredOptions!: Observable<Vendor[]>;
  public isDisabled = false;
  public myControl = new FormControl<Vendor | null>(null, this.vendorPickedValidator);

  onChange = (_: any) => {};
  onTouched = () => {};

  @ViewChild('vendorInput', { static: false }) vendorInput!: ElementRef<HTMLInputElement>;

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
  get value(): Vendor | null { return this.vendor }
  set value(vendor: Vendor | null) {
    this.myControl.setValue(vendor);
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return this.myControl.invalid && this.touched;
  }

  constructor(
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    private customersService: CustomersService,
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
    this.filteredOptions = combineLatest([this.myControl.valueChanges]).pipe(
      tap(([value]) => {if (!value) {this.vendor = {} as Vendor; this.addVendor();}}),
      debounceTime(200),
      map(([value]) => [typeof value === 'string' ? value : value?.name]),
      switchMap(([name]) => this.customersService.getVendors(name || ''))
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
      .querySelector('.vendor-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick(event: MouseEvent): void {
    this.vendorInput.nativeElement.focus();
  }

  addVendor(): void {
    const vendor = this.myControl.value;
    this.vendor = vendor;
    this.onChange(this.vendor);
  }

  vendorPickedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const unselected = control.value?.vendId;
      return unselected ? {forbiddenName: {value: control.value}} : null;
    };
  }

  vendorDisplayFn(vendor: Vendor): string {
    return vendor ? (vendor.name ? vendor.name + ' ' : '') + '(' + vendor.vendId + ')' : '';
  }

  writeValue(vendor: Vendor | null): void {
    this.value = vendor;
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
    this.onChange(this.vendor);
  }
}
