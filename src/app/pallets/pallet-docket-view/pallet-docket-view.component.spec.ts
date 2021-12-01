import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletDocketViewComponent } from './pallet-docket-view.component';

describe('PalletDocketViewComponent', () => {
  let component: PalletDocketViewComponent;
  let fixture: ComponentFixture<PalletDocketViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletDocketViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletDocketViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
