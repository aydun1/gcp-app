import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer-new.component';

describe('PalletInterstateTransferComponent', () => {
  let component: PalletInterstateTransferNewComponent;
  let fixture: ComponentFixture<PalletInterstateTransferNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletInterstateTransferNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletInterstateTransferNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
