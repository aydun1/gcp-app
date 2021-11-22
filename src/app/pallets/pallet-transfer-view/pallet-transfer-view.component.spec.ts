import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletTransferViewComponent } from './pallet-transfer-view.component';

describe('PalletTransferViewComponent', () => {
  let component: PalletTransferViewComponent;
  let fixture: ComponentFixture<PalletTransferViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletTransferViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletTransferViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
