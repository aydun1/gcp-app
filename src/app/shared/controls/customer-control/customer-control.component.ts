import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { NgFor, AsyncPipe } from '@angular/common';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl, FormControl, ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, Subject, switchMap, tap } from 'rxjs';

import { CustomersService } from '../../../customers/shared/customers.service';
import { Customer } from '../../../customers/shared/customer';

@Component({
    selector: 'gcp-customer-control',
    templateUrl: 'customer-control.component.html',
    styleUrls: ['customer-control.component.css'],
    providers: [{ provide: MatFormFieldControl, useExisting: CustomerControlComponent }],
    standalone: true,
    imports: [AsyncPipe, NgFor, ReactiveFormsModule, MatAutocompleteModule, MatInputModule, MatOptionModule]
})
export class CustomerControlComponent implements ControlValueAccessor, MatFormFieldControl<Customer>, OnDestroy, OnInit {
  @HostBinding() id = `customer-input-${CustomerControlComponent.nextId++}`;
  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  static nextId = 0;
  public stateChanges = new Subject<void>();
  public focused = false;
  public touched = false;
  public describedBy = '';
  public customer: Customer | null = null;
  public filteredOptions!: Observable<Customer[]>;
  public isDisabled = false;
  public myControl = new FormControl<Customer | null>(null, this.customerPickedValidator);

  onChange = (_: any) => {};
  onTouched = () => {};

  @ViewChild('customerInput', { static: false }) customerInput!: ElementRef<HTMLInputElement>;

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
  get value(): Customer | null { return this.customer }
  set value(customer: Customer | null) {
    this.myControl.setValue(customer);
    this.stateChanges.next();
  }

  @Input()
  set territory(value: string) {
    this._territory$.next(value);
  }
  private _territory$ = new BehaviorSubject<string>('');

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
    this.filteredOptions = combineLatest([this.myControl.valueChanges, this._territory$]).pipe(
      tap(([value, state]) => {if (!value) {this.customer = {} as Customer; this.addCustomer();}}),
      debounceTime(200),
      map(([value, state]) => [typeof value === 'string' ? value : value?.name, state]),
      switchMap(([name, state]) => this.customersService.getFirstPage({name, territory: state}))
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
      .querySelector('.customer-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick(event: MouseEvent): void {
    this.customerInput.nativeElement.focus();
  }

  addCustomer(): void {
    const customer = this.myControl.value;
    this.customer = customer;
    this.onChange(this.customer);
  }

  customerPickedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const unselected = control.value?.custNmbr;
      return unselected ? {forbiddenName: {value: control.value}} : null;
    };
  }

  customerDisplayFn(customer: Customer): string {
    return customer ? (customer.name ? customer.name + ' ' : '') + '(' + customer.custNmbr + ')' : '';
  }

  writeValue(customer: Customer | null): void {
    this.value = customer;
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
    this.onChange(this.customer);
  }
}
