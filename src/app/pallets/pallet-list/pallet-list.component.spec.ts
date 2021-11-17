import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalletListComponent } from './pallet-list.component';

describe('PalletListComponent', () => {
  let component: PalletListComponent;
  let fixture: ComponentFixture<PalletListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalletListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalletListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
