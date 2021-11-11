import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletReconciliationComponent } from './pallet-reconciliation.component';

describe('PalletReconciliationComponent', () => {
  let component: PalletReconciliationComponent;
  let fixture: ComponentFixture<PalletReconciliationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletReconciliationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletReconciliationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
