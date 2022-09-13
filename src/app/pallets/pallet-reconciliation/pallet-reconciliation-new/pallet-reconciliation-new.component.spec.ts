import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletReconciliationNewComponent } from './pallet-reconciliation-new.component';

describe('PalletReconciliationComponent', () => {
  let component: PalletReconciliationNewComponent;
  let fixture: ComponentFixture<PalletReconciliationNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletReconciliationNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletReconciliationNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
