import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletDialogComponent } from './pallet-dialog.component';

describe('PalletDialogComponent', () => {
  let component: PalletDialogComponent;
  let fixture: ComponentFixture<PalletDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
