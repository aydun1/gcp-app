import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletCustomerListDialogComponent } from './pallet-customer-list-dialog.component';

describe('PalletListComponent', () => {
  let component: PalletCustomerListDialogComponent;
  let fixture: ComponentFixture<PalletCustomerListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletCustomerListDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletCustomerListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
