import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletInterstateTransferComponent } from './pallet-interstate-transfer.component';

describe('PalletInterstateTransferComponent', () => {
  let component: PalletInterstateTransferComponent;
  let fixture: ComponentFixture<PalletInterstateTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletInterstateTransferComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletInterstateTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
