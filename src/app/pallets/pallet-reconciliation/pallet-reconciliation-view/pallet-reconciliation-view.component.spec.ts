import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletReconciliationViewComponent } from './pallet-reconciliation-view.component';

describe('PalletReconciliationViewComponent', () => {
  let component: PalletReconciliationViewComponent;
  let fixture: ComponentFixture<PalletReconciliationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletReconciliationViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletReconciliationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
