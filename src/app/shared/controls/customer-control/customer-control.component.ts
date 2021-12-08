import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, Input, OnDestroy, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl, FormControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject, Observable } from 'rxjs';
import { debounceTime, startWith, map, mergeMap, tap } from 'rxjs/operators';

import { CustomersService } from '../../../customers/shared/customers.service';
import { Customer } from '../../../customers/shared/customer';

@Component({
  selector: 'gcp-customer-control',
  templateUrl: 'customer-control.component.html',
  styleUrls: ['customer-control.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: CustomerControlComponent}],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
    '[attr.aria-describedby]': 'describedBy',
  }
})
export class CustomerControlComponent implements ControlValueAccessor, MatFormFieldControl<Customer>, OnDestroy {
  static nextId = 0;
  public stateChanges = new Subject<void>();
  public focused = false;
  public errorState = false;
  public id = `customer-input-${CustomerControlComponent.nextId++}`;
  public describedBy = '';
  public customer: Customer;
  public filteredOptions: Observable<any[]>;  
  public isDisabled = false;
  public myControl = new FormControl();

  onChange = (_: any) => {};
  onTouched = () => {};

  @ViewChild('customerInput', { static: false }) customerInput: ElementRef<HTMLInputElement>;

  get empty() {
    return !this.customer || Object.keys(this.customer).length === 0 && !this.myControl.value;
  }

  get shouldLabelFloat() { return this.focused || !this.empty; }

  @Input()
  get placeholder(): string { return this._placeholder; }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

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

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      tap(value => {if (!value) {this.customer = {} as Customer; this.addCustomer();}}),
      debounceTime(200),
      startWith<string | any>(''),
      map(value => typeof value === 'string' ? value : value.name),
      mergeMap((name: string) => this.customersService.getFirstPage({name}))
    );
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(event: MouseEvent) {
    this.customerInput.nativeElement.focus();
  }

  addCustomer() {
    console.log(this.myControl.value)
    const customer = this.myControl.value;
    this.customer = customer;
    this.onChange(this.customer);
  }

  customerDisplayFn(customer: Customer): string {
    console.log(customer)
    return customer ? (customer.name ? customer.name + ' ' : '') + '(' + customer.accountnumber + ')' : '';
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
