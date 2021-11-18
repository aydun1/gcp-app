import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer-list.component';

describe('PalletInterstateTransferListComponent', () => {
  let component: PalletInterstateTransferListComponent;
  let fixture: ComponentFixture<PalletInterstateTransferListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletInterstateTransferListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletInterstateTransferListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
