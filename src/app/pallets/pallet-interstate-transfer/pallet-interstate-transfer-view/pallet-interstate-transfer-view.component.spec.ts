import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletInterstateTransferViewComponent } from './pallet-interstate-transfer-view.component';

describe('PalletTransferViewComponent', () => {
  let component: PalletInterstateTransferViewComponent;
  let fixture: ComponentFixture<PalletInterstateTransferViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletInterstateTransferViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletInterstateTransferViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
