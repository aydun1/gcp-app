import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletViewComponent } from './pallet-view.component';

describe('PalletViewComponent', () => {
  let component: PalletViewComponent;
  let fixture: ComponentFixture<PalletViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
