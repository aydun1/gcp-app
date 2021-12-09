import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPickerDialogComponent } from './customer-picker-dialog.component';

describe('CustomerPickerDialogComponent', () => {
  let component: CustomerPickerDialogComponent;
  let fixture: ComponentFixture<CustomerPickerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerPickerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerPickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});