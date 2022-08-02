import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletDocketDialogComponent } from './pallet-docket-dialog.component';

describe('PalletDocketDialogComponent', () => {
  let component: PalletDocketDialogComponent;
  let fixture: ComponentFixture<PalletDocketDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletDocketDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PalletDocketDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
