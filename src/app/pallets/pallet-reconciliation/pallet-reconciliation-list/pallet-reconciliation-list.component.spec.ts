import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletReconciliationListComponent } from './pallet-reconciliation-list.component';

describe('PalletReconciliationListComponent', () => {
  let component: PalletReconciliationListComponent;
  let fixture: ComponentFixture<PalletReconciliationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletReconciliationListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletReconciliationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
